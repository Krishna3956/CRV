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

static class Smoke
{
    private static void Require(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }

    public static async Task Main()
    {
        var handler = new CaptureHandler();
        using var http = new HttpClient(handler);
        using var client = new TrackMcpClient(new TrackMcpOptions("tmcp_test", Endpoint: "https://example.test/ingest"), http);

        client.RecordProtocolSignal("cancelled", "notifications/cancelled", "session-1", "client_to_server");
        client.RecordProtocolResult("elicitation/create", new JsonObject
        {
            ["resultType"] = "input_required",
            ["inputRequests"] = new JsonObject { ["private_request"] = new JsonObject { ["value"] = "secret-value" } },
            ["private_result"] = "must-not-cross-boundary",
        }, "session-1");
        client.RecordCatalog("resources", "resources/list", new JsonObject
        {
            ["resources"] = new JsonArray(new JsonObject
            {
                ["name"] = "private-resource",
                ["uri"] = "secret://customer/private",
            }),
            ["nextCursor"] = "private-cursor",
        }, "session-1");
        client.RecordTransportFailureForTransport("transport_error", "streamable_http", "session-1", 12);
        await client.FlushAsync();

        Require(handler.Body is not null, "flush did not send an event batch");
        Require(!handler.Body!.Contains("private-resource", StringComparison.Ordinal), "raw catalog name crossed the boundary");
        Require(!handler.Body.Contains("secret://customer/private", StringComparison.Ordinal), "raw catalog URI crossed the boundary");
        Require(!handler.Body.Contains("private-cursor", StringComparison.Ordinal), "raw cursor crossed the boundary");
        Require(!handler.Body.Contains("secret-value", StringComparison.Ordinal), "raw input value crossed the boundary");
        Require(!handler.Body.Contains("must-not-cross-boundary", StringComparison.Ordinal), "raw protocol result crossed the boundary");
        using var document = JsonDocument.Parse(handler.Body);
        var events = document.RootElement.GetProperty("events");
        Require(events.GetArrayLength() == 4, "unexpected event count");
        Require(events[0].GetProperty("direction").GetString() == "client_to_server", "inbound direction was not retained");
        Require(events[1].GetProperty("result_type").GetString() == "input_required", "protocol result type was not retained");
        Require(events[2].GetProperty("catalog_kind").GetString() == "resources", "catalog kind was not retained");
        Require(events[2].GetProperty("catalog_item_count").GetInt32() == 1, "catalog count was not retained");
        Require(events[3].GetProperty("payload").GetProperty("_trackmcp").GetProperty("observation_kind").GetString() == "transport_error", "transport failure was not retained");
        Require(events[3].GetProperty("transport").GetString() == "streamable_http", "caller-verified transport label was not retained");
        var metadata = events[2].GetProperty("payload").GetProperty("_trackmcp");
        Require(metadata.GetProperty("next_cursor_present").GetBoolean(), "cursor presence was not retained");
    }
}
