package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"

	trackmcp "github.com/trackmcp/trackmcp-go"
)

func main() {
	var received []byte
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Method != http.MethodPost || request.Header.Get("Authorization") != "Bearer tmcp_smoke" {
			writer.WriteHeader(http.StatusUnauthorized)
			return
		}
		body, err := io.ReadAll(io.LimitReader(request.Body, 512*1024))
		if err != nil {
			writer.WriteHeader(http.StatusBadRequest)
			return
		}
		received = append([]byte(nil), body...)
		writer.WriteHeader(http.StatusAccepted)
	}))
	defer server.Close()

	client := trackmcp.New(trackmcp.Options{APIKey: "tmcp_smoke", Endpoint: server.URL})
	client.RecordProtocolSignalForTransport("cancelled", "notifications/cancelled", "stdio", "client_to_server", "go-smoke-session")
	client.RecordProtocolResultForTransport("elicitation/create", map[string]any{
		"resultType": "input_required",
		"inputRequests": []any{map[string]any{"prompt": "private-input-request"}},
		"inputResponses": map[string]any{"value": "private-input-response"},
		"taskId": "private-task-handle",
		"content": "private-result-content",
	}, "stdio", "go-smoke-session")
	client.RecordCatalog("resources", "resources/list", map[string]any{
		"resources": []any{
			map[string]any{"name": "private-resource-name", "uri": "secret://private-resource"},
			map[string]any{"uri": "secret://second-resource"},
		},
		"nextCursor": "private-cursor",
		"ttlMs": 60000,
		"cacheScope": "private",
	}, "go-smoke-session")
	client.RecordEntityRead("resources", "resources/read", "secret://private-read", map[string]any{
		"contents": []any{map[string]any{"text": "private-resource-content"}},
	}, "go-smoke-session")
	client.RecordEntityRead("prompts", "prompts/get", "private-prompt", map[string]any{
		"messages": []any{map[string]any{"content": "private-prompt-message"}},
		"resultType": "complete",
	}, "go-smoke-session")
	client.RecordTransportFailureForTransport("transport_error", "stdio", "go-smoke-session", 12)
	client.Flush()

	if len(received) == 0 || !json.Valid(received) {
		fail("fake ingest did not receive valid JSON")
	}
	for _, secret := range []string{"private-input-request", "private-input-response", "private-task-handle", "private-result-content", "private-resource-name", "secret://private-resource", "secret://second-resource", "private-cursor", "secret://private-read", "private-resource-content", "private-prompt", "private-prompt-message"} {
		if bytes.Contains(received, []byte(secret)) {
			fail("private catalog value crossed the event boundary: " + secret)
		}
	}
	var envelope struct {
		Events []struct {
			EventType string `json:"event_type"`
			Direction string `json:"direction"`
			ErrorClass string `json:"error_class"`
			Transport string `json:"transport"`
			CatalogKind string `json:"catalog_kind"`
			ResultType string `json:"result_type"`
			InputRequestCount int `json:"input_request_count"`
			InputResponseCount int `json:"input_response_count"`
			Payload map[string]any `json:"payload"`
		} `json:"events"`
	}
	if err := json.Unmarshal(received, &envelope); err != nil || len(envelope.Events) != 6 {
		fail("unexpected event envelope")
	}
	if envelope.Events[0].Direction != "client_to_server" || envelope.Events[0].EventType != "protocol" {
		fail("inbound protocol signal direction was not preserved")
	}
	if envelope.Events[0].Transport != "stdio" {
		fail("caller-verified signal transport label was not emitted")
	}
	if envelope.Events[1].EventType != "protocol" || envelope.Events[1].ResultType != "input_required" || envelope.Events[1].InputRequestCount != 1 || envelope.Events[1].InputResponseCount != 1 {
		fail("bounded protocol-result metadata was not emitted")
	}
	if envelope.Events[1].Transport != "stdio" {
		fail("caller-verified result transport label was not emitted")
	}
	if envelope.Events[2].CatalogKind != "resources" || envelope.Events[2].EventType != "catalog" {
		fail("catalog observation was not emitted")
	}
	metadata, ok := envelope.Events[2].Payload["_trackmcp"].(map[string]any)
	if !ok || metadata["cache_ttl_ms"] != float64(60000) || metadata["cache_scope"] != "private" {
		fail("bounded cache hints were not emitted")
	}
	if envelope.Events[3].CatalogKind != "resources" || envelope.Events[3].EventType != "catalog" || envelope.Events[3].Payload["_trackmcp"].(map[string]any)["observation_kind"] != "entity_read" {
		fail("resource entity-read metadata was not emitted")
	}
	if envelope.Events[4].CatalogKind != "prompts" || envelope.Events[4].EventType != "catalog" || envelope.Events[4].Payload["_trackmcp"].(map[string]any)["observation_kind"] != "entity_read" {
		fail("prompt entity-read metadata was not emitted")
	}
	if envelope.Events[5].ErrorClass != "transport_error" || envelope.Events[5].EventType != "session" {
		fail("transport failure metadata was not emitted")
	}
	if envelope.Events[5].Transport != "stdio" {
		fail("caller-verified transport label was not emitted")
	}
	if strings.Contains(string(received), "request_id") && strings.Contains(string(received), "private") {
		fail("private request material appeared in the envelope")
	}
	os.Stdout.WriteString("Go TrackMCP runtime smoke passed\n")
}

func fail(message string) {
	os.Stderr.WriteString(message + "\n")
	os.Exit(1)
}
