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
      .catch(() => null);
  }
  return posthogPromise;
}

export function schedulePostHogInit() {
  if (typeof window === "undefined" || !projectToken) return;
  const initialize = () => {
    void loadPostHog();
  };
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  };
  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(initialize, { timeout: 3000 });
  } else {
    window.setTimeout(initialize, 3000);
  }
}

export function capturePostHog(name: string, properties: Record<string, unknown>) {
  void loadPostHog().then((posthog) => {
    if (posthog) posthog.capture(name, properties);
  });
}

export function identifyPostHog(userId: string, properties: Record<string, unknown>) {
  void loadPostHog().then((posthog) => {
    if (posthog) posthog.identify(userId, properties);
  });
}

export function registerPostHog(properties: Record<string, unknown>) {
  void loadPostHog().then((posthog) => {
    if (posthog) posthog.register(properties);
  });
}

export function resetPostHog() {
  void loadPostHog().then((posthog) => {
    if (posthog) posthog.reset();
  });
}
