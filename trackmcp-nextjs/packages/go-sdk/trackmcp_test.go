package trackmcp

import "testing"

func TestSanitizePayloadRedactsAndBounds(t *testing.T) {
	long := "0123456789abcdefghijklmnopqrstuvwxyz" 
	value, ok := sanitizePayload(map[string]any{
		"password": "do-not-send",
		"nested": map[string]any{"token": "also-do-not-send", "text": long},
	}, 0).(map[string]any)
	if !ok { t.Fatal("expected object payload") }
	if value["password"] != "[redacted]" { t.Fatalf("password was not redacted: %#v", value["password"]) }
	nested := value["nested"].(map[string]any)
	if nested["token"] != "[redacted]" { t.Fatalf("token was not redacted: %#v", nested["token"]) }
	if nested["text"] != long { t.Fatalf("short text unexpectedly changed") }
}

func TestSanitizePayloadTruncatesDepth(t *testing.T) {
	value := sanitizePayload(map[string]any{"a": map[string]any{"b": map[string]any{"c": map[string]any{"d": "hidden"}}}}, 0).(map[string]any)
	if value["a"].(map[string]any)["b"].(map[string]any)["c"].(map[string]any)["d"].(map[string]any)["__trackmcp_truncated"] != true {
		t.Fatalf("deep payload was not truncated: %#v", value)
	}
}

func TestRecordTransportFailureIsMetadataOnlyAndBounded(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test"})
	client.RecordTransportFailure("transport_closed", "session-1", 12)
	if len(client.queue) != 1 { t.Fatalf("expected one event, got %d", len(client.queue)) }
	event := client.queue[0]
	if event.EventType != "session" || event.MCPMethod != "transport" { t.Fatalf("unexpected event: %#v", event) }
	if event.ErrorClass != "transport_closed" || event.Success == nil || *event.Success { t.Fatalf("unexpected failure metadata: %#v", event) }
	if event.Payload["_trackmcp"].(map[string]any)["observation_kind"] != "transport_closed" { t.Fatalf("missing observation kind: %#v", event.Payload) }
	client.RecordTransportFailure("raw_exception", "session-2", 12)
	if len(client.queue) != 1 { t.Fatalf("invalid kind should be ignored") }
	client.RecordTransportFailure("transport_error", "", 999999999)
	if client.queue[1].DurationMS != 86400000 || client.queue[1].SessionID != "transport-session" { t.Fatalf("bounds/defaults not applied: %#v", client.queue[1]) }
	client.RecordTransportFailure("transport_closed", "  "+string(make([]byte, 300)), 1)
	if len(client.queue[2].SessionID) != maxSessionIDLength { t.Fatalf("session id was not bounded: %d", len(client.queue[2].SessionID)) }
}

func TestRecordProtocolSignalIsAllowlistedAndMetadataOnly(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test"})
	client.RecordProtocolSignal("progress", "notifications/progress", "session-1")
	if len(client.queue) != 1 { t.Fatalf("expected one signal, got %d", len(client.queue)) }
	event := client.queue[0]
	if event.EventType != "protocol" || event.MCPMethod != "notifications/progress" || event.Direction != "server_to_client" { t.Fatalf("unexpected signal: %#v", event) }
	metadata := event.Payload["_trackmcp"].(map[string]any)
	if metadata["protocol_signal"] != "progress" || metadata["observation_kind"] != "protocol_notification" { t.Fatalf("unexpected metadata: %#v", metadata) }
	if event.Payload["progress_value"] != nil { t.Fatal("signal unexpectedly retained a value") }
	client.RecordProtocolSignal("raw", "notifications/progress", "session-2")
	client.RecordProtocolSignal("cancelled", "bad\nmethod", "session-3")
	if len(client.queue) != 1 { t.Fatal("invalid signal or method should be ignored") }
}
