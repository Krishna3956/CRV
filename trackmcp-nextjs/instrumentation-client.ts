import { schedulePostHogInit } from "./src/lib/posthog-client";

// PostHog is optional product analytics. Schedule it after the first paint so
// its SDK cannot delay server-rendered article content or the LCP candidate.
schedulePostHogInit();
