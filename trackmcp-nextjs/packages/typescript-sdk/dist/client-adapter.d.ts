import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { type TrackMCPEventHook, type TrackMCPOptions, type TrackMCPCorrelationOptions } from "./index.js";
export type TrackMCPClientTransportLabel = "stdio" | "streamable_http";
export type TrackMCPClientSessionSource = "protocol" | "transport_generated" | "external";
export type TrackMCPClientSession = {
    id: string;
    source: TrackMCPClientSessionSource;
};
export type TrackMCPClientCorrelation = Pick<TrackMCPCorrelationOptions, "resolve"> & {
    mode: "external";
};
export type TrackMCPClientAdapterOptions = Omit<TrackMCPOptions, "payloadMode" | "redact" | "redactKeys" | "redactEvent" | "intentFallback" | "correlation"> & {
    service: string;
    transport: TrackMCPClientTransportLabel;
    session?: TrackMCPClientSession;
    correlation?: TrackMCPClientCorrelation;
    onEvent?: TrackMCPEventHook;
};
export declare class TrackMCPClientAdapter {
    private readonly client;
    private readonly options;
    private readonly pending;
    private readonly pendingOrder;
    private readonly completedIds;
    private readonly seenRequestIds;
    private readonly lastIssued;
    private readonly wrapped;
    private readonly transportDiagnostics;
    private readonly pendingSweepTimer;
    private lifecycleStarted;
    private lifecycleEnded;
    private lifecycleGeneration;
    private lastResultRequestId;
    private lastResultAt;
    private clientName;
    private clientVersion;
    private protocolSessionId;
    constructor(options: TrackMCPClientAdapterOptions);
    wrapTransport<T extends Transport>(transport: T): T;
    flush(): Promise<void>;
    getDiagnostics(): {
        lifecycle_generation: number;
        pending_request_count: number;
        repeat_group_count: number;
        malformedMessages: number;
        unmatchedMessages: number;
        duplicateMessages: number;
        expiredMessages: number;
        droppedEvents: number;
        hookErrors: number;
        privacyErrors: number;
        queuedEvents: number;
        queuedBytes: number;
    };
    private observeOutgoing;
    private observeIncoming;
    private addPending;
    private sweepPending;
    private removePending;
    private repeatFor;
    private markCompleted;
    private emitSessionBoundary;
    private endLifecycle;
    private sessionFields;
    private emit;
    private keyFor;
}
