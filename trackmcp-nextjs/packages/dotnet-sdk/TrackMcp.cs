using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace TrackMcp;

public sealed record TrackMcpOptions(string ApiKey, string Service = "mcp-server", string Environment = "production", string Endpoint = "https://trackmcp.com/api/v1/ingest", string? ServerVersion = null, string? SdkVersion = null, string? DeploymentId = null, Func<string?>? AccountIdResolver = null);

public sealed class TrackMcpClient : IDisposable
{
	private const int MaxSessionIdLength = 256;
    private readonly TrackMcpOptions _options;
    private readonly HttpClient _http;
    private readonly List<Dictionary<string, object?>> _queue = new();
    private readonly object _gate = new();

    private static readonly HashSet<string> SensitiveKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "password", "passwd", "secret", "token", "access_token", "refresh_token",
        "authorization", "cookie", "set-cookie", "api_key", "apikey"
    };
    private static readonly HashSet<string> ProtocolSignals = new(StringComparer.Ordinal)
    {
        "progress", "cancelled", "catalog_changed", "resource_changed", "prompt_changed",
        "subscription_started", "subscription_stopped"
    };
    private static readonly HashSet<string> CatalogKinds = new(StringComparer.Ordinal)
    {
        "tools", "resources", "resource_templates", "prompts"
    };

    private static JsonNode? SanitizePayload(object? payload, int depth = 0)
    {
        if (payload is null) return null;
        JsonNode? node;
        try { node = JsonSerializer.SerializeToNode(payload); } catch { return new JsonObject { ["__trackmcp_omitted"] = true }; }
        return SanitizeNode(node, depth);
    }

    private static JsonNode? SanitizeNode(JsonNode? node, int depth)
    {
        if (node is null) return null;
        if (depth > 3) return new JsonObject { ["__trackmcp_truncated"] = true, ["reason"] = "max_payload_depth" };
        if (node is JsonValue value)
        {
            if (value.TryGetValue<string>(out var text) && text.Length > 256) return JsonValue.Create(text[..256]);
            return value.DeepClone();
        }
        if (node is JsonArray array)
        {
            var result = new JsonArray();
            for (var index = 0; index < array.Count && index < 24; index++) result.Add(SanitizeNode(array[index], depth + 1));
            if (array.Count > 24) result.Add(new JsonObject { ["__trackmcp_truncated"] = true, ["reason"] = "max_payload_keys" });
            return result;
        }
        if (node is JsonObject obj)
        {
            var result = new JsonObject();
            var count = 0;
            foreach (var property in obj)
            {
                if (count++ >= 24) { result["__trackmcp_truncated"] = true; break; }
                result[property.Key] = SensitiveKeys.Contains(property.Key)
                    ? JsonValue.Create("[redacted]")
                    : SanitizeNode(property.Value, depth + 1);
            }
            return result;
        }
        return new JsonObject { ["__trackmcp_omitted"] = true };
    }

    public TrackMcpClient(TrackMcpOptions options, HttpClient? httpClient = null) { _options = options; _http = httpClient ?? new HttpClient(); }

    public void Capture(string eventType, string method, object? payload = null, string? sessionId = null, bool? success = null, long? durationMs = null, string? toolName = null, string? resultType = null, string? taskStatus = null, int? inputRequestCount = null, int? inputResponseCount = null, string? catalogKind = null, int? catalogItemCount = null, IReadOnlyList<string>? catalogItemNameHashes = null, IReadOnlyList<string>? catalogItemUriHashes = null, string? direction = null, string? transport = null)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey)) return;
        var account = ResolveAccount();
        var item = new Dictionary<string, object?> { ["event_id"] = Guid.NewGuid().ToString(), ["event_type"] = eventType, ["service"] = _options.Service, ["environment"] = _options.Environment, ["direction"] = direction, ["transport"] = transport, ["mcp_method"] = method, ["session_id"] = sessionId, ["tool_name"] = toolName, ["started_at"] = DateTimeOffset.UtcNow.ToString("O"), ["duration_ms"] = durationMs, ["success"] = success, ["is_error"] = success is false, ["result_type"] = resultType, ["task_status"] = taskStatus, ["input_request_count"] = inputRequestCount, ["input_response_count"] = inputResponseCount, ["catalog_kind"] = catalogKind, ["catalog_item_count"] = catalogItemCount, ["catalog_item_name_hashes"] = catalogItemNameHashes, ["catalog_item_uri_hashes"] = catalogItemUriHashes, ["account_key"] = account.Key, ["account_identity_source"] = account.Source, ["payload"] = SanitizePayload(payload), ["server_version"] = _options.ServerVersion, ["sdk_version"] = _options.SdkVersion, ["deployment_id"] = _options.DeploymentId };
        lock (_gate) { _queue.Add(item); }
    }

    private (string? Key, string? Source) ResolveAccount()
    {
        if (_options.AccountIdResolver is null) return (null, null);
        string? value;
        try { value = _options.AccountIdResolver(); } catch { return (null, "unresolved"); }
        var bounded = value?.Trim();
        if (string.IsNullOrEmpty(bounded) || bounded.Length > 256 || bounded.Any(char.IsControl) || bounded.Contains('@') || bounded.Contains("://", StringComparison.Ordinal) || bounded.StartsWith("eyJ", StringComparison.OrdinalIgnoreCase) || bounded.StartsWith("tmcp_", StringComparison.OrdinalIgnoreCase) || bounded.StartsWith("sk-", StringComparison.OrdinalIgnoreCase) || bounded.StartsWith("bearer ", StringComparison.OrdinalIgnoreCase)) return (null, "unresolved");
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(bounded))).ToLowerInvariant();
        return (hash, "resolver");
    }

    /// <summary>Records allowlisted MRTR/task result metadata without result content.</summary>
    public void RecordProtocolResult(string method, JsonObject result, string? sessionId = null)
    {
        if (string.IsNullOrWhiteSpace(method) || method.Length > 128 || method.Any(char.IsControl)) return;
        var resultType = ReadAllowlisted(result, new[] { "resultType", "result_type" }, "complete", "input_required", "task");
        var taskStatus = ReadAllowlisted(result, new[] { "taskStatus", "task_status" }, "working", "input_required", "completed", "failed", "cancelled", "expired");
        var isError = ReadBool(result, "isError", "is_error");
        var metadata = new Dictionary<string, object?> { ["observation_kind"] = "protocol_response", ["observation_source"] = "server" };
        if (method == "completion/complete" && result["completion"] is JsonObject completion)
        {
            metadata["protocol_family"] = "completion";
            if (completion["values"] is JsonArray values) metadata["completion_value_count"] = Math.Min(32, values.Count);
            if (completion["total"] is JsonValue total && total.TryGetValue<int>(out var totalValue) && totalValue is >= 0 and <= 1_000_000) metadata["completion_total"] = totalValue;
            if (completion["hasMore"] is JsonValue hasMore && hasMore.TryGetValue<bool>(out var more)) metadata["completion_has_more"] = more;
            else if (completion["has_more"] is JsonValue snakeMore && snakeMore.TryGetValue<bool>(out var snake)) metadata["completion_has_more"] = snake;
        }
        Capture("protocol", method, new Dictionary<string, object?> { ["_trackmcp"] = metadata }, BoundSessionId(sessionId), isError is true ? false : true, resultType: resultType, taskStatus: taskStatus, inputRequestCount: BoundedCount(result, "inputRequests", "input_requests"), inputResponseCount: BoundedCount(result, "inputResponses", "input_responses"));
    }

    private static string? ReadAllowlisted(JsonObject result, string[] keys, params string[] allowed)
    {
        foreach (var key in keys)
        {
            try
            {
                var value = result[key]?.GetValue<string>();
                if (value is not null && allowed.Contains(value, StringComparer.Ordinal)) return value;
            }
            catch (InvalidOperationException) { }
        }
        return null;
    }

    private static bool? ReadBool(JsonObject result, params string[] keys)
    {
        foreach (var key in keys)
        {
            try { if (result[key] is JsonNode node) return node.GetValue<bool>(); }
            catch (InvalidOperationException) { }
        }
        return null;
    }

    private static int? BoundedCount(JsonObject result, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (result[key] is JsonArray array) return Math.Min(100, array.Count);
            if (result[key] is JsonObject obj) return Math.Min(100, obj.Count);
        }
        return null;
    }

    /// <summary>Records a bounded, metadata-only transport disconnect or error.</summary>
    /// <remarks>Exception text, URLs, headers, and payloads are never accepted.</remarks>
    public void RecordTransportFailure(string kind = "transport_error", string? sessionId = null, long durationMs = 0)
        => RecordTransportFailureForTransport(kind, null, sessionId, durationMs);

    /// <summary>Records a bounded transport failure with a caller-verified MCP transport label.</summary>
    public void RecordTransportFailureForTransport(string kind, string? transport, string? sessionId = null, long durationMs = 0)
    {
        if (kind is not ("transport_error" or "transport_closed")) return;
        if (transport is not (null or "stdio" or "streamable_http" or "sse" or "custom")) return;
        var boundedDuration = Math.Clamp(durationMs, 0, 86_400_000);
        Capture("session", "transport", new Dictionary<string, object?>
        {
            ["_trackmcp"] = new Dictionary<string, object?>
            {
                ["observation_kind"] = kind,
                ["observation_source"] = "transport"
            }
        }, BoundSessionId(sessionId), false, boundedDuration, transport: transport);
    }

    /// <summary>Records one allowlisted protocol notification without payload values.</summary>
    /// <remarks>Progress values, cancellation reasons, URIs, and caller data are never accepted.</remarks>
    public void RecordProtocolSignal(string signal, string method, string? sessionId = null, string direction = "server_to_client")
        => RecordProtocolSignalForTransport(signal, method, null, sessionId, direction);

    /// <summary>Records an allowlisted notification with a caller-verified transport label.</summary>
    public void RecordProtocolSignalForTransport(string signal, string method, string? transport, string? sessionId = null, string direction = "server_to_client")
    {
        if (!ProtocolSignals.Contains(signal) || (direction is not ("server_to_client" or "client_to_server")) || string.IsNullOrWhiteSpace(method) || method.Length > 128 || method.Any(char.IsControl)) return;
        if (transport is not (null or "stdio" or "streamable_http" or "sse" or "custom")) return;
        Capture("protocol", method, new Dictionary<string, object?>
        {
            ["_trackmcp"] = new Dictionary<string, object?>
            {
                ["observation_kind"] = "protocol_notification",
                ["protocol_signal"] = signal
            }
        }, BoundSessionId(sessionId), true, direction: direction, transport: transport);
    }

    /// <summary>Records one bounded catalog page using hashes/counts only.</summary>
    /// <remarks>Names, URIs, schemas, descriptions, and cursor values never cross the event boundary.</remarks>
    public void RecordCatalog(string kind, string method, JsonObject result, string? sessionId = null)
    {
        if (!CatalogKinds.Contains(kind) || string.IsNullOrWhiteSpace(method) || method.Length > 128 || method.Any(char.IsControl)) return;
        var key = kind == "resource_templates" ? "resourceTemplates" : kind;
        var items = result[key] as JsonArray;
        var names = new List<string>();
        var uris = new List<string>();
        if (items is not null)
        {
            foreach (var item in items.Take(128))
            {
                if (item is not JsonObject obj) continue;
                if (obj["name"] is JsonValue name && name.TryGetValue<string>(out var nameValue) && !string.IsNullOrEmpty(nameValue)) names.Add(HashCatalogIdentity(nameValue));
                var uriKey = kind == "resource_templates" ? "uriTemplate" : "uri";
                if (obj[uriKey] is JsonValue uri && uri.TryGetValue<string>(out var uriValue) && !string.IsNullOrEmpty(uriValue)) uris.Add(HashCatalogIdentity(uriValue));
            }
        }
        var cursorPresent = result["nextCursor"] is not null || result["next_cursor"] is not null;
        var cacheTtl = BoundedCacheTtl(result);
        var cacheScope = BoundedCacheScope(result);
        var metadata = new Dictionary<string, object?>
        {
            ["observation_kind"] = "catalog_page",
            ["catalog_kind"] = kind,
            ["next_cursor_present"] = cursorPresent,
        };
        if (cacheTtl is not null) metadata["cache_ttl_ms"] = cacheTtl;
        if (cacheScope is not null) metadata["cache_scope"] = cacheScope;
        Capture("catalog", method, new Dictionary<string, object?>
        {
            ["_trackmcp"] = metadata
        }, BoundSessionId(sessionId), true, catalogKind: kind, catalogItemCount: items?.Count ?? 0, catalogItemNameHashes: names, catalogItemUriHashes: uris);
    }

    private static int? BoundedCacheTtl(JsonObject result)
    {
        foreach (var key in new[] { "ttlMs", "ttl_ms" })
        {
            if (result[key] is JsonValue value && value.TryGetValue<int>(out var ttl) && ttl is >= 0 and <= 86_400_000) return ttl;
        }
        return null;
    }

    private static string? BoundedCacheScope(JsonObject result)
    {
        foreach (var key in new[] { "cacheScope", "cache_scope" })
        {
            if (result[key] is JsonValue value && value.TryGetValue<string>(out var scope) && (scope is "public" or "private")) return scope;
        }
        return null;
    }

    private static string BoundSessionId(string? sessionId)
    {
        var value = sessionId?.Trim();
        if (string.IsNullOrEmpty(value)) return "transport-session";
        return value.Length <= MaxSessionIdLength ? value : value[..MaxSessionIdLength];
    }

    private static string HashCatalogIdentity(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();

    public async Task FlushAsync(CancellationToken cancellationToken = default)
    {
        List<Dictionary<string, object?>> events;
        lock (_gate) { if (_queue.Count == 0) return; events = new List<Dictionary<string, object?>>(_queue); _queue.Clear(); }
        using var request = new HttpRequestMessage(HttpMethod.Post, _options.Endpoint) { Content = new StringContent(JsonSerializer.Serialize(new { events }), Encoding.UTF8, "application/json") };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        try { using var response = await _http.SendAsync(request, cancellationToken); if (!response.IsSuccessStatusCode) lock (_gate) { _queue.InsertRange(0, events); } } catch { lock (_gate) { _queue.InsertRange(0, events); } }
    }

    public void Dispose() { FlushAsync().GetAwaiter().GetResult(); _http.Dispose(); }
}
