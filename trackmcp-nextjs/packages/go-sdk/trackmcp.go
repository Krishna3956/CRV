// Package trackmcp provides fail-open telemetry primitives for MCP servers.
// It deliberately depends only on the Go standard library so it can wrap any
// official or third-party MCP implementation at its transport boundary.
package trackmcp

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type Options struct {
	APIKey string
	Service string
	Environment string
	Endpoint string
	ServerVersion string
	SDKVersion string
	DeploymentID string
	MaxBatchSize int
}

type Event struct {
	EventID string `json:"event_id"`
	EventType string `json:"event_type"`
	Service string `json:"service"`
	Environment string `json:"environment"`
	Direction string `json:"direction,omitempty"`
	Transport string `json:"transport,omitempty"`
	ProtocolVersion string `json:"protocol_version,omitempty"`
	MCPMethod string `json:"mcp_method,omitempty"`
	RequestID string `json:"request_id,omitempty"`
	SessionID string `json:"session_id,omitempty"`
	ToolName string `json:"tool_name,omitempty"`
	StartedAt string `json:"started_at"`
	DurationMS int64 `json:"duration_ms,omitempty"`
	Success *bool `json:"success,omitempty"`
	IsError *bool `json:"is_error,omitempty"`
	ErrorClass string `json:"error_class,omitempty"`
	ErrorCode *int `json:"error_code,omitempty"`
	Payload map[string]any `json:"payload,omitempty"`
}

type Client struct { options Options; mu sync.Mutex; queue []Event }

const (
	maxPayloadDepth = 3
	maxPayloadKeys = 24
	maxPayloadString = 256
)

var sensitivePayloadKeys = map[string]bool{
	"password": true, "passwd": true, "secret": true, "token": true,
	"access_token": true, "refresh_token": true, "authorization": true,
	"cookie": true, "set-cookie": true, "api_key": true, "apikey": true,
}

// sanitizePayload keeps the Go SDK metadata-first: arbitrary caller payloads
// are copied into a small, depth-limited shape and sensitive keys are replaced
// before they can enter the queue or cross the network boundary.
func sanitizePayload(value any, depth int) any {
	if depth > maxPayloadDepth { return map[string]any{"__trackmcp_truncated": true, "reason": "max_payload_depth"} }
	switch typed := value.(type) {
	case nil, bool, float64, float32, int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64:
		return typed
	case string:
		if len(typed) > maxPayloadString { return typed[:maxPayloadString] }
		return typed
	case map[string]any:
		result := make(map[string]any)
		count := 0
		for key, item := range typed {
			if count >= maxPayloadKeys { result["__trackmcp_truncated"] = true; break }
			if sensitivePayloadKeys[strings.ToLower(key)] { result[key] = "[redacted]" } else { result[key] = sanitizePayload(item, depth+1) }
			count++
		}
		return result
	case []any:
		result := make([]any, 0, min(len(typed), maxPayloadKeys))
		for index, item := range typed {
			if index >= maxPayloadKeys { result = append(result, map[string]any{"__trackmcp_truncated": true, "reason": "max_payload_keys"}); break }
			result = append(result, sanitizePayload(item, depth+1))
		}
		return result
	default:
		return "[omitted]"
	}
}

func New(options Options) *Client {
	if options.Service == "" { options.Service = "mcp-server" }
	if options.Environment == "" { options.Environment = "production" }
	if options.Endpoint == "" { options.Endpoint = "https://trackmcp.com/api/v1/ingest" }
	if options.MaxBatchSize <= 0 { options.MaxBatchSize = 50 }
	return &Client{options: options}
}

func (c *Client) Capture(event Event) {
	if c.options.APIKey == "" { return }
	if event.EventID == "" { event.EventID = id() }
	event.Service, event.Environment = c.options.Service, c.options.Environment
	if event.StartedAt == "" { event.StartedAt = time.Now().UTC().Format(time.RFC3339) }
	if event.Payload != nil { event.Payload = sanitizePayload(event.Payload, 0).(map[string]any) }
	c.mu.Lock(); c.queue = append(c.queue, event); flush := len(c.queue) >= c.options.MaxBatchSize; c.mu.Unlock()
	if flush { go c.Flush() }
}

func (c *Client) Track(name string, payload map[string]any) { if payload == nil { payload = map[string]any{} }; payload["name"] = name; c.Capture(Event{EventType: "custom", Payload: payload}) }

// RecordTransportFailure records a disconnect or transport error outside an
// MCP request boundary. It accepts only bounded metadata; exception text,
// URLs, headers, and payloads are never captured.
func (c *Client) RecordTransportFailure(kind string, sessionID string, durationMS int64) {
	if kind != "transport_error" && kind != "transport_closed" { return }
	if sessionID == "" { sessionID = "transport-session" }
	if durationMS < 0 { durationMS = 0 }
	if durationMS > 86400000 { durationMS = 86400000 }
	c.Capture(Event{
		EventType: "session", MCPMethod: "transport", SessionID: sessionID,
		DurationMS: durationMS, Success: boolPtr(false), IsError: boolPtr(true),
		ErrorClass: kind,
		Payload: map[string]any{"_trackmcp": map[string]any{"observation_kind": kind, "observation_source": "transport"}},
	})
}

func boolPtr(value bool) *bool { return &value }

func (c *Client) Flush() {
	c.mu.Lock(); if len(c.queue) == 0 { c.mu.Unlock(); return }; count := c.options.MaxBatchSize; if count > len(c.queue) { count = len(c.queue) }; events := append([]Event(nil), c.queue[:count]...); c.queue = c.queue[count:]; c.mu.Unlock()
	body, err := json.Marshal(map[string]any{"events": events}); if err != nil { return }
	req, err := http.NewRequest(http.MethodPost, c.options.Endpoint, bytes.NewReader(body)); if err != nil { return }; req.Header.Set("Content-Type", "application/json"); req.Header.Set("Authorization", "Bearer "+c.options.APIKey)
	resp, err := http.DefaultClient.Do(req); if err != nil || resp.StatusCode >= 300 { c.mu.Lock(); c.queue = append(events, c.queue...); c.mu.Unlock() }; if resp != nil { resp.Body.Close() }
}

func id() string { raw := make([]byte, 16); if _, err := rand.Read(raw); err != nil { return time.Now().Format("20060102150405") }; return hex.EncodeToString(raw) }

func FromEnv() *Client { return New(Options{APIKey: os.Getenv("TRACKMCP_KEY"), Service: os.Getenv("TRACKMCP_SERVICE"), Environment: os.Getenv("TRACKMCP_ENVIRONMENT")}) }
