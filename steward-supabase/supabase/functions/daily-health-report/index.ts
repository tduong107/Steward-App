import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Steward <notifications@joinsteward.app>";
    const toEmail = Deno.env.get("HEALTH_REPORT_EMAIL") ?? "hello@joinsteward.app";

    if (!resendKey) {
      return new Response(JSON.stringify({ error: "Resend not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── 1. Overall check stats (last 24h) ───────────────────────────
    let stats = { total_checks: 0, price_found: 0, unreachable: 0, price_not_found: 0, conditions_met: 0 };

    const { data: recentChecks } = await supabase
      .from("check_results")
      .select("price, result_data, condition_met")
      .gte("checked_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (recentChecks) {
      stats.total_checks = recentChecks.length;
      stats.price_found = recentChecks.filter((r: any) => r.price !== null).length;
      stats.unreachable = recentChecks.filter((r: any) => r.result_data?.text === "Could not reach page").length;
      stats.price_not_found = recentChecks.filter((r: any) => r.result_data?.text === "Price not found on page").length;
      stats.conditions_met = recentChecks.filter((r: any) => r.condition_met).length;
    }

    const successRate = stats.total_checks > 0
      ? Math.round((stats.price_found / stats.total_checks) * 100)
      : 0;

    // ─── 2. Watches with failures ────────────────────────────────────
    const { data: failingWatches } = await supabase
      .from("watches")
      .select("id, name, url, consecutive_failures, last_error, needs_attention, status, last_checked")
      .neq("status", "deleted")
      .gt("consecutive_failures", 0)
      .order("consecutive_failures", { ascending: false });

    // ─── 3. Recent failures from watch_failures table (last 24h) ─────
    const { data: recentFailures } = await supabase
      .from("watch_failures")
      .select("domain, failure_type, error_message, method_tried, created_at")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    // Group failures by domain
    const failuresByDomain: Record<string, { count: number; types: Set<string>; methods: Set<string> }> = {};
    for (const f of recentFailures ?? []) {
      if (!failuresByDomain[f.domain]) {
        failuresByDomain[f.domain] = { count: 0, types: new Set(), methods: new Set() };
      }
      failuresByDomain[f.domain].count++;
      failuresByDomain[f.domain].types.add(f.failure_type);
      if (f.method_tried) {
        for (const m of f.method_tried) failuresByDomain[f.domain].methods.add(m);
      }
    }

    // ─── 4. Active watches overview ──────────────────────────────────
    const { data: allWatches } = await supabase
      .from("watches")
      .select("id, status, triggered")
      .neq("status", "deleted");

    const totalActive = allWatches?.length ?? 0;
    const totalTriggered = allWatches?.filter((w: any) => w.triggered).length ?? 0;
    const totalNeedsAttention = failingWatches?.filter((w: any) => w.needs_attention).length ?? 0;

    // ─── 5. User count ───────────────────────────────────────────────
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id", { count: "exact" });
    const userCount = profiles?.length ?? 0;

    // ─── 6. Edge function invocation errors (from logs if available) ─
    // Not directly queryable, but we can infer from watch_failures

    // ─── Build email HTML ────────────────────────────────────────────
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const hasIssues = (failingWatches?.length ?? 0) > 0 || stats.unreachable > 0 || stats.price_not_found > 0;
    const statusEmoji = hasIssues ? "⚠️" : "✅";
    const statusText = hasIssues ? "Issues Detected" : "All Systems Healthy";

    // Health score: 0-100
    const healthScore = stats.total_checks > 0
      ? Math.round(((stats.total_checks - stats.unreachable - stats.price_not_found) / stats.total_checks) * 100)
      : 100;

    const healthColor = healthScore >= 80 ? "#22c55e" : healthScore >= 50 ? "#f59e0b" : "#ef4444";

    let failingWatchesHtml = "";
    if (failingWatches && failingWatches.length > 0) {
      failingWatchesHtml = failingWatches.map((w: any) => {
        const domain = (() => { try { return new URL(w.url).hostname; } catch { return "unknown"; } })();
        return `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;">${w.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;color:#666;">${domain}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center;">
              <span style="background:${w.consecutive_failures >= 5 ? '#fef2f2' : '#fffbeb'};color:${w.consecutive_failures >= 5 ? '#dc2626' : '#d97706'};padding:2px 8px;border-radius:10px;font-weight:600;">${w.consecutive_failures}</span>
            </td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;color:#999;">${w.last_error ?? "—"}</td>
          </tr>`;
      }).join("");
    }

    let domainFailuresHtml = "";
    const sortedDomains = Object.entries(failuresByDomain).sort((a, b) => b[1].count - a[1].count);
    if (sortedDomains.length > 0) {
      domainFailuresHtml = sortedDomains.map(([domain, info]) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;">${domain}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center;">${info.count}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;color:#666;">${Array.from(info.types).join(", ")}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;color:#999;">${Array.from(info.methods).join(" → ")}</td>
        </tr>`
      ).join("");
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0F2018,#1C3D2E);border-radius:16px;padding:24px 28px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;background:#2A5C45;border-radius:10px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#6EE7B7;font-weight:bold;font-size:18px;">S</span>
        </div>
        <div>
          <div style="color:#F7F6F3;font-size:18px;font-weight:700;">Steward Daily Report</div>
          <div style="color:#F7F6F3;opacity:0.5;font-size:12px;">${dateStr}</div>
        </div>
      </div>
    </div>

    <!-- Status Banner -->
    <div style="background:white;border-radius:12px;padding:20px 24px;margin-bottom:16px;border:1px solid #e5e5e5;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:14px;color:#666;margin-bottom:4px;">System Status</div>
          <div style="font-size:20px;font-weight:700;color:#111;">${statusEmoji} ${statusText}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:36px;font-weight:800;color:${healthColor};">${healthScore}</div>
          <div style="font-size:11px;color:#999;margin-top:-2px;">Health Score</div>
        </div>
      </div>
    </div>

    <!-- Key Metrics -->
    <div style="display:flex;gap:12px;margin-bottom:16px;">
      <div style="flex:1;background:white;border-radius:12px;padding:16px;text-align:center;border:1px solid #e5e5e5;">
        <div style="font-size:24px;font-weight:700;color:#111;">${stats.total_checks}</div>
        <div style="font-size:11px;color:#999;">Checks (24h)</div>
      </div>
      <div style="flex:1;background:white;border-radius:12px;padding:16px;text-align:center;border:1px solid #e5e5e5;">
        <div style="font-size:24px;font-weight:700;color:#22c55e;">${successRate}%</div>
        <div style="font-size:11px;color:#999;">Price Success</div>
      </div>
      <div style="flex:1;background:white;border-radius:12px;padding:16px;text-align:center;border:1px solid #e5e5e5;">
        <div style="font-size:24px;font-weight:700;color:${stats.unreachable > 0 ? '#ef4444' : '#22c55e'};">${stats.unreachable}</div>
        <div style="font-size:11px;color:#999;">Unreachable</div>
      </div>
      <div style="flex:1;background:white;border-radius:12px;padding:16px;text-align:center;border:1px solid #e5e5e5;">
        <div style="font-size:24px;font-weight:700;color:#111;">${totalActive}</div>
        <div style="font-size:11px;color:#999;">Active Watches</div>
      </div>
    </div>

    <!-- Platform Stats -->
    <div style="background:white;border-radius:12px;padding:16px 20px;margin-bottom:16px;border:1px solid #e5e5e5;">
      <div style="font-size:13px;font-weight:600;color:#111;margin-bottom:12px;">📊 Platform Overview</div>
      <div style="display:flex;gap:16px;font-size:13px;">
        <div><span style="color:#999;">Users:</span> <strong>${userCount}</strong></div>
        <div><span style="color:#999;">Triggered:</span> <strong>${totalTriggered}</strong></div>
        <div><span style="color:#999;">Needs Attention:</span> <strong style="color:${totalNeedsAttention > 0 ? '#dc2626' : '#22c55e'};">${totalNeedsAttention}</strong></div>
        <div><span style="color:#999;">Conditions Met:</span> <strong>${stats.conditions_met}</strong></div>
      </div>
    </div>

    ${(failingWatches?.length ?? 0) > 0 ? `
    <!-- Failing Watches -->
    <div style="background:white;border-radius:12px;padding:16px 20px;margin-bottom:16px;border:1px solid #e5e5e5;">
      <div style="font-size:13px;font-weight:600;color:#dc2626;margin-bottom:12px;">🚨 Failing Watches (${failingWatches!.length})</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid #eee;">
            <th style="padding:6px 12px;text-align:left;font-size:11px;color:#999;font-weight:600;">Watch</th>
            <th style="padding:6px 12px;text-align:left;font-size:11px;color:#999;font-weight:600;">Domain</th>
            <th style="padding:6px 12px;text-align:center;font-size:11px;color:#999;font-weight:600;">Failures</th>
            <th style="padding:6px 12px;text-align:left;font-size:11px;color:#999;font-weight:600;">Error</th>
          </tr>
        </thead>
        <tbody>${failingWatchesHtml}</tbody>
      </table>
    </div>
    ` : `
    <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;margin-bottom:16px;border:1px solid #bbf7d0;">
      <div style="font-size:13px;font-weight:600;color:#22c55e;">✅ No failing watches — all watches are healthy!</div>
    </div>
    `}

    ${sortedDomains.length > 0 ? `
    <!-- Domain Failures -->
    <div style="background:white;border-radius:12px;padding:16px 20px;margin-bottom:16px;border:1px solid #e5e5e5;">
      <div style="font-size:13px;font-weight:600;color:#111;margin-bottom:12px;">🌐 Failures by Domain (24h)</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid #eee;">
            <th style="padding:6px 12px;text-align:left;font-size:11px;color:#999;font-weight:600;">Domain</th>
            <th style="padding:6px 12px;text-align:center;font-size:11px;color:#999;font-weight:600;">Count</th>
            <th style="padding:6px 12px;text-align:left;font-size:11px;color:#999;font-weight:600;">Types</th>
            <th style="padding:6px 12px;text-align:left;font-size:11px;color:#999;font-weight:600;">Methods</th>
          </tr>
        </thead>
        <tbody>${domainFailuresHtml}</tbody>
      </table>
    </div>
    ` : ""}

    <!-- Footer -->
    <div style="text-align:center;padding:16px;color:#999;font-size:11px;">
      Steward Health Report • Generated ${now.toISOString().substring(0, 19)}Z
      <br>
      <a href="https://supabase.com/dashboard/project/lwtzutbaqcafqkpaaaib" style="color:#2A5C45;">Supabase Dashboard</a>
      &nbsp;•&nbsp;
      <a href="https://vercel.com/steward-ai/steward-app" style="color:#2A5C45;">Vercel Dashboard</a>
    </div>
  </div>
</body>
</html>`;

    // ─── Send via Resend ─────────────────────────────────────────────
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Steward Health <notifications@joinsteward.app>",
        to: ["hello@joinsteward.app"],
        subject: `${statusEmoji} Steward Daily Report — ${healthScore}/100 Health Score — ${dateStr}`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error(`[daily-health-report] Resend error: ${errBody}`);
      return new Response(JSON.stringify({ error: "Failed to send email", details: errBody }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendData = await resendRes.json();
    console.log(`[daily-health-report] Email sent: ${resendData.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        email_id: resendData.id,
        health_score: healthScore,
        total_checks: stats.total_checks,
        failing_watches: failingWatches?.length ?? 0,
        domain_failures: sortedDomains.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error(`[daily-health-report] Error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
