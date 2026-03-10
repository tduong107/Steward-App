// Supabase Edge Function: notify-user
// Sends notifications when a watch triggers.
// Supports APNs push notifications, email (via Resend), and SMS (via Twilio).
// Uses Apple's HTTP/2 APNs API with token-based (JWT) authentication.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── APNs JWT Generation ──────────────────────────────────────────

let cachedJWT: { token: string; expiresAt: number } | null = null;

async function getAPNsJWT(): Promise<string> {
  // Reuse cached JWT if still valid (tokens last ~1 hour, refresh at 50 min)
  if (cachedJWT && Date.now() < cachedJWT.expiresAt) {
    return cachedJWT.token;
  }

  const keyBase64 = Deno.env.get("APNS_KEY") ?? "";
  const keyId = Deno.env.get("APNS_KEY_ID") ?? "";
  const teamId = Deno.env.get("APNS_TEAM_ID") ?? "";

  if (!keyBase64 || !keyId || !teamId) {
    throw new Error("APNs credentials not configured (APNS_KEY, APNS_KEY_ID, APNS_TEAM_ID)");
  }

  // Decode base64 .p8 key → PEM string
  const keyPem = new TextDecoder().decode(
    Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0))
  );

  const privateKey = await importPKCS8(keyPem, "ES256");

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .sign(privateKey);

  // Cache for 50 minutes (APNs tokens valid for ~1 hour)
  cachedJWT = { token, expiresAt: Date.now() + 50 * 60 * 1000 };
  return token;
}

// ─── Email Sending (Resend) ───────────────────────────────────────

function getEmailButtonLabel(actionType: string): string {
  switch (actionType) {
    case "price": return "Open & Buy Now";
    case "cart": return "Open & Add to Cart";
    case "book": return "Open & Book Now";
    case "form": return "Open & Fill Form";
    default: return "View Details";
  }
}

async function sendEmailNotification(
  email: string,
  watchEmoji: string,
  watchName: string,
  changeNote: string,
  watchId: string,
  actionType: string = "notify",
  actionUrl: string | null = null
): Promise<{ sent: boolean; error?: string }> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Steward <notifications@steward.app>";

  if (!resendKey) {
    console.log("[notify-user] Resend API key not configured — skipping email");
    return { sent: false, error: "Resend not configured" };
  }

  const subject = `${watchEmoji} ${watchName} — Watch Triggered!`;
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">${watchEmoji}</span>
      </div>
      <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 8px; text-align: center;">
        ${watchName}
      </h2>
      <p style="color: #666; font-size: 15px; text-align: center; margin-bottom: 24px;">
        Your watch condition has been met!
      </p>
      <div style="background: #f8f7f5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #333; font-size: 14px; margin: 0;">
          <strong>What changed:</strong><br/>
          ${changeNote}
        </p>
      </div>
      ${actionUrl ? `
      <a href="${actionUrl}" style="display: block; text-align: center; background: #2A5C45; color: white; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 15px; margin-bottom: 24px;">
        ${getEmailButtonLabel(actionType)} &rarr;
      </a>
      ` : ''}
      <p style="color: #999; font-size: 12px; text-align: center;">
        Sent by Steward · You can manage your notification preferences in the app.
      </p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject,
        html: htmlBody,
      }),
    });

    if (response.ok) {
      console.log(`[notify-user] Email sent to ${email}: ${watchEmoji} ${watchName}`);
      return { sent: true };
    } else {
      const errBody = await response.text();
      console.error(`[notify-user] Resend HTTP ${response.status}: ${errBody}`);
      return { sent: false, error: errBody };
    }
  } catch (err) {
    console.error(`[notify-user] Email send error: ${err.message}`);
    return { sent: false, error: err.message };
  }
}

// ─── "Needs Attention" Email (Resend) ─────────────────────────────

async function sendNeedsAttentionEmail(
  email: string,
  watchEmoji: string,
  watchName: string,
  lastError: string,
  failures: number
): Promise<{ sent: boolean; error?: string }> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Steward <notifications@steward.app>";

  if (!resendKey) {
    return { sent: false, error: "Resend not configured" };
  }

  const subject = `⚠️ ${watchName} — Watch Needs Attention`;
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">⚠️</span>
      </div>
      <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 8px; text-align: center;">
        ${watchEmoji} ${watchName}
      </h2>
      <p style="color: #666; font-size: 15px; text-align: center; margin-bottom: 24px;">
        Your watch has failed ${failures} times in a row.
      </p>
      <div style="background: #FEF3C7; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #F59E0B40;">
        <p style="color: #92400E; font-size: 14px; margin: 0;">
          <strong>Error:</strong> ${lastError}
        </p>
        <p style="color: #92400E; font-size: 13px; margin: 8px 0 0 0;">
          The page may have changed or the URL may no longer work. Open the Steward app to review and fix this watch.
        </p>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center;">
        Sent by Steward · You can manage your notification preferences in the app.
      </p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: fromEmail, to: [email], subject, html: htmlBody }),
    });

    if (response.ok) {
      console.log(`[notify-user] Needs-attention email sent to ${email}: ${watchName}`);
      return { sent: true };
    } else {
      const errBody = await response.text();
      console.error(`[notify-user] Resend HTTP ${response.status}: ${errBody}`);
      return { sent: false, error: errBody };
    }
  } catch (err) {
    console.error(`[notify-user] Email send error: ${err.message}`);
    return { sent: false, error: err.message };
  }
}

// ─── SMS Sending (Twilio) ────────────────────────────────────────

async function sendSMSNotification(
  phone: string,
  watchEmoji: string,
  watchName: string,
  changeNote: string,
  actionUrl: string | null
): Promise<{ sent: boolean; error?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER");

  if (!accountSid || !authToken || !fromNumber) {
    console.log("[notify-user] Twilio not configured — skipping SMS");
    return { sent: false, error: "Twilio not configured" };
  }

  // Build concise SMS message (160 char limit for single segment)
  let message = `${watchEmoji} ${watchName}: ${changeNote}`;
  if (actionUrl) {
    message += `\n${actionUrl}`;
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    const body = new URLSearchParams({
      To: phone,
      From: fromNumber,
      Body: message,
    });

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (response.ok) {
      console.log(`[notify-user] SMS sent to ${phone}: ${watchEmoji} ${watchName}`);
      return { sent: true };
    } else {
      const errBody = await response.text();
      console.error(`[notify-user] Twilio HTTP ${response.status}: ${errBody}`);
      return { sent: false, error: errBody };
    }
  } catch (err) {
    console.error(`[notify-user] SMS send error: ${err.message}`);
    return { sent: false, error: err.message };
  }
}

// ─── Main Handler ─────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { watch_id, user_id, action_url, notification_type } = await req.json();
    const notificationType = notification_type ?? "triggered";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the user's device token and phone number
    const { data: profile } = await supabase
      .from("profiles")
      .select("device_token, display_name, phone_number")
      .eq("id", user_id)
      .single();

    // Get the watch details for the notification
    const { data: watch } = await supabase
      .from("watches")
      .select("name, emoji, change_note, notify_channels, action_type, action_url, last_error, consecutive_failures")
      .eq("id", watch_id)
      .single();

    const watchName = watch?.name ?? "Watch";
    const watchEmoji = watch?.emoji ?? "🔔";
    const notifyChannels = (watch?.notify_channels ?? "push").split(",").map((c: string) => c.trim());
    const watchActionType = watch?.action_type ?? "notify";

    // Set content based on notification type
    const isNeedsAttention = notificationType === "needs_attention";
    const changeNote = isNeedsAttention
      ? (watch?.last_error ?? "Watch check is failing repeatedly")
      : (watch?.change_note ?? "Your watch condition was met!");
    const finalActionUrl = isNeedsAttention
      ? null  // No action URL for broken watches
      : (action_url ?? watch?.action_url ?? null);

    // Log an activity (regardless of notification success)
    try {
      await supabase.from("activities").insert({
        id: crypto.randomUUID(),
        user_id: user_id,
        watch_id: watch_id,
        icon: isNeedsAttention ? "exclamationmark.triangle.fill" : "bell.fill",
        icon_color_name: isNeedsAttention ? "gold" : "accent",
        label: isNeedsAttention
          ? `${watchEmoji} ${watchName} needs attention`
          : `${watchEmoji} ${watchName} triggered`,
        subtitle: changeNote,
        created_at: new Date().toISOString(),
      });
    } catch (actErr) {
      console.error(`[notify-user] Activity insert failed: ${actErr.message}`);
    }

    const results: { push?: any; email?: any; sms?: any } = {};

    // ─── Push Notification (APNs) ───────────────────────────────
    if (notifyChannels.includes("push")) {
      if (!profile?.device_token) {
        console.log(`[notify-user] No device token for user ${user_id}`);
        results.push = { sent: false, reason: "No device token" };
      } else {
        const apnsKey = Deno.env.get("APNS_KEY");
        if (!apnsKey) {
          console.log(
            `[notify-user] APNs not configured — would send to ${profile.display_name}: ${watchEmoji} ${watchName} — ${changeNote}`
          );
          results.push = { sent: false, reason: "APNs not configured" };
        } else {
          const apnsEnv = Deno.env.get("APNS_ENVIRONMENT") ?? "development";
          const apnsHost =
            apnsEnv === "production"
              ? "https://api.push.apple.com"
              : "https://api.sandbox.push.apple.com";
          const bundleId = Deno.env.get("APNS_BUNDLE_ID") ?? "";

          const jwt = await getAPNsJWT();

          const payload = isNeedsAttention
            ? {
                aps: {
                  alert: {
                    title: "Watch needs attention",
                    body: `"${watchName}" couldn't check — ${changeNote}. Tap to review.`,
                  },
                  badge: 1,
                  sound: "default",
                },
                watch_id: watch_id,
                notification_type: "needs_attention",
              }
            : {
                aps: {
                  alert: {
                    title: `${watchEmoji} ${watchName}`,
                    body: changeNote,
                  },
                  badge: 1,
                  sound: "default",
                  "mutable-content": 1,
                },
                watch_id: watch_id,
                action_url: finalActionUrl,
              };

          const apnsResponse = await fetch(
            `${apnsHost}/3/device/${profile.device_token}`,
            {
              method: "POST",
              headers: {
                Authorization: `bearer ${jwt}`,
                "apns-topic": bundleId,
                "apns-push-type": "alert",
                "apns-priority": "10",
                "apns-expiration": "0",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            }
          );

          const sent = apnsResponse.status === 200;
          if (!sent) {
            try {
              const errBody = await apnsResponse.text();
              console.error(`[notify-user] APNs HTTP ${apnsResponse.status}: ${errBody}`);
              results.push = { sent: false, apns_status: apnsResponse.status, error: errBody };
            } catch {
              console.error(`[notify-user] APNs HTTP ${apnsResponse.status} (no body)`);
              results.push = { sent: false, apns_status: apnsResponse.status };
            }
          } else {
            console.log(`[notify-user] Push sent to ${profile.display_name}: ${watchEmoji} ${watchName}`);
            results.push = { sent: true, apns_status: 200 };
          }
        }
      }
    }

    // ─── Email Notification (Resend) ────────────────────────────
    if (notifyChannels.includes("email")) {
      // Get user's email from Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(user_id);

      if (authError || !authUser?.email) {
        console.log(`[notify-user] Could not get email for user ${user_id}: ${authError?.message ?? "no email"}`);
        results.email = { sent: false, reason: "No email address found" };
      } else if (isNeedsAttention) {
        // Send a "needs attention" email instead of the triggered email
        results.email = await sendNeedsAttentionEmail(
          authUser.email,
          watchEmoji,
          watchName,
          changeNote,
          watch?.consecutive_failures ?? 3
        );
      } else {
        results.email = await sendEmailNotification(
          authUser.email,
          watchEmoji,
          watchName,
          changeNote,
          watch_id,
          watchActionType,
          finalActionUrl
        );
      }
    }

    // ─── SMS Notification (Twilio) — skip for needs_attention ──
    if (notifyChannels.includes("sms") && !isNeedsAttention) {
      if (!profile?.phone_number) {
        console.log(`[notify-user] No phone number for user ${user_id}`);
        results.sms = { sent: false, reason: "No phone number" };
      } else {
        results.sms = await sendSMSNotification(
          profile.phone_number,
          watchEmoji,
          watchName,
          changeNote,
          finalActionUrl
        );
      }
    }

    const anySent = (results.push?.sent ?? false) || (results.email?.sent ?? false) || (results.sms?.sent ?? false);

    return new Response(
      JSON.stringify({
        sent: anySent,
        channels: notifyChannels,
        push: results.push,
        email: results.email,
        sms: results.sms,
        watch_name: watchName,
        user: profile?.display_name,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error(`[notify-user] Error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
