// Supabase Edge Function: share-watch
// Creates a shareable link for a watch. If one already exists, returns the existing code.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { watch_id } = await req.json();

    if (!watch_id) {
      return new Response(JSON.stringify({ error: "watch_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch the watch
    const { data: watch, error: watchError } = await supabase
      .from("watches")
      .select("*")
      .eq("id", watch_id)
      .single();

    if (watchError || !watch) {
      return new Response(
        JSON.stringify({ error: "Watch not found", details: watchError }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if a share already exists for this watch
    const { data: existingShare } = await supabase
      .from("shared_watches")
      .select("share_code")
      .eq("source_watch_id", watch_id)
      .single();

    if (existingShare) {
      return new Response(
        JSON.stringify({ share_code: existingShare.share_code }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate a unique share code (retry on collision)
    let shareCode = "";
    let attempts = 0;
    while (attempts < 5) {
      const candidate = generateShareCode();
      const { data: collision } = await supabase
        .from("shared_watches")
        .select("id")
        .eq("share_code", candidate)
        .single();

      if (!collision) {
        shareCode = candidate;
        break;
      }
      attempts++;
    }

    if (!shareCode) {
      return new Response(
        JSON.stringify({ error: "Failed to generate unique share code" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user display name for "shared by" attribution
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", watch.user_id)
      .single();

    const sharedByName = profile?.display_name || "A friend";

    // Insert the shared watch snapshot
    const { error: insertError } = await supabase
      .from("shared_watches")
      .insert({
        share_code: shareCode,
        emoji: watch.emoji,
        name: watch.name,
        url: watch.url,
        condition: watch.condition,
        action_label: watch.action_label,
        action_type: watch.action_type || "notify",
        check_frequency: watch.check_frequency || "Daily",
        image_url: watch.image_url,
        shared_by_user_id: watch.user_id,
        shared_by_name: sharedByName,
        source_watch_id: watch.id,
      });

    if (insertError) {
      console.error(`[share-watch] Insert failed: ${JSON.stringify(insertError)}`);
      return new Response(
        JSON.stringify({ error: "Failed to create share", details: insertError }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ share_code: shareCode }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error(`[share-watch] Unhandled error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
