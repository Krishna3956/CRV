// Package trackmcp provides fail-open telemetry primitives for MCP servers.
// It deliberately depends only on the Go standard library so it can wrap any
// official or third-party MCP implementation at its transport boundary.
package trackmcp

import (
	"bytes"
	"context"
	"crypto/sha256"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
)

type Options struct {
	APIKey string
	Service string
	Environment string
	Endpoint string
	// HTTPClient is optional and exists so callers can provide their transport
	// boundary (including context-aware cancellation and test doubles). When it
	// is nil, http.DefaultClient is used.
	HTTPClient *http.Client
	ServerVersion string
	SDKVersion string
	DeploymentID string
	MaxBatchSize int
	// AccountIDResolver returns an already-validated tenant/account handle.
	// The value is hashed locally and never enters an Event or request body.
	AccountIDResolver func() string
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
	AccountKey string `json:"account_key,omitempty"`
	AccountIdentitySource string `json:"account_identity_source,omitempty"`
	ServerVersion string `json:"server_version,omitempty"`
	SDKVersion string `json:"sdk_version,omitempty"`
	DeploymentID string `json:"deployment_id,omitempty"`
	ResultType string `json:"result_type,omitempty"`
	TaskStatus string `json:"task_status,omitempty"`
	InputRequestCount *int `json:"input_request_count,omitempty"`
	InputResponseCount *int `json:"input_response_count,omitempty"`
	CatalogKind string `json:"catalog_kind,omitempty"`
	CatalogItemCount int `json:"catalog_item_count,omitempty"`
	CatalogItemNameHashes []string `json:"catalog_item_name_hashes,omitempty"`
	CatalogItemURIHashes []string `json:"catalog_item_uri_hashes,omitempty"`
	Payload map[string]any `json:"payload,omitempty"`
}

type Client struct { options Options; mu sync.Mutex; queue []Event }

const (
	maxPayloadDepth = 3
	maxPayloadKeys = 24
	maxPayloadString = 256
	maxSessionIDLength = 256
)

var protocolSignals = map[string]bool{
	"progress": true, "cancelled": true, "catalog_changed": true,
	"resource_changed": true, "prompt_changed": true,
	"subscription_started": true, "subscription_stopped": true,
}

var protocolResultTypes = map[string]bool{"complete": true, "input_required": true, "task": true}
var taskStatuses = map[string]bool{"working": true, "input_required": true, "completed": true, "failed": true, "cancelled": true, "expired": true}

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
	if event.AccountKey == "" && c.options.AccountIDResolver != nil {
		if value := resolveAccountID(c.options.AccountIDResolver); value != "" {
			event.AccountKey = hashAccountID(value)
			event.AccountIdentitySource = "resolver"
		} else { event.AccountIdentitySource = "unresolved" }
	}
	if event.EventID == "" { event.EventID = id() }
	event.Service, event.Environment = c.options.Service, c.options.Environment
	if event.StartedAt == "" { event.StartedAt = time.Now().UTC().Format(time.RFC3339) }
	if event.Payload != nil { event.Payload = sanitizePayload(event.Payload, 0).(map[string]any) }
	event.ServerVersion, event.SDKVersion, event.DeploymentID = c.options.ServerVersion, c.options.SDKVersion, c.options.DeploymentID
	c.mu.Lock(); c.queue = append(c.queue, event); flush := len(c.queue) >= c.options.MaxBatchSize; c.mu.Unlock()
	if flush { go c.Flush() }
}

func (c *Client) Track(name string, payload map[string]any) { if payload == nil { payload = map[string]any{} }; payload["name"] = name; c.Capture(Event{EventType: "custom", Payload: payload}) }

// RecordTransportFailure records a disconnect or transport error outside an
// MCP request boundary. It accepts only bounded metadata; exception text,
// URLs, headers, and payloads are never captured.
func (c *Client) RecordTransportFailure(kind string, sessionID string, durationMS int64) {
	c.RecordTransportFailureForTransport(kind, "", sessionID, durationMS)
}

// RecordTransportFailureForTransport records bounded failure metadata with a
// caller-verified MCP transport label. The SDK never inspects transport
// internals, URLs, headers, or error text.
func (c *Client) RecordTransportFailureForTransport(kind string, transport string, sessionID string, durationMS int64) {
	if kind != "transport_error" && kind != "transport_closed" { return }
	if transport != "" && !transportKinds[transport] { return }
	sessionID = boundedSessionID(sessionID)
	if durationMS < 0 { durationMS = 0 }
	if durationMS > 86400000 { durationMS = 86400000 }
	c.Capture(Event{
		EventType: "session", MCPMethod: "transport", SessionID: sessionID, Transport: transport,
		DurationMS: durationMS, Success: boolPtr(false), IsError: boolPtr(true),
		ErrorClass: kind,
		Payload: map[string]any{"_trackmcp": map[string]any{"observation_kind": kind, "observation_source": "transport"}},
	})
}

// RecordSessionReconnected records a caller-observed transport reconnect as
// bounded lifecycle metadata. It does not claim replay, delivery, or server
// ownership of the reconnect; callers invoke it only after reconnecting.
func (c *Client) RecordSessionReconnected(transport string, sessionID string, durationMS int64) {
	if transport != "" && !transportKinds[transport] { return }
	sessionID = boundedSessionID(sessionID)
	if durationMS < 0 { durationMS = 0 }
	if durationMS > 86400000 { durationMS = 86400000 }
	c.Capture(Event{
		EventType: "session", MCPMethod: "transport", SessionID: sessionID, Transport: transport,
		DurationMS: durationMS, Success: boolPtr(true), IsError: boolPtr(false),
		Payload: map[string]any{"_trackmcp": map[string]any{"observation_kind": "session_reconnected", "observation_source": "transport"}},
	})
}

// RecordProtocolSignal records an allowlisted protocol notification without
// accepting progress values, cancellation reasons, resource URIs, or any
// other caller payload. It is intentionally metadata-only and fail-closed.
func (c *Client) RecordProtocolSignal(signal string, method string, sessionID string) {
	c.RecordProtocolSignalDirection(signal, method, "server_to_client", sessionID)
}

// RecordProtocolSignalDirection records an allowlisted notification from
// either side of the MCP boundary. Direction is explicit so inbound
// cancellation is not mistaken for a server notification.
func (c *Client) RecordProtocolSignalDirection(signal string, method string, direction string, sessionID string) {
	c.RecordProtocolSignalForTransport(signal, method, "", direction, sessionID)
}

// RecordProtocolSignalForTransport records an allowlisted notification with a
// caller-verified transport label. Notification values, reasons, identifiers,
// and transport internals never cross the event boundary.
func (c *Client) RecordProtocolSignalForTransport(signal string, method string, transport string, direction string, sessionID string) {
	if !protocolSignals[signal] || len(method) == 0 || len(method) > 128 || strings.IndexFunc(method, func(r rune) bool { return r < 0x20 || r == 0x7f }) >= 0 { return }
	if direction != "server_to_client" && direction != "client_to_server" { return }
	if transport != "" && !transportKinds[transport] { return }
	c.Capture(Event{
		EventType: "protocol", Direction: direction, Transport: transport, MCPMethod: method,
		SessionID: boundedSessionID(sessionID), Success: boolPtr(true), IsError: boolPtr(false),
		Payload: map[string]any{"_trackmcp": map[string]any{
			"observation_kind": "protocol_notification", "protocol_signal": signal,
		}},
	})
}

// RecordCatalog records one bounded catalog page without retaining item names,
// URIs, schemas, descriptions, or cursor values. The result is expected to be
// the decoded MCP list response; only SHA-256 identity hashes, a bounded item
// count, and cursor presence cross the event boundary.
func (c *Client) RecordCatalog(kind string, method string, result map[string]any, sessionID string) {
	if !catalogKinds[kind] || len(method) == 0 || len(method) > 128 || strings.IndexFunc(method, func(r rune) bool { return r < 0x20 || r == 0x7f }) >= 0 { return }
	key := kind
	if kind == "resource_templates" { key = "resourceTemplates" }
	items, ok := result[key].([]any)
	if !ok { items = []any{} }
	nameHashes := make([]string, 0, minInt(len(items), 128))
	uriHashes := make([]string, 0, minInt(len(items), 128))
	for index, item := range items {
		if index >= 128 { break }
		object, ok := item.(map[string]any)
		if !ok { continue }
		if name, ok := object["name"].(string); ok && name != "" { nameHashes = append(nameHashes, hashCatalogIdentity(name)) }
		uriKey := "uri"
		if kind == "resource_templates" { uriKey = "uriTemplate" }
		if uri, ok := object[uriKey].(string); ok && uri != "" { uriHashes = append(uriHashes, hashCatalogIdentity(uri)) }
	}
	metadata := map[string]any{
		"observation_kind": "catalog_page",
		"catalog_kind": kind,
		"next_cursor_present": result["nextCursor"] != nil || result["next_cursor"] != nil,
	}
	if ttl, ok := boundedCacheTTL(result); ok { metadata["cache_ttl_ms"] = ttl }
	if scope, ok := boundedCacheScope(result); ok { metadata["cache_scope"] = scope }
	c.Capture(Event{
		EventType: "catalog", Direction: "server_to_client", MCPMethod: method,
		SessionID: boundedSessionID(sessionID), Success: boolPtr(true), IsError: boolPtr(false),
		CatalogKind: kind, CatalogItemCount: len(items), CatalogItemNameHashes: nameHashes,
		CatalogItemURIHashes: uriHashes, Payload: map[string]any{"_trackmcp": metadata},
	})
}

// RecordEntityRead records a resources/read or prompts/get response without
// retaining the URI, prompt name, arguments, or returned content. Only a
// one-way identity hash, bounded content/message count, and result state are
// emitted.
func (c *Client) RecordEntityRead(kind string, method string, identity string, result map[string]any, sessionID string) {
	if (kind != "resources" && kind != "prompts") || (kind == "resources" && method != "resources/read") || (kind == "prompts" && method != "prompts/get") { return }
	if len(identity) == 0 || len(identity) > 2048 || strings.IndexFunc(identity, func(r rune) bool { return r < 0x20 || r == 0x7f }) >= 0 { return }
	if result == nil { result = map[string]any{} }
	isError, _ := firstBool(result, "isError", "is_error")
	count := 0
	if kind == "resources" { if values, ok := result["contents"].([]any); ok { count = minInt(len(values), 100) } } else if values, ok := result["messages"].([]any); ok { count = minInt(len(values), 100) }
	event := Event{EventType: "catalog", Direction: "server_to_client", MCPMethod: method, SessionID: boundedSessionID(sessionID), Success: boolPtr(!isError), IsError: boolPtr(isError), CatalogKind: kind, CatalogItemCount: count, Payload: map[string]any{"_trackmcp": map[string]any{"observation_kind": "entity_read", "catalog_kind": kind}}}
	if kind == "resources" { event.CatalogItemURIHashes = []string{hashCatalogIdentity(identity)} } else { event.CatalogItemNameHashes = []string{hashCatalogIdentity(identity)} }
	if value, ok := firstString(result, "resultType", "result_type"); ok && protocolResultTypes[value] { event.ResultType = value }
	c.Capture(event)
}

func boundedCacheTTL(result map[string]any) (int, bool) {
	for _, key := range []string{"ttlMs", "ttl_ms"} {
		value, ok := result[key]
		if !ok { continue }
		switch typed := value.(type) {
		case int:
			if typed >= 0 && typed <= 86400000 { return typed, true }
		case int64:
			if typed >= 0 && typed <= 86400000 { return int(typed), true }
		case float64:
			if typed >= 0 && typed <= 86400000 && typed == float64(int(typed)) { return int(typed), true }
		}
	}
	return 0, false
}

func boundedCacheScope(result map[string]any) (string, bool) {
	for _, key := range []string{"cacheScope", "cache_scope"} {
		if value, ok := result[key].(string); ok && (value == "public" || value == "private") { return value, true }
	}
	return "", false
}

// RecordProtocolResult records only allowlisted MRTR/task result metadata.
// Result content, input values, and arbitrary response fields never enter the
// event or queue. This keeps Go parity with the TypeScript and Python SDKs.
func (c *Client) RecordProtocolResult(method string, result map[string]any, sessionID string) {
	c.RecordProtocolResultForTransport(method, result, "", sessionID)
}

// RecordProtocolResultForTransport records bounded response metadata with a
// caller-verified transport label. The legacy helper omits transport.
func (c *Client) RecordProtocolResultForTransport(method string, result map[string]any, transport string, sessionID string) {
	if len(method) == 0 || len(method) > 128 || strings.IndexFunc(method, func(r rune) bool { return r < 0x20 || r == 0x7f }) >= 0 { return }
	if transport != "" && !transportKinds[transport] { return }
	event := Event{EventType: "protocol", Direction: "server_to_client", Transport: transport, MCPMethod: method, SessionID: boundedSessionID(sessionID), Success: boolPtr(true), IsError: boolPtr(false)}
	if value, ok := firstString(result, "resultType", "result_type"); ok && protocolResultTypes[value] { event.ResultType = value }
	if value, ok := firstString(result, "taskStatus", "task_status"); ok && taskStatuses[value] { event.TaskStatus = value }
	if value, ok := firstBool(result, "isError", "is_error"); ok { event.IsError, event.Success = boolPtr(value), boolPtr(!value) }
	if count, ok := boundedCountFrom(result, "inputRequests", "input_requests"); ok { event.InputRequestCount = &count }
	if count, ok := boundedCountFrom(result, "inputResponses", "input_responses"); ok { event.InputResponseCount = &count }
	metadata := map[string]any{"observation_kind": "protocol_response", "observation_source": "server"}
	if method == "initialize" {
		if capabilities, ok := result["capabilities"].(map[string]any); ok {
			names := make([]string, 0, len(capabilities))
			for name := range capabilities {
				if protocolCapabilityNamePattern.MatchString(name) { names = append(names, name) }
			}
			sort.Strings(names)
			if len(names) > 32 { names = names[:32] }
			if len(names) > 0 { metadata["capability_names"] = strings.Join(names, ",") }
		}
	}
	if cursor, ok := firstString(result, "nextCursor", "next_cursor"); ok && cursor != "" { metadata["next_cursor_present"] = true }
	if family := protocolFamilyForMethod(method); family != "" { metadata["protocol_family"] = family }
	if method == "resources/subscribe" || method == "subscriptions/listen" {
		metadata["subscription_action"] = "subscription_started"
	} else if method == "resources/unsubscribe" {
		metadata["subscription_action"] = "subscription_stopped"
	}
	if method == "elicitation/create" {
		if action, ok := firstString(result, "action"); ok && (action == "accept" || action == "decline" || action == "cancel") { metadata["protocol_decision"] = action }
	}
	if method == "completion/complete" {
		if completion, ok := result["completion"].(map[string]any); ok {
			metadata["protocol_family"] = "completion"
			if values, ok := completion["values"].([]any); ok { metadata["completion_value_count"] = minInt(len(values), 32) }
			if total, ok := boundedCompletionTotal(completion["total"]); ok { metadata["completion_total"] = total }
			if hasMore, ok := completion["hasMore"].(bool); ok { metadata["completion_has_more"] = hasMore }
			if hasMore, ok := completion["has_more"].(bool); ok { metadata["completion_has_more"] = hasMore }
		}
	}
	event.Payload = map[string]any{"_trackmcp": metadata}
	c.Capture(event)
}

// RecordAuthorizationOutcome records only a canonical 401/403 authorization
// outcome. It never accepts or stores challenge headers, URLs, tokens, or
// provider error text.
func (c *Client) RecordAuthorizationOutcome(method string, statusCode int, sessionID string) {
	if len(method) == 0 || len(method) > 128 || strings.IndexFunc(method, func(r rune) bool { return r < 0x20 || r == 0x7f }) >= 0 { return }
	outcome, errorClass := "", ""
	switch statusCode {
	case 401:
		outcome, errorClass = "unauthorized", "authentication_error"
	case 403:
		outcome, errorClass = "forbidden", "authorization_error"
	default:
		return
	}
	success, isError := false, true
	c.Capture(Event{
		EventType: "protocol", Direction: "server_to_client", MCPMethod: method,
		SessionID: boundedSessionID(sessionID), Success: &success, IsError: &isError,
		ErrorClass: errorClass, ErrorCode: &statusCode,
		Payload: map[string]any{"_trackmcp": map[string]any{
			"observation_kind": "protocol_response", "observation_source": "server",
			"authorization_attempt": true, "authorization_outcome": outcome,
		}},
	})
}

func protocolFamilyForMethod(method string) string {
	for _, family := range []string{"sampling", "elicitation", "completion", "tasks", "roots", "logging"} {
		if strings.HasPrefix(method, family+"/") { return family }
	}
	return ""
}

var protocolCapabilityNamePattern = regexp.MustCompile(`^[A-Za-z][A-Za-z0-9_.-]{0,63}(?:/[A-Za-z][A-Za-z0-9_.-]{0,63})?$`)

func boundedCompletionTotal(value any) (int, bool) {
	switch typed := value.(type) {
	case int:
		if typed >= 0 && typed <= 1000000 { return typed, true }
	case int64:
		if typed >= 0 && typed <= 1000000 { return int(typed), true }
	case float64:
		if typed >= 0 && typed <= 1000000 && typed == float64(int(typed)) { return int(typed), true }
	}
	return 0, false
}

func boundedCountFrom(result map[string]any, keys ...string) (int, bool) {
	for _, key := range keys { if value, ok := result[key]; ok { return boundedCount(value) } }
	return 0, false
}

func boundedCount(value any) (int, bool) {
	switch typed := value.(type) {
	case []any:
		return minInt(len(typed), 100), true
	case map[string]any:
		return minInt(len(typed), 100), true
	default:
		return 0, false
	}
}

func firstString(result map[string]any, keys ...string) (string, bool) {
	for _, key := range keys { if value, ok := result[key].(string); ok { return value, true } }
	return "", false
}

func firstBool(result map[string]any, keys ...string) (bool, bool) {
	for _, key := range keys { if value, ok := result[key].(bool); ok { return value, true } }
	return false, false
}

func minInt(a int, b int) int { if a < b { return a }; return b }

func boundedSessionID(value string) string {
	value = strings.TrimSpace(value)
	if value == "" { return "transport-session" }
	if len(value) > maxSessionIDLength { return value[:maxSessionIDLength] }
	return value
}

func safeAccountID(value string) string {
	value = strings.TrimSpace(value)
	if value == "" || len(value) > 256 || strings.IndexFunc(value, func(r rune) bool { return r < 0x20 || r == 0x7f || r == '@' }) >= 0 { return "" }
	lower := strings.ToLower(value)
	if strings.Contains(lower, "://") || strings.Contains(lower, "bearer ") || strings.HasPrefix(lower, "eyj") || strings.HasPrefix(lower, "tmcp_") || strings.HasPrefix(lower, "sk-") { return "" }
	return value
}

func resolveAccountID(resolver func() string) (value string) {
	defer func() { if recover() != nil { value = "" } }()
	return safeAccountID(resolver())
}

func hashAccountID(value string) string { sum := sha256.Sum256([]byte(value)); return hex.EncodeToString(sum[:]) }

var catalogKinds = map[string]bool{"tools": true, "resources": true, "resource_templates": true, "prompts": true}
var transportKinds = map[string]bool{"stdio": true, "streamable_http": true, "sse": true, "custom": true}

func hashCatalogIdentity(value string) string { sum := sha256.Sum256([]byte(value)); return hex.EncodeToString(sum[:]) }

func boolPtr(value bool) *bool { return &value }

func (c *Client) Flush() { _ = c.FlushContext(context.Background()) }

// FlushContext sends one bounded batch and preserves it for a later retry when
// cancellation, request construction, serialization, or delivery fails. The
// telemetry path remains fail-open: the returned error is for caller-owned
// diagnostics and must not block the MCP request.
func (c *Client) FlushContext(ctx context.Context) error {
	if ctx == nil { ctx = context.Background() }
	c.mu.Lock(); if len(c.queue) == 0 { c.mu.Unlock(); return nil }; count := c.options.MaxBatchSize; if count > len(c.queue) { count = len(c.queue) }; events := append([]Event(nil), c.queue[:count]...); c.queue = c.queue[count:]; c.mu.Unlock()
	requeue := func() { c.mu.Lock(); c.queue = append(events, c.queue...); c.mu.Unlock() }
	body, err := json.Marshal(map[string]any{"events": events}); if err != nil { requeue(); return err }
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.options.Endpoint, bytes.NewReader(body)); if err != nil { requeue(); return err }; req.Header.Set("Content-Type", "application/json"); req.Header.Set("Authorization", "Bearer "+c.options.APIKey)
	httpClient := c.options.HTTPClient; if httpClient == nil { httpClient = http.DefaultClient }
	resp, err := httpClient.Do(req); if err != nil { requeue(); return err }
	if resp.StatusCode >= 300 { requeue(); resp.Body.Close(); return fmt.Errorf("trackmcp: ingest returned HTTP %d", resp.StatusCode) }
	resp.Body.Close(); return nil
}

func id() string { raw := make([]byte, 16); if _, err := rand.Read(raw); err != nil { return time.Now().Format("20060102150405") }; return hex.EncodeToString(raw) }

func FromEnv() *Client { return New(Options{APIKey: os.Getenv("TRACKMCP_KEY"), Service: os.Getenv("TRACKMCP_SERVICE"), Environment: os.Getenv("TRACKMCP_ENVIRONMENT")}) }
