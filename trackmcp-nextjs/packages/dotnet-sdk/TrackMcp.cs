using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace TrackMcp;

public sealed record TrackMcpOptions(string ApiKey, string Service = "mcp-server", string Environment = "production", string Endpoint = "https://trackmcp.com/api/v1/ingest", string? ServerVersion = null, string? SdkVersion = null, string? DeploymentId = null);

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
        "progress", "cancelled", "catalog_changed", "resource_changed", "prompt_changed"
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

    public void Capture(string eventType, string method, object? payload = null, string? sessionId = null, bool? success = null, long? durationMs = null, string? toolName = null, string? resultType = null, string? taskStatus = null, int? inputRequestCount = null, int? inputResponseCount = null)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey)) return;
        var item = new Dictionary<string, object?> { ["event_id"] = Guid.NewGuid().ToString(), ["event_type"] = eventType, ["service"] = _options.Service, ["environment"] = _options.Environment, ["mcp_method"] = method, ["session_id"] = sessionId, ["tool_name"] = toolName, ["started_at"] = DateTimeOffset.UtcNow.ToString("O"), ["duration_ms"] = durationMs, ["success"] = success, ["is_error"] = success is false, ["result_type"] = resultType, ["task_status"] = taskStatus, ["input_request_count"] = inputRequestCount, ["input_response_count"] = inputResponseCount, ["payload"] = SanitizePayload(payload), ["server_version"] = _options.ServerVersion, ["sdk_version"] = _options.SdkVersion, ["deployment_id"] = _options.DeploymentId };
        lock (_gate) { _queue.Add(item); }
    }

    /// <summary>Records allowlisted MRTR/task result metadata without result content.</summary>
    public void RecordProtocolResult(string method, JsonObject result, string? sessionId = null)
    {
        if (string.IsNullOrWhiteSpace(method) || method.Length > 128 || method.Any(char.IsControl)) return;
        var resultType = ReadAllowlisted(result, new[] { "resultType", "result_type" }, "complete", "input_required", "task");
        var taskStatus = ReadAllowlisted(result, new[] { "taskStatus", "task_status" }, "working", "input_required", "completed", "failed", "cancelled", "expired");
        var isError = ReadBool(result, "isError", "is_error");
        Capture("protocol", method, new Dictionary<string, object?> { ["_trackmcp"] = new Dictionary<string, object?> { ["observation_kind"] = "protocol_response", ["observation_source"] = "server" } }, BoundSessionId(sessionId), isError is true ? false : true, resultType: resultType, taskStatus: taskStatus, inputRequestCount: BoundedCount(result, "inputRequests", "input_requests"), inputResponseCount: BoundedCount(result, "inputResponses", "input_responses"));
    }

    private static string? ReadAllowlisted(JsonObject result, string[] keys, params string[] allowed)
    {
        foreach (var key in keys)
        {
            var value = result[key]?.GetValue<string>();
            if (value is not null && allowed.Contains(value, StringComparer.Ordinal)) return value;
        }
        return null;
    }

    private static bool? ReadBool(JsonObject result, params string[] keys)
    {
        foreach (var key in keys) if (result[key] is JsonNode node) return node.GetValue<bool>();
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
    {
        if (kind is not ("transport_error" or "transport_closed")) return;
        var boundedDuration = Math.Clamp(durationMs, 0, 86_400_000);
        Capture("session", "transport", new Dictionary<string, object?>
        {
            ["_trackmcp"] = new Dictionary<string, object?>
            {
                ["observation_kind"] = kind,
                ["observation_source"] = "transport"
            }
        }, BoundSessionId(sessionId), false, boundedDuration);
    }

    /// <summary>Records one allowlisted protocol notification without payload values.</summary>
    /// <remarks>Progress values, cancellation reasons, URIs, and caller data are never accepted.</remarks>
    public void RecordProtocolSignal(string signal, string method, string? sessionId = null)
    {
        if (!ProtocolSignals.Contains(signal) || string.IsNullOrWhiteSpace(method) || method.Length > 128 || method.Any(char.IsControl)) return;
        Capture("protocol", method, new Dictionary<string, object?>
        {
            ["_trackmcp"] = new Dictionary<string, object?>
            {
                ["observation_kind"] = "protocol_notification",
                ["protocol_signal"] = signal
            }
        }, BoundSessionId(sessionId), true);
    }

    private static string BoundSessionId(string? sessionId)
    {
        var value = sessionId?.Trim();
        if (string.IsNullOrEmpty(value)) return "transport-session";
        return value.Length <= MaxSessionIdLength ? value : value[..MaxSessionIdLength];
    }

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
