// Supabase Edge Function: get-shared-watch
// Resolves a share code and returns the watch snapshot data.

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
    const { share_code } = await req.json();

    if (!share_code) {
      return new Response(
        JSON.stringify({ error: "share_code is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Look up the shared watch by code
    const { data: shared, error: lookupError } = await supabase
      .from("shared_watches")
      .select("*")
      .eq("share_code", share_code)
      .single();

    if (lookupError || !shared) {
      return new Response(
        JSON.stringify({ error: "Share not found or invalid code" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check expiration
    if (shared.expires_at && new Date(shared.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This share link has expired" }),
        {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Increment claim count
    await supabase
      .from("shared_watches")
      .update({ claim_count: (shared.claim_count || 0) + 1 })
      .eq("id", shared.id);

    // Return the watch snapshot
    return new Response(
      JSON.stringify({
        share_id: shared.id,
        emoji: shared.emoji,
        name: shared.name,
        url: shared.url,
        condition: shared.condition,
        action_label: shared.action_label,
        action_type: shared.action_type,
        check_frequency: shared.check_frequency,
        image_url: shared.image_url,
        shared_by_name: shared.shared_by_name || "A friend",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error(`[get-shared-watch] Unhandled error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
