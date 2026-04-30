import posthog from "posthog-js";

// PERF: aggressive trimming of PostHog's first-load footprint.
// PageSpeed (April 30 2026) flagged ~428 KiB of unused JavaScript on
// the landing page and 20 long tasks consuming 33s of main-thread
// time under throttling. PostHog's session-recording subbundle
// (~70 KiB minified, plus heavy DOM mutation observer setup) was a
// disproportionate share of that, even on routes where we never
// open a recording. The flags below shape PostHog into a "tracking-
// only" client at boot:
//
// - `disable_session_recording: true` — recorder.js no longer loads
//   on page load. If we ever want recordings for a specific user
//   journey, call `posthog.startSessionRecording()` after the page
//   becomes interactive.
// - `disable_surveys: true` — the surveys subbundle and its DOM
//   poller don't load. We're not running surveys today; flip back
//   when we are.
// - `advanced_disable_decide` — skips the boot-time `/decide` call,
//   which gates feature flags + surveys + autocapture config. We
//   don't currently rely on remote feature-flag config on the
//   landing, so the round-trip is dead weight. Re-enable when we
//   wire feature flags into the marketing flow.
// - `autocapture` stays ON for now since it's the core source of
//   product-engagement data.
// - `capture_exceptions` stays ON — it's lightweight (one
//   `window.addEventListener('error')`) and we want client-side
//   error visibility.
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  capture_pageview: false, // Captured manually in PostHogProvider for SPA route changes
  capture_pageleave: true,
  autocapture: true,
  persistence: "localStorage+cookie",
  capture_exceptions: true,
  disable_session_recording: true,
  disable_surveys: true,
  // PERF investigation note: also tried `advanced_disable_decide: true`
  // in commit 2b5492b but the next PageSpeed run (Apr 30 2026 12:31)
  // came back WORSE on TBT and showed +26 KiB unused JS. Best
  // explanation is that PostHog falls into a different bundling /
  // fallback path when /decide is hard-disabled — the /decide
  // round-trip is a few hundred bytes; the *consequences* of disabling
  // it apparently aren't free. Reverted; the recording + surveys
  // disables alone capture the win we wanted.
  debug: process.env.NODE_ENV === "development",
});

// Register super property so 'platform: web' is sent with every event automatically
posthog.register({ platform: "web" });
