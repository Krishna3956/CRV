"use client";

type PostHogClient = {
  init: (token: string, config: Record<string, unknown>) => unknown;
  capture: (name: string, properties?: Record<string, unknown>) => unknown;
  identify: (userId: string, properties?: Record<string, unknown>) => unknown;
  register: (properties: Record<string, unknown>) => unknown;
  reset: () => unknown;
};

const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
let posthogPromise: Promise<PostHogClient | null> | null = null;
let posthogClient: PostHogClient | null | undefined;
let idleScheduled = false;
const pendingActions: Array<(posthog: PostHogClient) => void> = [];

function loadPostHog(): Promise<PostHogClient | null> {
  if (typeof window === "undefined" || !projectToken) return Promise.resolve(null);
  if (!posthogPromise) {
    posthogPromise = import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(projectToken, {
          api_host: apiHost,
          defaults: "2026-05-30",
          autocapture: true,
          capture_pageview: "history_change",
          capture_pageleave: true,
          capture_dead_clicks: true,
          capture_heatmaps: true,
          capture_exceptions: true,
          capture_performance: {
            network_timing: true,
            web_vitals: true,
          },
          disable_capture_url_hashes: true,
          person_profiles: "identified_only",
          session_recording: {
            maskAllInputs: true,
            recordHeaders: false,
            recordBody: false,
          },
          tracing_headers: ["trackmcp.com", "www.trackmcp.com", "app.trackmcp.com", "localhost"],
        });
        return posthog as PostHogClient;
      })
      .catch(() => null)
      .then((posthog) => {
        posthogClient = posthog;
        if (posthog) {
          for (const action of pendingActions.splice(0)) action(posthog);
        } else {
          pendingActions.length = 0;
        }
        return posthog;
      });
  }
  return posthogPromise;
}

export function schedulePostHogInit() {
  if (typeof window === "undefined" || !projectToken) return;
  if (idleScheduled || posthogClient) return;
  idleScheduled = true;
  const initialize = () => {
    void loadPostHog();
  };
  const scheduleIdle = () => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    };
    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(initialize, { timeout: 10000 });
    } else {
      initialize();
    }
  };
  // Keep optional recorder/survey code out of the first interaction and LCP
  // windows. The event queue preserves attribution until this bounded delay.
  window.setTimeout(scheduleIdle, 10000);
}

export function capturePostHog(name: string, properties: Record<string, unknown>) {
  queuePostHog((posthog) => posthog.capture(name, properties));
}

export function identifyPostHog(userId: string, properties: Record<string, unknown>) {
  queuePostHog((posthog) => posthog.identify(userId, properties));
}

export function registerPostHog(properties: Record<string, unknown>) {
  queuePostHog((posthog) => posthog.register(properties));
}

export function resetPostHog() {
  queuePostHog((posthog) => posthog.reset());
}

function queuePostHog(action: (posthog: PostHogClient) => void) {
  if (typeof window === "undefined" || !projectToken) return;
  if (posthogClient) {
    action(posthogClient);
    return;
  }
  pendingActions.push(action);
  schedulePostHogInit();
}
