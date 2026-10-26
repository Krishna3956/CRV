using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;
using TrackMcp;

sealed class CaptureHandler : HttpMessageHandler
{
    public string? Body { get; private set; }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        Body = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
        return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{}") };
    }
}

sealed class CancellationHandler : HttpMessageHandler
{
    public TaskCompletionSource Started { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
    public string? Body { get; private set; }
    private int _calls;

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (Interlocked.Increment(ref _calls) == 1)
        {
            Started.TrySetResult();
            await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
        }

        Body = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
        return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{}") };
    }
}

static class Smoke
{
    private static void Require(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }

    public static async Task Main()
    {
        var cancellationHandler = new CancellationHandler();
        using var cancellationHttp = new HttpClient(cancellationHandler);
        using var cancellationClient = new TrackMcpClient(new TrackMcpOptions("tmcp_test", Endpoint: "https://example.test/ingest"), cancellationHttp);
        cancellationClient.RecordProtocolSignalForTransport("cancelled", "notifications/cancelled", "streamable_http", "session-cancel", "client_to_server");
        using var cancellation = new CancellationTokenSource();
        var cancelledFlush = cancellationClient.FlushAsync(cancellation.Token);
        await cancellationHandler.Started.Task;
        cancellation.Cancel();
        await cancelledFlush;
        await cancellationClient.FlushAsync();
        Require(cancellationHandler.Body is not null && cancellationHandler.Body.Contains("notifications/cancelled", StringComparison.Ordinal), "cancelled flush did not preserve the batch for retry");

        var handler = new CaptureHandler();
        using var http = new HttpClient(handler);
        using var client = new TrackMcpClient(new TrackMcpOptions("tmcp_test", Endpoint: "https://example.test/ingest"), http);

        client.RecordProtocolSignalForTransport("cancelled", "notifications/cancelled", "streamable_http", "session-1", "client_to_server");
        client.RecordProtocolResult("elicitation/create", new JsonObject
        {
            ["resultType"] = "input_required",
            ["inputRequests"] = new JsonObject { ["private_request"] = new JsonObject { ["value"] = "secret-value" } },
            ["private_result"] = "must-not-cross-boundary",
        }, "session-1");
        client.RecordProtocolResult("resources/subscribe", new JsonObject { ["uri"] = "secret://private" }, "session-subscribe");
        client.RecordProtocolResult("resources/unsubscribe", new JsonObject { ["uri"] = "secret://private" }, "session-unsubscribe");
        client.RecordCatalog("resources", "resources/list", new JsonObject
        {
            ["resources"] = new JsonArray(new JsonObject
            {
                ["name"] = "private-resource",
                ["uri"] = "secret://customer/private",
            }),
            ["nextCursor"] = "private-cursor",
            ["ttlMs"] = 60000,
            ["cacheScope"] = "private",
        }, "session-1");
        client.RecordEntityRead("resources", "resources/read", "secret://customer/read", new JsonObject
        {
            ["contents"] = new JsonArray(new JsonObject { ["text"] = "private-resource-content" }),
        }, "session-1");
        client.RecordEntityRead("prompts", "prompts/get", "private-prompt", new JsonObject
        {
            ["messages"] = new JsonArray(new JsonObject { ["content"] = "private-prompt-message" }),
            ["resultType"] = "complete",
        }, "session-1");
        client.RecordTransportFailureForTransport("transport_error", "streamable_http", "session-1", 12);
        client.RecordSessionReconnected("streamable_http", "session-1", 12);
        client.RecordProtocolResult("initialize", new JsonObject
        {
            ["capabilities"] = new JsonObject
            {
                ["roots"] = new JsonObject { ["listChanged"] = true },
                ["logging"] = new JsonObject(),
                ["unsafe key"] = new JsonObject { ["secret"] = "omit" },
            },
        }, "session-init");
        await client.FlushAsync();

        Require(handler.Body is not null, "flush did not send an event batch");
        Require(!handler.Body!.Contains("private-resource", StringComparison.Ordinal), "raw catalog name crossed the boundary");
        Require(!handler.Body.Contains("secret://customer/private", StringComparison.Ordinal), "raw catalog URI crossed the boundary");
        Require(!handler.Body.Contains("private-cursor", StringComparison.Ordinal), "raw cursor crossed the boundary");
        Require(!handler.Body.Contains("secret-value", StringComparison.Ordinal), "raw input value crossed the boundary");
        Require(!handler.Body.Contains("must-not-cross-boundary", StringComparison.Ordinal), "raw protocol result crossed the boundary");
        Require(!handler.Body.Contains("secret://customer/read", StringComparison.Ordinal), "raw resource read identity crossed the boundary");
        Require(!handler.Body.Contains("private-resource-content", StringComparison.Ordinal), "raw resource content crossed the boundary");
        Require(!handler.Body.Contains("private-prompt", StringComparison.Ordinal), "raw prompt identity crossed the boundary");
        Require(!handler.Body.Contains("private-prompt-message", StringComparison.Ordinal), "raw prompt content crossed the boundary");
        using var document = JsonDocument.Parse(handler.Body);
        var events = document.RootElement.GetProperty("events");
        Require(events.GetArrayLength() == 10, "unexpected event count");
        Require(events[0].GetProperty("direction").GetString() == "client_to_server", "inbound direction was not retained");
        Require(events[0].GetProperty("transport").GetString() == "streamable_http", "caller-verified signal transport label was not retained");
        Require(events[1].GetProperty("result_type").GetString() == "input_required", "protocol result type was not retained");
        Require(events[2].GetProperty("payload").GetProperty("_trackmcp").GetProperty("subscription_action").GetString() == "subscription_started", "subscription start was not retained");
        Require(events[3].GetProperty("payload").GetProperty("_trackmcp").GetProperty("subscription_action").GetString() == "subscription_stopped", "subscription stop was not retained");
        Require(events[4].GetProperty("catalog_kind").GetString() == "resources", "catalog kind was not retained");
        Require(events[4].GetProperty("catalog_item_count").GetInt32() == 1, "catalog count was not retained");
        Require(events[4].GetProperty("payload").GetProperty("_trackmcp").GetProperty("cache_ttl_ms").GetInt32() == 60000, "cache TTL was not retained");
        Require(events[4].GetProperty("payload").GetProperty("_trackmcp").GetProperty("cache_scope").GetString() == "private", "cache scope was not retained");
        Require(events[5].GetProperty("payload").GetProperty("_trackmcp").GetProperty("observation_kind").GetString() == "entity_read", "resource entity read was not retained");
        Require(events[5].GetProperty("catalog_kind").GetString() == "resources", "resource entity kind was not retained");
        Require(events[5].GetProperty("catalog_item_count").GetInt32() == 1, "resource entity count was not retained");
        Require(events[6].GetProperty("payload").GetProperty("_trackmcp").GetProperty("observation_kind").GetString() == "entity_read", "prompt entity read was not retained");
        Require(events[6].GetProperty("catalog_kind").GetString() == "prompts", "prompt entity kind was not retained");
        Require(events[6].GetProperty("result_type").GetString() == "complete", "prompt result state was not retained");
        Require(events[7].GetProperty("payload").GetProperty("_trackmcp").GetProperty("observation_kind").GetString() == "transport_error", "transport failure was not retained");
        Require(events[7].GetProperty("transport").GetString() == "streamable_http", "caller-verified transport label was not retained");
        Require(events[8].GetProperty("payload").GetProperty("_trackmcp").GetProperty("observation_kind").GetString() == "session_reconnected", "reconnect observation was not retained");
        Require(events[8].GetProperty("success").GetBoolean(), "reconnect observation was not successful lifecycle evidence");
        var metadata = events[4].GetProperty("payload").GetProperty("_trackmcp");
        Require(metadata.GetProperty("next_cursor_present").GetBoolean(), "cursor presence was not retained");
        Require(events[9].GetProperty("payload").GetProperty("_trackmcp").GetProperty("capability_names").GetString() == "logging,roots", "capability names were not retained in bounded form");
        Require(!handler.Body.Contains("listChanged", StringComparison.Ordinal) && !handler.Body.Contains("omit", StringComparison.Ordinal), "capability option values crossed the privacy boundary");
    }
}
