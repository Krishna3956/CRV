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
