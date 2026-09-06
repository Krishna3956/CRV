import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

if (projectToken) {
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
}
