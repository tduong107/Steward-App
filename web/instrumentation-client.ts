import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  capture_pageview: false, // Captured manually in PostHogProvider for SPA route changes
  capture_pageleave: true,
  autocapture: true,
  persistence: "localStorage+cookie",
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
});
