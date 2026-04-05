// Supabase Edge Function: check-all-watches
// Cron entry point: queries all active watches and invokes check-watch for those due.
// Designed to be called by pg_cron every 5 minutes.
// Respects each watch's check_frequency so a "Daily" watch isn't checked every 5 min.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Maps the CheckFrequency raw values (from iOS enum) to seconds
const FREQUENCY_SECONDS: Record<string, number> = {
  "Daily": 86400,
  "Every 12 hours": 43200,
  "Every 6 hours": 21600,
  "Every 4 hours": 14400,
  "Every 2 hours": 7200,
  // Legacy frequencies (migrated to Every 2 hours in app, but still valid in DB)
  "Every hour": 3600,
  "Every 30 min": 1800,
  "Every 15 min": 900,
  "Every 5 min": 300,
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

    // Fetch all active watches with user_id to enforce tier limits
    // Triggered watches are re-checked at reduced frequency for self-healing
    const { data: watches, error } = await supabase
      .from("watches")
      .select("id, user_id, check_frequency, last_checked, preferred_check_time, triggered, status, consecutive_failures, needs_attention")
      .in("status", ["watching", "triggered"])
      .or("consecutive_failures.lt.30,consecutive_failures.is.null");

    // ─── Tier enforcement: cap frequency based on user's subscription tier ───
    // Build a map of user_id → subscription_tier
    const userIds = [...new Set((watches ?? []).map((w: any) => w.user_id).filter(Boolean))];
    const tierMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, subscription_tier")
        .in("id", userIds);
      for (const p of profiles ?? []) {
        tierMap[p.id] = p.subscription_tier ?? "free";
      }
    }

    // Max allowed frequency per tier (in seconds)
    const TIER_MAX_FREQ: Record<string, number> = {
      free: 86400,      // Daily
      pro: 43200,       // Every 12 hours
      premium: 7200,    // Every 2 hours
    };

    // Enforce: if a watch's frequency is faster than their tier allows, treat it as the tier max
    for (const w of watches ?? []) {
      const userTier = tierMap[w.user_id] ?? "free";
      const tierMax = TIER_MAX_FREQ[userTier] ?? 86400;
      const watchFreq = FREQUENCY_SECONDS[w.check_frequency] ?? 86400;
      if (watchFreq < tierMax) {
        // Watch frequency exceeds tier — cap it
        // Find the appropriate frequency name for this tier
        const cappedFreqName = Object.entries(FREQUENCY_SECONDS).find(([_, v]) => v === tierMax)?.[0] ?? "Daily";
        console.log(`[check-all] Tier enforcement: ${w.id} has "${w.check_frequency}" but user tier is ${userTier}, capping to "${cappedFreqName}"`);
        w.check_frequency = cappedFreqName;

        // Also fix in database (one-time correction)
        await supabase
          .from("watches")
          .update({ check_frequency: cappedFreqName })
          .eq("id", w.id);
      }
    }

    if (error) {
      console.error(`[check-all] Query error: ${JSON.stringify(error)}`);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!watches || watches.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No active watches to check",
          totalActive: 0,
          dueChecked: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build case-insensitive frequency lookup as safety net
    const FREQ_LOWER: Record<string, number> = {};
    for (const [k, v] of Object.entries(FREQUENCY_SECONDS)) {
      FREQ_LOWER[k.toLowerCase()] = v;
    }

    // Filter to only watches that are "due" based on their frequency
    const now = Date.now();
    const dueWatches = watches.filter((w) => {
      // Never checked → always due
      if (!w.last_checked) return true;

      const rawInterval = FREQUENCY_SECONDS[w.check_frequency]
        ?? FREQ_LOWER[(w.check_frequency || "").toLowerCase()];
      if (rawInterval === undefined) {
        console.warn(`[check-all] Unknown frequency "${w.check_frequency}" for watch ${w.id}, defaulting to Daily`);
      }
      let intervalMs = (rawInterval ?? 86400) * 1000;

      // Triggered watches check at 2× their normal interval (reduced frequency)
      if (w.triggered) {
        intervalMs *= 2;
      }

      // Backoff: watches flagged needs_attention check at 4× interval to save API credits
      if (w.needs_attention) {
        intervalMs *= 4;
      }

      const lastCheckedMs = new Date(w.last_checked).getTime();
      return now - lastCheckedMs >= intervalMs;
    });

    if (dueWatches.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No watches due for checking",
          totalActive: watches.length,
          dueChecked: 0,
          watches: watches.map((w) => ({
            id: w.id,
            frequency: w.check_frequency,
            last_checked: w.last_checked,
          })),
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Invoke check-watch for each due watch (staggered to avoid API rate limits)
    // Process sequentially with a small delay between each to spread out Anthropic API calls
    const DELAY_BETWEEN_CHECKS_MS = 1500; // 1.5 seconds between each check
    const details: any[] = [];
    let succeeded = 0;

    for (let i = 0; i < dueWatches.length; i++) {
      const watch = dueWatches[i];

      try {
        const { data, error: invokeError } = await supabase.functions.invoke(
          "check-watch",
          { body: { watch_id: watch.id } }
        );

        if (invokeError) {
          console.error(
            `[check-all] check-watch invoke error for ${watch.id}: ${invokeError.message}`
          );
          details.push({ watch_id: watch.id, error: invokeError.message });
        } else {
          details.push({ watch_id: watch.id, result: data });
          succeeded++;
        }
      } catch (err) {
        details.push({ watch_id: watch.id, error: err instanceof Error ? err.message : "Unknown error" });
      }

      // Delay between checks to avoid rate limit bursts (skip after last one)
      if (i < dueWatches.length - 1) {
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_CHECKS_MS));
      }
    }

    const failed = dueWatches.length - succeeded;

    return new Response(
      JSON.stringify({
        totalActive: watches.length,
        dueChecked: dueWatches.length,
        succeeded,
        failed,
        details,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[check-all] Unhandled error: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
