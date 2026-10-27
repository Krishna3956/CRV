package trackmcp

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"testing"
)

type cancelRoundTripper struct{}

func (cancelRoundTripper) RoundTrip(request *http.Request) (*http.Response, error) {
	<-request.Context().Done()
	return nil, request.Context().Err()
}

func TestFlushContextRequeuesOnCancellation(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test", Endpoint: "https://example.test/ingest", HTTPClient: &http.Client{Transport: cancelRoundTripper{}}})
	client.Capture(Event{EventType: "tool_call", MCPMethod: "tools/call"})
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	err := client.FlushContext(ctx)
	if !errors.Is(err, context.Canceled) { t.Fatalf("expected context cancellation, got %v", err) }
	if len(client.queue) != 1 { t.Fatalf("cancelled batch was not requeued: %d", len(client.queue)) }
}

func TestFlushContextUsesInjectedClientAndReturnsHTTPFailure(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test", Endpoint: "https://example.test/ingest", HTTPClient: &http.Client{Transport: roundTripperFunc(func(*http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: http.StatusBadGateway, Body: http.NoBody}, nil
	})}})
	client.Capture(Event{EventType: "tool_call", MCPMethod: "tools/call"})
	if err := client.FlushContext(context.Background()); err == nil { t.Fatal("expected HTTP failure") }
	if len(client.queue) != 1 { t.Fatalf("failed batch was not requeued: %d", len(client.queue)) }
}

type roundTripperFunc func(*http.Request) (*http.Response, error)

func (fn roundTripperFunc) RoundTrip(request *http.Request) (*http.Response, error) { return fn(request) }

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

func TestCaptureIncludesDeploymentMetadata(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test", ServerVersion: "server-1.2.3", SDKVersion: "go-0.1.0", DeploymentID: "deploy-42"})
	client.Capture(Event{EventType: "tool_call", MCPMethod: "tools/call"})
	if len(client.queue) != 1 { t.Fatalf("expected one event, got %d", len(client.queue)) }
	event := client.queue[0]
	if event.ServerVersion != "server-1.2.3" || event.SDKVersion != "go-0.1.0" || event.DeploymentID != "deploy-42" {
		t.Fatalf("deployment metadata was not propagated: %#v", event)
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

func TestRecordTransportFailureForTransportAllowlistsLabel(t *testing.T) {
	client := New(Options{APIKey: "test"})
	client.RecordTransportFailureForTransport("transport_error", "streamable_http", "session-1", 12)
	if len(client.queue) != 1 || client.queue[0].Transport != "streamable_http" {
		t.Fatalf("transport label was not retained: %#v", client.queue)
	}
	client.RecordTransportFailureForTransport("transport_error", "private://endpoint", "session-2", 12)
	if len(client.queue) != 1 { t.Fatalf("unsupported transport label was accepted") }
}

func TestRecordSessionReconnectedIsBoundedAndCallerObserved(t *testing.T) {
	client := New(Options{APIKey: "test"})
	client.RecordSessionReconnected("streamable_http", "session-1", 12)
	if len(client.queue) != 1 { t.Fatalf("expected one reconnect event, got %d", len(client.queue)) }
	event := client.queue[0]
	if event.EventType != "session" || event.Transport != "streamable_http" || event.Success == nil || !*event.Success { t.Fatalf("unexpected reconnect event: %#v", event) }
	metadata := event.Payload["_trackmcp"].(map[string]any)
	if metadata["observation_kind"] != "session_reconnected" || metadata["observation_source"] != "transport" { t.Fatalf("unexpected reconnect metadata: %#v", metadata) }
	client.RecordSessionReconnected("private://endpoint", "session-2", 12)
	if len(client.queue) != 1 { t.Fatal("unsupported transport label was accepted") }
	client.RecordSessionReconnected("stdio", "session-3", 999999999)
	if client.queue[1].DurationMS != 86400000 { t.Fatalf("duration was not bounded: %#v", client.queue[1]) }
}

func TestRecordProtocolSignalIsAllowlistedAndMetadataOnly(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test"})
	client.RecordProtocolSignal("progress", "notifications/progress", "session-1")
	client.RecordProtocolSignal("subscription_started", "resources/subscribe", "session-1")
	client.RecordProtocolSignal("subscription_stopped", "resources/unsubscribe", "session-1")
	if len(client.queue) != 3 { t.Fatalf("expected three signals, got %d", len(client.queue)) }
	event := client.queue[0]
	if event.EventType != "protocol" || event.MCPMethod != "notifications/progress" || event.Direction != "server_to_client" { t.Fatalf("unexpected signal: %#v", event) }
	metadata := event.Payload["_trackmcp"].(map[string]any)
	if metadata["protocol_signal"] != "progress" || metadata["observation_kind"] != "protocol_notification" { t.Fatalf("unexpected metadata: %#v", metadata) }
	if client.queue[1].Payload["_trackmcp"].(map[string]any)["protocol_signal"] != "subscription_started" || client.queue[2].Payload["_trackmcp"].(map[string]any)["protocol_signal"] != "subscription_stopped" { t.Fatal("subscription signals were not retained") }
	if event.Payload["progress_value"] != nil { t.Fatal("signal unexpectedly retained a value") }
	client.RecordProtocolSignal("raw", "notifications/progress", "session-2")
	client.RecordProtocolSignal("cancelled", "bad\nmethod", "session-3")
	if len(client.queue) != 3 { t.Fatal("invalid signal or method should be ignored") }
}

func TestRecordProtocolSignalDirectionKeepsInboundCancellationDistinct(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test"})
	client.RecordProtocolSignalDirection("cancelled", "notifications/cancelled", "client_to_server", "session-1")
	if len(client.queue) != 1 || client.queue[0].Direction != "client_to_server" { t.Fatalf("unexpected inbound direction: %#v", client.queue) }
	client.RecordProtocolSignalDirection("cancelled", "notifications/cancelled", "invalid", "session-2")
	if len(client.queue) != 1 { t.Fatal("invalid direction should be ignored") }
}

func TestRecordProtocolSignalForTransportAllowlistsLabel(t *testing.T) {
	client := New(Options{APIKey: "test"})
	client.RecordProtocolSignalForTransport("cancelled", "notifications/cancelled", "sse", "client_to_server", "session-1")
	if len(client.queue) != 1 || client.queue[0].Transport != "sse" { t.Fatalf("signal transport label was not retained: %#v", client.queue) }
	client.RecordProtocolSignalForTransport("cancelled", "notifications/cancelled", "private://endpoint", "client_to_server", "session-2")
	if len(client.queue) != 1 { t.Fatalf("unsupported signal transport label was accepted") }
}

func TestRecordCatalogIsBoundedAndHashOnly(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test"})
	client.RecordCatalog("resources", "resources/list", map[string]any{
		"resources": []any{
			map[string]any{"name": "private-name", "uri": "secret://private"},
			map[string]any{"uri": "secret://second"},
		},
		"nextCursor": "private-cursor",
	}, "session-catalog")
	if len(client.queue) != 1 { t.Fatalf("expected one catalog event, got %d", len(client.queue)) }
	event := client.queue[0]
	if event.EventType != "catalog" || event.CatalogKind != "resources" || event.CatalogItemCount != 2 { t.Fatalf("unexpected catalog event: %#v", event) }
	if len(event.CatalogItemURIHashes) != 2 || len(event.CatalogItemNameHashes) != 1 { t.Fatalf("unexpected identity hashes: %#v", event) }
	if event.Payload["_trackmcp"].(map[string]any)["next_cursor_present"] != true { t.Fatal("cursor presence was not recorded") }
	serialized, _ := json.Marshal(event)
	if strings.Contains(string(serialized), "private-name") || strings.Contains(string(serialized), "secret://private") || strings.Contains(string(serialized), "private-cursor") { t.Fatalf("catalog content escaped privacy boundary: %s", serialized) }
	client.RecordCatalog("unknown", "resources/list", map[string]any{}, "session-2")
	if len(client.queue) != 1 { t.Fatal("unsupported catalog kind should be ignored") }
}

func TestRecordCatalogBoundsCacheHints(t *testing.T) {
	client := New(Options{APIKey: "test"})
	client.RecordCatalog("tools", "tools/list", map[string]any{"tools": []any{}, "ttlMs": 60000, "cacheScope": "private"}, "session-1")
	metadata := client.queue[0].Payload["_trackmcp"].(map[string]any)
	if metadata["cache_ttl_ms"] != 60000 || metadata["cache_scope"] != "private" { t.Fatalf("cache hints were not retained: %#v", metadata) }
	client.RecordCatalog("tools", "tools/list", map[string]any{"tools": []any{}, "ttlMs": 999999999, "cacheScope": "secret"}, "session-2")
	metadata = client.queue[1].Payload["_trackmcp"].(map[string]any)
	if _, ok := metadata["cache_ttl_ms"]; ok { t.Fatalf("oversized TTL was retained") }
	if _, ok := metadata["cache_scope"]; ok { t.Fatalf("unsupported cache scope was retained") }
}

func TestRecordEntityReadIsHashAndCountOnly(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test"})
	client.RecordEntityRead("resources", "resources/read", "secret://customer/private", map[string]any{
		"contents": []any{map[string]any{"text": "private-content"}}, "isError": false,
	}, "session-read")
	client.RecordEntityRead("prompts", "prompts/get", "private-prompt", map[string]any{
		"messages": []any{map[string]any{"content": "private-message"}}, "resultType": "complete",
	}, "session-prompt")
	if len(client.queue) != 2 { t.Fatalf("expected two entity reads, got %d", len(client.queue)) }
	resource, prompt := client.queue[0], client.queue[1]
	if resource.CatalogItemCount != 1 || len(resource.CatalogItemURIHashes) != 1 || resource.Success == nil || !*resource.Success { t.Fatalf("unexpected resource read: %#v", resource) }
	if prompt.CatalogItemCount != 1 || len(prompt.CatalogItemNameHashes) != 1 || prompt.ResultType != "complete" { t.Fatalf("unexpected prompt read: %#v", prompt) }
	serialized, _ := json.Marshal(client.queue)
	if strings.Contains(string(serialized), "secret://customer/private") || strings.Contains(string(serialized), "private-content") || strings.Contains(string(serialized), "private-prompt") || strings.Contains(string(serialized), "private-message") { t.Fatalf("entity content escaped privacy boundary: %s", serialized) }
	client.RecordEntityRead("resources", "prompts/get", "ignored", map[string]any{}, "session-invalid")
	if len(client.queue) != 2 { t.Fatal("invalid entity/method pair should be ignored") }
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
	if event.Payload["_trackmcp"].(map[string]any)["protocol_family"] != "tasks" { t.Fatalf("task family was not retained: %#v", event.Payload) }
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

func TestRecordRootsAndLoggingFamiliesAreMetadataOnly(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test"})
	client.RecordProtocolResult("roots/list", map[string]any{"roots": []any{map[string]any{"uri": "file:///private"}}}, "session-roots")
	client.RecordProtocolResult("logging/setLevel", map[string]any{"level": "debug"}, "session-logging")
	if len(client.queue) != 2 { t.Fatalf("expected two events, got %d", len(client.queue)) }
	for index, expected := range []string{"roots", "logging"} {
		metadata := client.queue[index].Payload["_trackmcp"].(map[string]any)
		if metadata["protocol_family"] != expected { t.Fatalf("unexpected family: %#v", metadata) }
	}
	serialized, _ := json.Marshal(client.queue)
	if strings.Contains(string(serialized), "file:///private") || strings.Contains(string(serialized), "debug") { t.Fatal("roots/logging response values were retained") }
}

func TestRecordModernProtocolFamiliesAreBounded(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test"})
	for _, method := range []string{"sampling/createMessage", "elicitation/create", "tasks/get"} {
		client.RecordProtocolResult(method, map[string]any{"private": "omit"}, "session-modern")
	}
	for index, expected := range []string{"sampling", "elicitation", "tasks"} {
		metadata := client.queue[index].Payload["_trackmcp"].(map[string]any)
		if metadata["protocol_family"] != expected { t.Fatalf("unexpected modern family: %#v", metadata) }
	}
	serialized, _ := json.Marshal(client.queue)
	if strings.Contains(string(serialized), "omit") { t.Fatal("modern protocol response value crossed the privacy boundary") }
}

func TestRecordProtocolCursorIsPresenceOnly(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test"})
	client.RecordProtocolResult("tools/list", map[string]any{"nextCursor": "private-cursor"}, "session-cursor")
	metadata := client.queue[0].Payload["_trackmcp"].(map[string]any)
	if metadata["next_cursor_present"] != true { t.Fatalf("cursor presence was not retained: %#v", metadata) }
	serialized, _ := json.Marshal(metadata)
	if strings.Contains(string(serialized), "private-cursor") { t.Fatal("raw cursor crossed the privacy boundary") }
}

func TestRecordInitializeCapabilitiesAreBoundedNames(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test"})
	client.RecordProtocolResult("initialize", map[string]any{
		"capabilities": map[string]any{"roots": map[string]any{"listChanged": true}, "logging": map[string]any{}, "io.modelcontextprotocol/tasks": map[string]any{"experimental": true}, "io.modelcontextprotocol/sampling": map[string]any{"secret": "omit"}, "unsafe key": map[string]any{"secret": "omit"}},
	}, "session-init")
	if len(client.queue) != 1 { t.Fatalf("expected one event, got %d", len(client.queue)) }
	metadata := client.queue[0].Payload["_trackmcp"].(map[string]any)
	if metadata["capability_names"] != "io.modelcontextprotocol/sampling,io.modelcontextprotocol/tasks,logging,roots" { t.Fatalf("unexpected capability names: %#v", metadata) }
	serialized, _ := json.Marshal(metadata)
	if strings.Contains(string(serialized), "listChanged") || strings.Contains(string(serialized), "omit") { t.Fatal("capability option values crossed the privacy boundary") }
}

func TestRecordSubscriptionLifecycleMetadataIsBounded(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test"})
	client.RecordProtocolResult("resources/subscribe", map[string]any{"uri": "secret://private"}, "session-subscribe")
	client.RecordProtocolResult("resources/unsubscribe", map[string]any{"uri": "secret://private"}, "session-unsubscribe")
	client.RecordProtocolResult("subscriptions/listen", map[string]any{"subscriptionId": "secret-subscription"}, "session-listen")
	if len(client.queue) != 3 { t.Fatalf("expected three events, got %d", len(client.queue)) }
	for index, expected := range []string{"subscription_started", "subscription_stopped", "subscription_started"} {
		metadata := client.queue[index].Payload["_trackmcp"].(map[string]any)
		if metadata["subscription_action"] != expected { t.Fatalf("unexpected subscription metadata: %#v", metadata) }
	}
	serialized, _ := json.Marshal(client.queue)
	if strings.Contains(string(serialized), "secret://private") || strings.Contains(string(serialized), "secret-subscription") { t.Fatalf("subscription identifiers crossed privacy boundary: %s", serialized) }
}

func TestAccountIdentityResolverHashesLocallyAndFailsClosed(t *testing.T) {
	client := New(Options{APIKey: "tmcp_test", AccountIDResolver: func() string { return "tenant-42" }})
	client.Capture(Event{EventType: "tool_call", MCPMethod: "tools/call"})
	if len(client.queue) != 1 { t.Fatalf("expected one event, got %d", len(client.queue)) }
	event := client.queue[0]
	if event.AccountIdentitySource != "resolver" || len(event.AccountKey) != 64 { t.Fatalf("unexpected identity metadata: %#v", event) }
	if event.AccountKey == "tenant-42" { t.Fatalf("resolver identity was not isolated: %#v", event) }
	unsafeClient := New(Options{APIKey: "tmcp_test", AccountIDResolver: func() string { return "user@example.com" }})
	unsafeClient.Capture(Event{EventType: "tool_call"})
	if unsafeClient.queue[0].AccountIdentitySource != "unresolved" || unsafeClient.queue[0].AccountKey != "" { t.Fatalf("unsafe identity was accepted: %#v", unsafeClient.queue[0]) }
	panicClient := New(Options{APIKey: "tmcp_test", AccountIDResolver: func() string { panic("resolver failure") }})
	panicClient.Capture(Event{EventType: "tool_call"})
	if panicClient.queue[0].AccountIdentitySource != "unresolved" { t.Fatalf("resolver panic did not fail open: %#v", panicClient.queue[0]) }
}
