using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace TrackMcp;

public sealed record TrackMcpOptions(string ApiKey, string Service = "mcp-server", string Environment = "production", string Endpoint = "https://trackmcp.com/api/v1/ingest", string? ServerVersion = null, string? SdkVersion = null, string? DeploymentId = null);

public sealed class TrackMcpClient : IDisposable
{
    private readonly TrackMcpOptions _options;
    private readonly HttpClient _http;
    private readonly List<Dictionary<string, object?>> _queue = new();
    private readonly object _gate = new();

    public TrackMcpClient(TrackMcpOptions options, HttpClient? httpClient = null) { _options = options; _http = httpClient ?? new HttpClient(); }

    public void Capture(string eventType, string method, object? payload = null, string? sessionId = null, bool? success = null, long? durationMs = null, string? toolName = null)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey)) return;
        var item = new Dictionary<string, object?> { ["event_id"] = Guid.NewGuid().ToString(), ["event_type"] = eventType, ["service"] = _options.Service, ["environment"] = _options.Environment, ["mcp_method"] = method, ["session_id"] = sessionId, ["tool_name"] = toolName, ["started_at"] = DateTimeOffset.UtcNow.ToString("O"), ["duration_ms"] = durationMs, ["success"] = success, ["is_error"] = success is false, ["payload"] = payload, ["server_version"] = _options.ServerVersion, ["sdk_version"] = _options.SdkVersion, ["deployment_id"] = _options.DeploymentId };
        lock (_gate) { _queue.Add(item); }
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
