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

    // Fetch all active watches (watching + triggered) with their frequency and last check time
    // Triggered watches are re-checked at reduced frequency for self-healing
    const { data: watches, error } = await supabase
      .from("watches")
      .select("id, check_frequency, last_checked, preferred_check_time, triggered, status")
      .in("status", ["watching", "triggered"]);

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
        details.push({ watch_id: watch.id, error: err.message ?? "Unknown error" });
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
    console.error(`[check-all] Unhandled error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
