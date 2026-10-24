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
	client.RecordProtocolSignalDirection("cancelled", "notifications/cancelled", "client_to_server", "go-smoke-session")
	client.RecordCatalog("resources", "resources/list", map[string]any{
		"resources": []any{
			map[string]any{"name": "private-resource-name", "uri": "secret://private-resource"},
			map[string]any{"uri": "secret://second-resource"},
		},
		"nextCursor": "private-cursor",
	}, "go-smoke-session")
	client.RecordTransportFailure("transport_error", "go-smoke-session", 12)
	client.Flush()

	if len(received) == 0 || !json.Valid(received) {
		fail("fake ingest did not receive valid JSON")
	}
	for _, secret := range []string{"private-resource-name", "secret://private-resource", "secret://second-resource", "private-cursor"} {
		if bytes.Contains(received, []byte(secret)) {
			fail("private catalog value crossed the event boundary: " + secret)
		}
	}
	var envelope struct {
		Events []struct {
			EventType string `json:"event_type"`
			Direction string `json:"direction"`
			ErrorClass string `json:"error_class"`
			CatalogKind string `json:"catalog_kind"`
			Payload map[string]any `json:"payload"`
		} `json:"events"`
	}
	if err := json.Unmarshal(received, &envelope); err != nil || len(envelope.Events) != 3 {
		fail("unexpected event envelope")
	}
	if envelope.Events[0].Direction != "client_to_server" || envelope.Events[0].EventType != "protocol" {
		fail("inbound protocol signal direction was not preserved")
	}
	if envelope.Events[1].CatalogKind != "resources" || envelope.Events[1].EventType != "catalog" {
		fail("catalog observation was not emitted")
	}
	if envelope.Events[2].ErrorClass != "transport_error" || envelope.Events[2].EventType != "session" {
		fail("transport failure metadata was not emitted")
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
