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

func TestRecordProtocolResultIsBoundedAndMetadataOnly(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test"})
	client.RecordProtocolResult("tools/call", map[string]any{
		"resultType": "input_required",
		"inputRequests": []any{map[string]any{"secret": "omit"}},
		"inputResponses": map[string]any{"answer": map[string]any{"private": "omit"}},
		"taskStatus": "working",
		"content": "private result",
	}, "session-1")
	if len(client.queue) != 1 { t.Fatalf("expected one event, got %d", len(client.queue)) }
	event := client.queue[0]
	if event.ResultType != "input_required" || event.TaskStatus != "working" { t.Fatalf("unexpected result metadata: %#v", event) }
	if event.InputRequestCount == nil || *event.InputRequestCount != 1 || event.InputResponseCount == nil || *event.InputResponseCount != 1 { t.Fatalf("unexpected MRTR counts: %#v", event) }
	if event.Payload["content"] != nil || event.Payload["_trackmcp"] == nil { t.Fatalf("result content was retained: %#v", event.Payload) }
	client.RecordProtocolResult("bad\nmethod", map[string]any{"resultType": "complete"}, "session-2")
	client.RecordProtocolResult("tools/call", map[string]any{"resultType": "unknown", "taskStatus": "secret"}, "session-3")
	if len(client.queue) != 2 { t.Fatal("invalid method should be ignored while bounded unknown metadata remains observable") }
	if client.queue[1].ResultType != "" || client.queue[1].TaskStatus != "" { t.Fatal("unknown result metadata was retained") }
}

func TestRecordProtocolResultAcceptsNormalizedSnakeCaseMetadata(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test"})
	client.RecordProtocolResult("tasks/get", map[string]any{
		"result_type": "task", "task_status": "completed", "is_error": true,
		"input_requests": []any{1, 2}, "input_responses": map[string]any{"a": 1},
	}, "session-1")
	if len(client.queue) != 1 { t.Fatalf("expected one event, got %d", len(client.queue)) }
	event := client.queue[0]
	if event.ResultType != "task" || event.TaskStatus != "completed" || event.Success == nil || *event.Success || event.IsError == nil || !*event.IsError { t.Fatalf("unexpected normalized metadata: %#v", event) }
	if event.InputRequestCount == nil || *event.InputRequestCount != 2 || event.InputResponseCount == nil || *event.InputResponseCount != 1 { t.Fatalf("unexpected normalized counts: %#v", event) }
}

func TestRecordCompletionMetadataIsBoundedAndValueFree(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test"})
	values := make([]any, 40)
	for index := range values { values[index] = map[string]any{"value": "private-suggestion"} }
	client.RecordProtocolResult("completion/complete", map[string]any{
		"completion": map[string]any{"values": values, "total": 99, "hasMore": true, "secret": "omit"},
	}, "session-completion")
	if len(client.queue) != 1 { t.Fatalf("expected one event, got %d", len(client.queue)) }
	metadata := client.queue[0].Payload["_trackmcp"].(map[string]any)
	if metadata["protocol_family"] != "completion" || metadata["completion_value_count"] != 32 || metadata["completion_total"] != 99 || metadata["completion_has_more"] != true { t.Fatalf("unexpected completion metadata: %#v", metadata) }
	if _, ok := metadata["values"]; ok { t.Fatal("completion values were retained") }
	if _, ok := metadata["secret"]; ok { t.Fatal("completion secret was retained") }
}
