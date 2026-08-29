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
	c.mu.Lock(); c.queue = append(c.queue, event); flush := len(c.queue) >= c.options.MaxBatchSize; c.mu.Unlock()
	if flush { go c.Flush() }
}

func (c *Client) Track(name string, payload map[string]any) { if payload == nil { payload = map[string]any{} }; payload["name"] = name; c.Capture(Event{EventType: "custom", Payload: payload}) }

func (c *Client) Flush() {
	c.mu.Lock(); if len(c.queue) == 0 { c.mu.Unlock(); return }; count := c.options.MaxBatchSize; if count > len(c.queue) { count = len(c.queue) }; events := append([]Event(nil), c.queue[:count]...); c.queue = c.queue[count:]; c.mu.Unlock()
	body, err := json.Marshal(map[string]any{"events": events}); if err != nil { return }
	req, err := http.NewRequest(http.MethodPost, c.options.Endpoint, bytes.NewReader(body)); if err != nil { return }; req.Header.Set("Content-Type", "application/json"); req.Header.Set("Authorization", "Bearer "+c.options.APIKey)
	resp, err := http.DefaultClient.Do(req); if err != nil || resp.StatusCode >= 300 { c.mu.Lock(); c.queue = append(events, c.queue...); c.mu.Unlock() }; if resp != nil { resp.Body.Close() }
}

func id() string { raw := make([]byte, 16); if _, err := rand.Read(raw); err != nil { return time.Now().Format("20060102150405") }; return hex.EncodeToString(raw) }

func FromEnv() *Client { return New(Options{APIKey: os.Getenv("TRACKMCP_KEY"), Service: os.Getenv("TRACKMCP_SERVICE"), Environment: os.Getenv("TRACKMCP_ENVIRONMENT")}) }
