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

    // Fetch all active (watching) watches with their frequency and last check time
    const { data: watches, error } = await supabase
      .from("watches")
      .select("id, check_frequency, last_checked")
      .eq("status", "watching")
      .eq("triggered", false);

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

    // Filter to only watches that are "due" based on their frequency
    const now = Date.now();
    const dueWatches = watches.filter((w) => {
      // Never checked → always due
      if (!w.last_checked) return true;

      const intervalMs =
        (FREQUENCY_SECONDS[w.check_frequency] ?? 86400) * 1000;
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

    // Invoke check-watch for each due watch (in parallel)
    const results = await Promise.allSettled(
      dueWatches.map(async (watch) => {
        const { data, error: invokeError } = await supabase.functions.invoke(
          "check-watch",
          { body: { watch_id: watch.id } }
        );

        if (invokeError) {
          console.error(
            `[check-all] check-watch invoke error for ${watch.id}: ${invokeError.message}`
          );
          return { watch_id: watch.id, error: invokeError.message };
        }

        return { watch_id: watch.id, result: data };
      })
    );

    const details = results.map((r) => {
      if (r.status === "fulfilled") return r.value;
      return { error: r.reason?.message ?? "Unknown error" };
    });

    const succeeded = results.filter(
      (r) => r.status === "fulfilled" && !(r.value as any)?.error
    ).length;
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
