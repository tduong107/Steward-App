// Supabase Edge Function: probe-session
//
// Sends a lightweight, read-only request to the retailer using the watch's
// stored session cookies, and reports whether the server still considers
// the user logged in. This is the "Test Session" button on the watch
// detail page — it lets a user find out their auto-cart will fail BEFORE
// a real trigger fires, so they can re-sign-in proactively.
//
// Unlike execute-action, this never attempts an add-to-cart and never
// writes `action_executed`. It's a pure GET with success detection.
//
// Inspired by: if Amazon redirects us to /ap/signin, we're logged out.
// If we get a 200 with a logged-in marker ("Hello, <name>"), we're in.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProbeResult {
  /** True when the retailer still recognizes the session. */
  logged_in: boolean;
  /** User-facing one-liner describing the outcome. */
  detail: string;
  /** Internal diagnostic — which probe URL was hit. */
  probe_url?: string;
  /** HTTP status returned by the retailer. */
  http_status?: number;
  /** Retailer hostname we probed. */
  retailer?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { watch_id, user_id } = await req.json();

    if (!watch_id || !user_id) {
      return json(400, {
        logged_in: false,
        detail: "watch_id and user_id required",
      } satisfies ProbeResult);
    }

    // Load the watch + verify ownership. Using service role for cookie
    // access; ownership check gates it.
    const { data: watch, error: watchError } = await supabase
      .from("watches")
      .select("id, user_id, url, site_cookies, cookie_status, cookie_domain")
      .eq("id", watch_id)
      .eq("user_id", user_id)
      .single();

    if (watchError || !watch) {
      return json(404, {
        logged_in: false,
        detail: "Watch not found.",
      } satisfies ProbeResult);
    }

    // Early-exit cases — no point hitting the retailer if we already know
    // the answer locally.
    if (!watch.site_cookies) {
      return json(200, {
        logged_in: false,
        detail:
          "No session stored. Sign in through the iOS share sheet to enable auto-cart.",
      } satisfies ProbeResult);
    }
    if (watch.cookie_status && watch.cookie_status !== "active") {
      return json(200, {
        logged_in: false,
        detail:
          "Session was marked inactive on a previous attempt. Re-sign in via the iOS share sheet.",
      } satisfies ProbeResult);
    }

    const cookieHeader = buildCookieHeader(watch);
    if (!cookieHeader) {
      return json(200, {
        logged_in: false,
        detail:
          "Stored cookies have all expired. Re-sign in via the iOS share sheet.",
      } satisfies ProbeResult);
    }

    // Pick a retailer-specific probe URL. Each is a page that's cheap to
    // fetch AND has a clear logged-in vs logged-out signal in the HTML.
    const probe = pickProbeForURL(watch.url);
    if (!probe) {
      return json(200, {
        logged_in: false,
        detail:
          "We don't have a session probe for this retailer yet. Auto-cart may still work — we'll find out on the next trigger.",
      } satisfies ProbeResult);
    }

    const result = await runProbe(probe, cookieHeader);
    return json(200, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[probe-session] Unhandled error: ${message}`);
    return json(500, {
      logged_in: false,
      detail: "Something went wrong checking your session. Try again in a moment.",
    } satisfies ProbeResult);
  }
});

// ─── Helpers ───────────────────────────────────────────────────────────

function json(status: number, body: ProbeResult) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface ProbeSpec {
  retailer: string;
  url: string;
  /** Strings in the response body that indicate we're still logged in. */
  loggedInMarkers: string[];
  /** Strings that indicate we're logged out (redirect to sign-in, etc.). */
  loggedOutMarkers: string[];
}

/**
 * Maps a product URL to the probe config for its retailer. Returns null
 * for retailers we haven't mapped yet. Keep this list in sync with the
 * execute-action function's supported retailers.
 */
function pickProbeForURL(url: string): ProbeSpec | null {
  const lower = url.toLowerCase();

  if (lower.includes("amazon.com")) {
    return {
      retailer: "Amazon",
      // Account page — returns the logged-in name in the header when
      // authenticated, redirects to /ap/signin otherwise.
      url: "https://www.amazon.com/gp/css/homepage.html",
      loggedInMarkers: ["Your Account", "Your Orders", "Sign Out", "nav-item-signout"],
      loggedOutMarkers: ["/ap/signin", "Sign-In", "Sign in to your account"],
    };
  }
  if (lower.includes("target.com")) {
    return {
      retailer: "Target",
      url: "https://www.target.com/account",
      loggedInMarkers: ["Sign out", "Hi,", "My account"],
      loggedOutMarkers: ["Sign into your account", "data-test=\"login-button\""],
    };
  }
  if (lower.includes("walmart.com")) {
    return {
      retailer: "Walmart",
      url: "https://www.walmart.com/account",
      loggedInMarkers: ["Sign Out", "Your account", "My Items"],
      loggedOutMarkers: ["Sign in or create account", "/account/login"],
    };
  }
  if (lower.includes("bestbuy.com")) {
    return {
      retailer: "Best Buy",
      url: "https://www.bestbuy.com/site/customer/myaccount/authentication/ui",
      loggedInMarkers: ["My Best Buy", "Sign Out", "Account Dashboard"],
      loggedOutMarkers: ["Sign in", "Create an account"],
    };
  }
  if (lower.includes("myshopify.com") || lower.includes("shopify")) {
    try {
      const origin = new URL(url).origin;
      return {
        retailer: "Shopify",
        url: `${origin}/account`,
        loggedInMarkers: ["Log out", "Account", "Order history"],
        loggedOutMarkers: ["/account/login", "Sign in", "Create account"],
      };
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Actually fires the probe GET. Range-limits the response to 50KB so we
 * don't pay for a full HTML page when the logged-in indicator is always
 * in the head/nav. 8-second timeout to keep the UI responsive.
 */
async function runProbe(probe: ProbeSpec, cookieHeader: string): Promise<ProbeResult> {
  try {
    const response = await fetch(probe.url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Range: "bytes=0-50000",
        Cookie: cookieHeader,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    // Response URL tells us about redirects — Amazon etc. will 302 to
    // /ap/signin when the session is dead.
    const finalUrl = response.url || probe.url;
    const finalUrlLower = finalUrl.toLowerCase();

    const redirectedToSignIn =
      finalUrlLower.includes("/signin") ||
      finalUrlLower.includes("/login") ||
      finalUrlLower.includes("/ap/signin") ||
      finalUrlLower.includes("/auth/login");

    if (redirectedToSignIn) {
      return {
        logged_in: false,
        detail: `${probe.retailer} redirected us to sign-in. Your session has expired — re-sign in via the iOS share sheet.`,
        probe_url: probe.url,
        http_status: response.status,
        retailer: probe.retailer,
      };
    }

    const body = await response.text();

    // Strong signal first: explicit logged-in marker present.
    const hasLoggedIn = probe.loggedInMarkers.some((m) => body.includes(m));
    if (hasLoggedIn) {
      return {
        logged_in: true,
        detail: `${probe.retailer} session is active. Auto-cart should work on the next trigger.`,
        probe_url: probe.url,
        http_status: response.status,
        retailer: probe.retailer,
      };
    }

    // Fallback: explicit logged-out marker.
    const hasLoggedOut = probe.loggedOutMarkers.some((m) => body.includes(m));
    if (hasLoggedOut) {
      return {
        logged_in: false,
        detail: `${probe.retailer} shows a sign-in prompt. Your session has expired — re-sign in via the iOS share sheet.`,
        probe_url: probe.url,
        http_status: response.status,
        retailer: probe.retailer,
      };
    }

    // Ambiguous — neither marker present. Most often this means we got
    // a bot-check / captcha page. Report as unknown rather than lie.
    return {
      logged_in: false,
      detail: `${probe.retailer} returned an unfamiliar page (possibly bot-detection). Try again in a few minutes or re-sign in via the iOS share sheet.`,
      probe_url: probe.url,
      http_status: response.status,
      retailer: probe.retailer,
    };
  } catch (err) {
    return {
      logged_in: false,
      detail: `Couldn't reach ${probe.retailer}: ${(err as Error).message}`,
      probe_url: probe.url,
      retailer: probe.retailer,
    };
  }
}

/**
 * Builds a Cookie header from the watch's stored serialized cookies.
 * Filters out expired cookies. Returns null if nothing usable remains.
 * (Same shape/logic as execute-action's version — kept duplicated
 * intentionally so the two functions deploy independently.)
 */
function buildCookieHeader(watch: { site_cookies: string | null; cookie_status: string | null }): string | null {
  if (!watch.site_cookies) return null;
  if (watch.cookie_status && watch.cookie_status !== "active") return null;

  try {
    const cookies = JSON.parse(watch.site_cookies);
    if (!Array.isArray(cookies) || cookies.length === 0) return null;

    const now = Date.now() / 1000;
    const validCookies = cookies.filter(
      // deno-lint-ignore no-explicit-any
      (c: any) => !c.expiresDate || c.expiresDate > now
    );

    if (validCookies.length === 0) return null;

    // deno-lint-ignore no-explicit-any
    return validCookies.map((c: any) => `${c.name}=${c.value}`).join("; ");
  } catch {
    return null;
  }
}
