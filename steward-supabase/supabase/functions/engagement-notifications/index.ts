// Supabase Edge Function: engagement-notifications
// Called by daily cron at 10am PT (18:00 UTC).
// Sends engagement/retention push notifications to drive activation, habit, and monetization.
// Uses engagement_notifications_sent table to prevent duplicate sends.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const results: Record<string, number> = {
    unused_slots: 0,
    weekly_summary: 0,
    watch_milestone: 0,
    upgrade_nudge: 0,
    inactive_reengagement: 0,
  };

  try {
    // ─── Helper: check if notification already sent ───────────────
    async function alreadySent(userId: string, key: string): Promise<boolean> {
      const { data } = await supabase
        .from("engagement_notifications_sent")
        .select("id")
        .eq("user_id", userId)
        .eq("notification_key", key)
        .maybeSingle();
      return !!data;
    }

    // ─── Helper: mark notification as sent (idempotent) ──────────
    async function markSent(userId: string, key: string): Promise<void> {
      await supabase
        .from("engagement_notifications_sent")
        .upsert({ user_id: userId, notification_key: key }, { onConflict: "user_id,notification_key" });
    }

    // ─── Helper: send engagement push via notify-user ────────────
    async function sendEngagement(
      userId: string,
      key: string,
      title: string,
      body: string,
      watchId?: string
    ): Promise<boolean> {
      if (await alreadySent(userId, key)) return false;

      try {
        const { data, error } = await supabase.functions.invoke("notify-user", {
          body: {
            user_id: userId,
            watch_id: watchId ?? null,
            notification_type: "engagement_" + key.split("_")[0],
            engagement_title: title,
            engagement_body: body,
          },
        });

        if (error) {
          console.error(`[engagement] Failed to send ${key} to ${userId}: ${error.message}`);
          return false;
        }

        await markSent(userId, key);
        return true;
      } catch (err) {
        console.error(`[engagement] Error sending ${key}: ${err.message}`);
        return false;
      }
    }

    // ─── 1. Unused Watch Slots (activation) ──────────────────────
    // Free users with <3 watches, 24+ hours after signup
    {
      const { data: freeUsers } = await supabase
        .from("profiles")
        .select("id, display_name, device_token, created_at")
        .eq("subscription_tier", "free")
        .not("device_token", "is", null)
        .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      for (const user of freeUsers ?? []) {
        const { count } = await supabase
          .from("watches")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .neq("status", "deleted");

        const watchCount = count ?? 0;
        if (watchCount < 3) {
          const remaining = 3 - watchCount;
          const sent = await sendEngagement(
            user.id,
            "unused_slots_24h",
            "🎯 You have free watch slots!",
            `You have ${remaining} unused watch slot${remaining > 1 ? "s" : ""}! Track a price, restaurant, or campsite — it takes 30 seconds.`
          );
          if (sent) results.unused_slots++;
        }
      }
    }

    // ─── 2. Weekly Summary (re-engagement) ───────────────────────
    // All users with 1+ watches, sent every Monday
    {
      const today = new Date();
      const dayOfWeek = today.getUTCDay(); // 0=Sun, 1=Mon
      if (dayOfWeek === 1) { // Monday only
        const weekKey = `weekly_summary_${today.toISOString().slice(0, 10)}`;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Get all users with device tokens
        const { data: users } = await supabase
          .from("profiles")
          .select("id, display_name, device_token")
          .not("device_token", "is", null);

        for (const user of users ?? []) {
          // Count active watches
          const { count: activeCount } = await supabase
            .from("watches")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "watching");

          if ((activeCount ?? 0) === 0) continue;

          // Count checks this week
          const { count: checkCount } = await supabase
            .from("check_results")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("checked_at", weekAgo);

          const sent = await sendEngagement(
            user.id,
            weekKey,
            "📊 Your Weekly Steward Report",
            `${activeCount} watch${(activeCount ?? 0) > 1 ? "es" : ""} active, ${checkCount ?? 0} checks this week. Open Steward to see the latest.`
          );
          if (sent) results.weekly_summary++;
        }
      }
    }

    // ─── 3. Watch Milestone — 7 Days Active ──────────────────────
    // Watches created 7+ days ago, still status=watching
    {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

      // Get watches created between 7-8 days ago (window to catch them once)
      const { data: milestoneWatches } = await supabase
        .from("watches")
        .select("id, user_id, name, emoji")
        .eq("status", "watching")
        .lt("created_at", sevenDaysAgo)
        .gte("created_at", eightDaysAgo);

      for (const watch of milestoneWatches ?? []) {
        const sent = await sendEngagement(
          watch.user_id,
          `watch_7day_${watch.id}`,
          `🛡️ 7 days of watching!`,
          `${watch.emoji ?? "👀"} ${watch.name} has been monitored for 7 days. Steward is keeping an eye on it for you.`,
          watch.id
        );
        if (sent) results.watch_milestone++;
      }
    }

    // ─── 4. Upgrade Nudge (monetization) ─────────────────────────
    // Free users at 3/3 watch limit for 3+ days
    {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

      const { data: freeUsers } = await supabase
        .from("profiles")
        .select("id, device_token")
        .eq("subscription_tier", "free")
        .not("device_token", "is", null);

      for (const user of freeUsers ?? []) {
        const { count } = await supabase
          .from("watches")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .neq("status", "deleted");

        if ((count ?? 0) >= 3) {
          // Check if their oldest active watch was created 3+ days ago
          const { data: oldest } = await supabase
            .from("watches")
            .select("created_at")
            .eq("user_id", user.id)
            .neq("status", "deleted")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (oldest && oldest.created_at < threeDaysAgo) {
            const sent = await sendEngagement(
              user.id,
              "upgrade_nudge_limit",
              "📈 All 3 free watches are active!",
              "Upgrade to Pro for 7 watches, faster checks, and email & SMS alerts. Pays for itself with one deal."
            );
            if (sent) results.upgrade_nudge++;
          }
        }
      }
    }

    // ─── 5. Inactive Re-engagement (retention) ───────────────────
    // Users with watches whose last check was 7+ days ago
    {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: users } = await supabase
        .from("profiles")
        .select("id, device_token")
        .not("device_token", "is", null);

      for (const user of users ?? []) {
        // Get their most recently checked watch
        const { data: recentWatch } = await supabase
          .from("watches")
          .select("id, name, emoji, last_checked")
          .eq("user_id", user.id)
          .eq("status", "watching")
          .order("last_checked", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!recentWatch) continue;

        // Only send if last check was 7+ days ago
        if (recentWatch.last_checked && recentWatch.last_checked < sevenDaysAgo) {
          // Check if we already sent this recently (allow re-send after 30 days)
          const { data: prevSent } = await supabase
            .from("engagement_notifications_sent")
            .select("sent_at")
            .eq("user_id", user.id)
            .eq("notification_key", "inactive_7day")
            .maybeSingle();

          if (prevSent && prevSent.sent_at > thirtyDaysAgo) continue;

          // Delete old record if exists (to allow re-send)
          if (prevSent) {
            await supabase
              .from("engagement_notifications_sent")
              .delete()
              .eq("user_id", user.id)
              .eq("notification_key", "inactive_7day");
          }

          const timeAgo = Math.floor((Date.now() - new Date(recentWatch.last_checked).getTime()) / (24 * 60 * 60 * 1000));
          const sent = await sendEngagement(
            user.id,
            "inactive_7day",
            "👋 Your watches are still running!",
            `${recentWatch.emoji ?? "👀"} ${recentWatch.name} was last checked ${timeAgo} days ago. Open Steward to see the latest.`,
            recentWatch.id
          );
          if (sent) results.inactive_reengagement++;
        }
      }
    }

    // ─── 6. Expired Watch Dates (cleanup) ────────────────────────
    // Detect watches with dates in the condition/URL that have already passed
    // e.g., restaurant reservations for April 5 when today is April 10
    results.expired_dates = 0;
    {
      const { data: dateWatches } = await supabase
        .from("watches")
        .select("id, user_id, name, emoji, condition, url, action_type")
        .in("status", ["watching", "triggered"])
        .in("action_type", ["book", "notify"]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const watch of dateWatches ?? []) {
        // Try to extract a date from the condition or URL
        const text = `${watch.condition ?? ""} ${watch.url ?? ""}`;

        // Match patterns: "May 3", "Apr 6, 2026", "2026-05-03", "date=2026-04-05"
        const datePatterns = [
          /date=(\d{4}-\d{2}-\d{2})/i,
          /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2})(?:,?\s*(\d{4}))?/i,
          /(\d{4})-(\d{2})-(\d{2})/,
          /(\d{1,2})\/(d{1,2})\/(\d{4})/,
        ];

        let watchDate: Date | null = null;

        for (const pattern of datePatterns) {
          const match = text.match(pattern);
          if (match) {
            try {
              if (pattern === datePatterns[0] || pattern === datePatterns[2]) {
                // ISO format: date=2026-04-05 or 2026-04-05
                const dateStr = match[1] || match[0];
                const parsed = new Date(dateStr.includes("=") ? dateStr : match[0]);
                if (!isNaN(parsed.getTime())) { watchDate = parsed; break; }
              } else if (pattern === datePatterns[1]) {
                // Month name format: "May 3" or "Apr 6, 2026"
                const monthStr = match[1];
                const day = parseInt(match[2]);
                const year = match[3] ? parseInt(match[3]) : today.getFullYear();
                const monthNames: Record<string, number> = {
                  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
                  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
                };
                const month = monthNames[monthStr.toLowerCase().slice(0, 3)];
                if (month !== undefined && day >= 1 && day <= 31) {
                  watchDate = new Date(year, month, day);
                  break;
                }
              }
            } catch { /* parsing failed, try next pattern */ }
          }
        }

        if (watchDate && watchDate < today) {
          const sent = await sendEngagement(
            watch.user_id,
            `expired_date_${watch.id}`,
            "📅 Watch date has passed",
            `${watch.emoji ?? "👀"} "${watch.name}" was for ${watchDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} which has passed. Update or remove this watch to free up a slot.`,
            watch.id
          );
          if (sent) results.expired_dates++;
        }
      }
    }

    console.log(`[engagement] Results: ${JSON.stringify(results)}`);

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(`[engagement] Fatal error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
