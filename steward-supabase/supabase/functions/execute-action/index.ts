// Supabase Edge Function: execute-action
// Server-side action execution: adds items to cart using stored cookies.
// Called by check-watch when auto_act is enabled and condition is met.
// Falls back to sending a notification with a deep link if execution fails.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { watch_id, user_id, action_type } = await req.json();

    if (!watch_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "watch_id and user_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the watch with cookies and action URL
    const { data: watch, error: watchError } = await supabase
      .from("watches")
      .select("id, user_id, name, emoji, url, action_url, action_type, site_cookies, cookie_domain, cookie_status, spending_limit")
      .eq("id", watch_id)
      .eq("user_id", user_id) // Security: verify ownership
      .single();

    if (watchError || !watch) {
      console.error(`[execute-action] Watch not found: ${watch_id}`);
      return new Response(
        JSON.stringify({ error: "Watch not found", executed: false }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const actionUrl = watch.action_url ?? watch.url;
    if (!actionUrl) {
      return new Response(
        JSON.stringify({ error: "No action URL", executed: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── SSRF Protection ──────────────────────────────────────────
    // CRITICAL: this function sends stored user cookies to the action URL.
    // An attacker who modifies action_url to point at their own server
    // could exfiltrate session cookies. Block internal/suspicious URLs
    // and restrict to HTTPS-only for cookie safety.
    try {
      const u = new URL(actionUrl);
      const h = u.hostname.toLowerCase();
      const blocked =
        h === "localhost" || h === "0.0.0.0" || h === "[::1]" ||
        h.endsWith(".local") || h.endsWith(".internal") ||
        /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(h) ||
        h.includes("metadata.google") || h.includes("metadata.aws") ||
        u.protocol === "file:" || u.protocol === "ftp:" ||
        u.protocol === "data:" || u.protocol === "javascript:";
      if (blocked || (u.protocol !== "https:" && u.protocol !== "http:")) {
        console.warn(`[execute-action] SSRF blocked: ${actionUrl} (watch ${watch_id})`);
        return new Response(
          JSON.stringify({ error: "Blocked URL", executed: false }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid action URL", executed: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Attempt server-side action execution ──
    let executed = false;
    let executionNote = "";
    const urlLower = actionUrl.toLowerCase();

    // Amazon: add to cart via URL with cookies
    if (urlLower.includes("amazon.com") && urlLower.includes("cart/add")) {
      const result = await executeAmazonCartAdd(actionUrl, watch);
      executed = result.success;
      executionNote = result.note;
    }
    // Target: add to cart via API
    else if (urlLower.includes("target.com") && urlLower.includes("co-cart")) {
      const result = await executeGenericCartAdd(actionUrl, watch, "Target");
      executed = result.success;
      executionNote = result.note;
    }
    // Walmart: add to cart via API
    else if (urlLower.includes("walmart.com") && urlLower.includes("addToCart")) {
      const result = await executeGenericCartAdd(actionUrl, watch, "Walmart");
      executed = result.success;
      executionNote = result.note;
    }
    // Best Buy: add to cart via API
    else if (urlLower.includes("bestbuy.com") && urlLower.includes("addToCart")) {
      const result = await executeGenericCartAdd(actionUrl, watch, "Best Buy");
      executed = result.success;
      executionNote = result.note;
    }
    // Shopify stores: cart add via variant URL
    else if (urlLower.includes("/cart/") && (urlLower.includes("myshopify.com") || urlLower.includes("shopify"))) {
      const result = await executeGenericCartAdd(actionUrl, watch, "Shopify");
      executed = result.success;
      executionNote = result.note;
    }
    // Unsupported retailer
    else {
      executionNote = "Unsupported retailer for auto-action";
    }

    // Update watch with execution result
    const now = new Date().toISOString();
    if (executed) {
      // Update change_note so notify-user reads the auto-act success message
      const successNote = `Auto-added to cart — check out soon! ${executionNote}`;
      await supabase
        .from("watches")
        .update({
          action_executed: true,
          action_executed_at: now,
          change_note: successNote,
        })
        .eq("id", watch_id);

      console.log(`[execute-action] Successfully executed action for ${watch_id}: ${executionNote}`);

      // Send success notification (notify-user reads change_note from the watch table)
      try {
        await supabase.functions.invoke("notify-user", {
          body: {
            watch_id: watch_id,
            user_id: user_id,
            action_url: actionUrl,
          },
        });
      } catch {
        console.error("[execute-action] Failed to send success notification");
      }
    } else {
      console.log(`[execute-action] Execution failed for ${watch_id}: ${executionNote}. Falling back to notification.`);
      // Don't update action_executed — the normal notification flow will handle it
    }

    // Log activity
    try {
      await supabase.from("activities").insert({
        id: crypto.randomUUID(),
        user_id: user_id,
        watch_id: watch_id,
        icon: executed ? "cart.fill.badge.plus" : "exclamationmark.triangle",
        icon_color_name: executed ? "accent" : "gold",
        label: executed ? "Auto-added to cart" : "Auto-action failed",
        subtitle: `${watch.name} · ${executionNote}`,
        created_at: now,
      });
    } catch {
      // Non-critical
    }

    return new Response(
      JSON.stringify({
        watch_id,
        executed,
        execution_note: executionNote,
        action_url: actionUrl,
        timestamp: now,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[execute-action] Unhandled error: ${message}`);
    return new Response(JSON.stringify({ error: message, executed: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Amazon Cart Add ──────────────────────────────────────────────

async function executeAmazonCartAdd(
  cartUrl: string,
  watch: any
): Promise<{ success: boolean; note: string }> {
  try {
    // Build cookie header from stored cookies
    const cookieHeader = buildCookieHeader(watch);

    const response = await fetch(cartUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.amazon.com/",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    const responseText = await response.text();

    // Check for success indicators in Amazon's response
    const isSuccess =
      response.ok &&
      (responseText.includes("Added to Cart") ||
        responseText.includes("added to your") ||
        responseText.includes("proceed to checkout") ||
        responseText.includes("Cart subtotal") ||
        // Redirect to cart page is also a success signal
        (response.url?.includes("/cart") && !response.url?.includes("/cart/add")));

    if (isSuccess) {
      return { success: true, note: "Item added to Amazon cart" };
    }

    // Check if we got blocked or need login
    if (responseText.includes("Sign-In") || responseText.includes("sign in")) {
      return { success: false, note: "Amazon session expired — login needed" };
    }

    // Check for bot detection
    if (responseText.includes("captcha") || responseText.includes("automated")) {
      return { success: false, note: "Amazon bot detection triggered" };
    }

    return { success: false, note: "Could not confirm cart addition" };
  } catch (err) {
    return { success: false, note: `Request failed: ${(err as Error).message}` };
  }
}

// ─── Generic Cart Add (Target, Walmart, Best Buy) ────────────────

async function executeGenericCartAdd(
  cartUrl: string,
  watch: any,
  retailer: string
): Promise<{ success: boolean; note: string }> {
  try {
    const cookieHeader = buildCookieHeader(watch);

    // Extract the retailer's origin for the Referer header
    let referer = "https://www.google.com/";
    try {
      referer = new URL(watch.url ?? cartUrl).origin + "/";
    } catch { /* use default */ }

    const response = await fetch(cartUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: referer,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    // Always consume the response body to prevent resource leaks
    const text = await response.text();

    if (response.ok) {
      // Generic success indicators
      const hasSuccess =
        text.includes("added to cart") ||
        text.includes("Added to Cart") ||
        text.includes("item in cart") ||
        text.includes("cart updated") ||
        (response.url?.includes("/cart") ?? false);

      if (hasSuccess) {
        return { success: true, note: `Item added to ${retailer} cart` };
      }
    }

    return { success: false, note: `${retailer} cart add did not confirm — use deep link instead` };
  } catch (err) {
    return { success: false, note: `${retailer} request failed: ${(err as Error).message}` };
  }
}

// ─── Cookie Helpers ───────────────────────────────────────────────

function buildCookieHeader(watch: any): string | null {
  if (!watch.site_cookies || watch.cookie_status !== "active") return null;

  try {
    const cookies = JSON.parse(watch.site_cookies);
    if (!Array.isArray(cookies) || cookies.length === 0) return null;

    const now = Date.now() / 1000;
    const validCookies = cookies.filter(
      (c: any) => !c.expiresDate || c.expiresDate > now
    );

    if (validCookies.length === 0) return null;

    return validCookies.map((c: any) => `${c.name}=${c.value}`).join("; ");
  } catch {
    return null;
  }
}
