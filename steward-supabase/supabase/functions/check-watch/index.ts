// Supabase Edge Function: check-watch
// Fetches a URL, evaluates the user's condition, stores a check result,
// and updates the watch's triggered status if the condition is met.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
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

    // Create Supabase admin client (uses service role key from env)
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

    // Skip if watch is paused or already triggered
    if (watch.status === "paused" || watch.triggered) {
      return new Response(
        JSON.stringify({ skipped: true, reason: watch.status === "paused" ? "paused" : "already_triggered" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Ensure URL has protocol
    let fetchUrl = watch.url;
    if (!fetchUrl.match(/^https?:\/\//i)) {
      fetchUrl = `https://${fetchUrl}`;
    }

    // Fetch the URL content
    let pageText = "";
    let fetchSuccess = true;
    try {
      const response = await fetch(fetchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; StewardBot/1.0; +https://steward.app)",
        },
        redirect: "follow",
      });
      pageText = await response.text();
    } catch (fetchErr) {
      fetchSuccess = false;
      pageText = `Fetch error: ${fetchErr.message}`;
    }

    // Evaluate the condition against the page content (async for AI-powered evaluation)
    const { changed, resultText } = await evaluateConditionAsync(
      watch.condition,
      pageText,
      fetchSuccess
    );

    // Extract current price from page (for price history tracking)
    const currentPrice = fetchSuccess ? extractPrice(pageText) : null;

    // Store the check result
    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from("check_results").insert({
      id: crypto.randomUUID(),
      watch_id: watch.id,
      result_data: { text: resultText },
      changed: changed,
      price: currentPrice,
      checked_at: now,
    });

    if (insertError) {
      console.error(`[check-watch] check_results insert failed: ${JSON.stringify(insertError)}`);
    }

    // Update the watch with last_checked (always) and trigger fields (if condition met)
    const updateData: Record<string, unknown> = {
      last_checked: now,
    };

    if (changed) {
      updateData.triggered = true;
      updateData.status = "triggered";
      updateData.change_note = resultText;
    }

    const { error: updateError } = await supabase
      .from("watches")
      .update(updateData)
      .eq("id", watch.id);

    if (updateError) {
      console.error(`[check-watch] watches update failed: ${JSON.stringify(updateError)}`);
      return new Response(
        JSON.stringify({
          error: "Failed to update watch",
          details: updateError,
          watch_id: watch.id,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If triggered, invoke the notify-user function
    if (changed) {
      try {
        await supabase.functions.invoke("notify-user", {
          body: { watch_id: watch.id, user_id: watch.user_id },
        });
      } catch {
        // Notification failure shouldn't fail the check
        console.error("[check-watch] Failed to send notification");
      }
    }

    return new Response(
      JSON.stringify({
        watch_id: watch.id,
        changed,
        result_text: resultText,
        price: currentPrice,
        checked_at: now,
        insert_error: insertError ? insertError.message : null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error(`[check-watch] Unhandled error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Condition Evaluation Engine ───────────────────────────────────

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

async function evaluateConditionAsync(
  condition: string,
  pageText: string,
  fetchSuccess: boolean
): Promise<{ changed: boolean; resultText: string }> {
  if (!fetchSuccess) {
    return { changed: false, resultText: "Could not reach page" };
  }

  const condLower = condition.toLowerCase();
  const textLower = pageText.toLowerCase();

  // 1) Price-based conditions: "Price drops below $X", "Price under $X"
  const priceMatch = condLower.match(
    /price\s+(?:drops?\s+)?(?:below|under|less\s+than)\s+\$?([\d,]+\.?\d*)/
  );
  if (priceMatch) {
    const targetPrice = parseFloat(priceMatch[1].replace(/,/g, ""));
    const currentPrice = extractPrice(pageText);
    if (currentPrice !== null) {
      if (currentPrice < targetPrice) {
        return {
          changed: true,
          resultText: `Price dropped to $${currentPrice.toFixed(2)}`,
        };
      }
      return {
        changed: false,
        resultText: `Current price: $${currentPrice.toFixed(2)}`,
      };
    }
    return { changed: false, resultText: "Price not found on page" };
  }

  // 2) Price above: "Price goes above $X", "Price over $X"
  const priceAboveMatch = condLower.match(
    /price\s+(?:goes?\s+)?(?:above|over|more\s+than)\s+\$?([\d,]+\.?\d*)/
  );
  if (priceAboveMatch) {
    const targetPrice = parseFloat(priceAboveMatch[1].replace(/,/g, ""));
    const currentPrice = extractPrice(pageText);
    if (currentPrice !== null) {
      if (currentPrice > targetPrice) {
        return {
          changed: true,
          resultText: `Price rose to $${currentPrice.toFixed(2)}`,
        };
      }
      return {
        changed: false,
        resultText: `Current price: $${currentPrice.toFixed(2)}`,
      };
    }
    return { changed: false, resultText: "Price not found on page" };
  }

  // 3) Stock/availability: "Back in stock", "available", "in stock"
  if (
    condLower.includes("in stock") ||
    condLower.includes("back in stock") ||
    condLower.includes("available")
  ) {
    const inStock =
      textLower.includes("in stock") ||
      textLower.includes("add to cart") ||
      textLower.includes("add to bag") ||
      textLower.includes("buy now") ||
      textLower.includes("available");

    const outOfStock =
      textLower.includes("out of stock") ||
      textLower.includes("sold out") ||
      textLower.includes("unavailable") ||
      textLower.includes("notify me");

    if (inStock && !outOfStock) {
      return { changed: true, resultText: "Item is in stock!" };
    }
    return { changed: false, resultText: "Still out of stock" };
  }

  // 4) Date/availability: "Dates available", "available · DATE"
  if (condLower.includes("dates available") || condLower.includes("date available")) {
    const hasAvailability =
      textLower.includes("available") &&
      !textLower.includes("unavailable") &&
      !textLower.includes("not available") &&
      !textLower.includes("no availability");

    if (hasAvailability) {
      return { changed: true, resultText: "Dates appear available!" };
    }
    return { changed: false, resultText: "Dates not available yet" };
  }

  // 5) Text contains: "Page contains 'XYZ'"
  const containsMatch = condLower.match(
    /(?:page\s+)?contains?\s+['""](.+?)['""]|(?:text\s+)?(?:includes?|mentions?)\s+['""](.+?)['""]/
  );
  if (containsMatch) {
    const searchText = (containsMatch[1] || containsMatch[2]).toLowerCase();
    if (textLower.includes(searchText)) {
      return { changed: true, resultText: `Found "${searchText}" on page` };
    }
    return { changed: false, resultText: `"${searchText}" not found` };
  }

  // 6) AI-powered evaluation for generic/ambiguous conditions
  // Use Claude Haiku to intelligently evaluate whether the condition is met
  if (ANTHROPIC_API_KEY) {
    try {
      const aiResult = await evaluateWithAI(condition, pageText);
      if (aiResult) {
        return aiResult;
      }
    } catch (err) {
      console.error(`[check-watch] AI evaluation failed: ${err.message}`);
      // Fall through to basic keyword check
    }
  }

  // 7) Fallback: Basic keyword check (if AI is unavailable)
  const keywords = condLower
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  if (keywords.length > 0) {
    const matched = keywords.filter((kw) => textLower.includes(kw));
    const ratio = matched.length / keywords.length;
    if (ratio >= 0.6) {
      return {
        changed: true,
        resultText: `Condition "${condition}" appears to be met`,
      };
    }
    return {
      changed: false,
      resultText: `Checked — condition not yet met`,
    };
  }

  return { changed: false, resultText: "Checked — no change" };
}

// ─── AI-Powered Condition Evaluation ──────────────────────────────

async function evaluateWithAI(
  condition: string,
  pageText: string
): Promise<{ changed: boolean; resultText: string } | null> {
  // Truncate page text to avoid token limits (keep first ~4000 chars which usually has the key info)
  const truncatedPage = pageText.length > 4000
    ? pageText.substring(0, 4000) + "\n...[page truncated]"
    : pageText;

  const prompt = `You are evaluating whether a specific condition has been met on a web page.

CONDITION THE USER IS WATCHING FOR:
"${condition}"

PAGE CONTENT (may be truncated):
${truncatedPage}

INSTRUCTIONS:
1. Analyze the page content and determine if the user's condition has been met.
2. Respond with EXACTLY this JSON format, nothing else:
{"changed": true/false, "resultText": "A short, specific description of what you found"}

RULES FOR resultText:
- Be specific and reference actual content from the page (e.g., "Price is now $299.99" not "Price changed")
- Keep it under 60 characters
- If the condition IS met, describe what was found (e.g., "New size M available at $45", "Sale: 30% off now live")
- If the condition is NOT met, briefly state the current status (e.g., "Still showing $349.99", "No restock yet")
- Never say "condition matched" or "keywords matched" — be descriptive about WHAT specifically was found
- Write in a friendly, natural tone

Respond ONLY with the JSON object:`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    console.error(`[check-watch] Anthropic API error: ${response.status}`);
    return null;
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text?.trim();

  if (!text) return null;

  try {
    // Parse the JSON response from the AI
    const parsed = JSON.parse(text);
    if (typeof parsed.changed === "boolean" && typeof parsed.resultText === "string") {
      return {
        changed: parsed.changed,
        resultText: parsed.resultText.substring(0, 80), // Safety limit
      };
    }
  } catch {
    // Try to extract JSON from the response if it has extra text
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (typeof parsed.changed === "boolean" && typeof parsed.resultText === "string") {
          return {
            changed: parsed.changed,
            resultText: parsed.resultText.substring(0, 80),
          };
        }
      } catch {
        // Give up
      }
    }
  }

  return null;
}

function extractPrice(text: string): number | null {
  // Match common price patterns: $1,234.56 or $123 or $12.99
  const pricePattern = /\$\s?([\d,]+\.?\d{0,2})/g;
  const matches = [...text.matchAll(pricePattern)];

  if (matches.length === 0) return null;

  // Return the first (most prominent) price found
  const prices = matches.map((m) =>
    parseFloat(m[1].replace(/,/g, ""))
  );

  // Filter out unreasonable prices (e.g., year numbers like 2024)
  const reasonable = prices.filter((p) => p > 0.01 && p < 1_000_000);
  return reasonable.length > 0 ? reasonable[0] : prices[0];
}
