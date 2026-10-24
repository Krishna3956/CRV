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
        client.RecordCatalog("resources", "resources/list", new JsonObject
        {
            ["resources"] = new JsonArray(new JsonObject
            {
                ["name"] = "private-resource",
                ["uri"] = "secret://customer/private",
            }),
            ["nextCursor"] = "private-cursor",
        }, "session-1");
        await client.FlushAsync();

        Require(handler.Body is not null, "flush did not send an event batch");
        Require(!handler.Body!.Contains("private-resource", StringComparison.Ordinal), "raw catalog name crossed the boundary");
        Require(!handler.Body.Contains("secret://customer/private", StringComparison.Ordinal), "raw catalog URI crossed the boundary");
        Require(!handler.Body.Contains("private-cursor", StringComparison.Ordinal), "raw cursor crossed the boundary");
        using var document = JsonDocument.Parse(handler.Body);
        var events = document.RootElement.GetProperty("events");
        Require(events.GetArrayLength() == 2, "unexpected event count");
        Require(events[0].GetProperty("direction").GetString() == "client_to_server", "inbound direction was not retained");
        Require(events[1].GetProperty("catalog_kind").GetString() == "resources", "catalog kind was not retained");
        Require(events[1].GetProperty("catalog_item_count").GetInt32() == 1, "catalog count was not retained");
        var metadata = events[1].GetProperty("payload").GetProperty("_trackmcp");
        Require(metadata.GetProperty("next_cursor_present").GetBoolean(), "cursor presence was not retained");
    }
}
