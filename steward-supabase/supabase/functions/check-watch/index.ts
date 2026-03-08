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

// ─── Action URL Generation ──────────────────────────────────────────

function generateActionURL(watch: any): string | null {
  if (watch.action_type === "notify") return null;

  const url = watch.url?.startsWith("http") ? watch.url : `https://${watch.url}`;

  // Amazon: generate add-to-cart deep link via ASIN
  if (url.includes("amazon.com")) {
    const asinMatch = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/);
    if (asinMatch) {
      return `https://www.amazon.com/gp/aws/cart/add.html?ASIN.1=${asinMatch[1]}&Quantity.1=1`;
    }
  }

  // Default: use the watched URL itself (product page, booking page, etc.)
  return url;
}

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

    // Build fetch headers (include cookies for auth-walled sites)
    const fetchHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    let cookiesExpired = false;
    if (watch.site_cookies && watch.cookie_status === "active") {
      try {
        const cookies: Array<{
          name: string;
          value: string;
          domain: string;
          expiresDate: number | null;
          isSecure: boolean;
        }> = JSON.parse(watch.site_cookies);

        const now = Date.now() / 1000; // seconds since epoch
        const validCookies = cookies.filter((c) => {
          // Keep cookies without expiry (session cookies) or not yet expired
          return !c.expiresDate || c.expiresDate > now;
        });

        if (validCookies.length === 0 && cookies.length > 0) {
          // All cookies have expired
          cookiesExpired = true;
          console.log(`[check-watch] All cookies expired for ${watch.id}`);
        } else if (validCookies.length > 0) {
          const cookieHeader = validCookies
            .map((c) => `${c.name}=${c.value}`)
            .join("; ");
          fetchHeaders["Cookie"] = cookieHeader;
          console.log(`[check-watch] Using ${validCookies.length} cookies for ${watch.id}`);
        }
      } catch (cookieErr) {
        console.error(`[check-watch] Failed to parse cookies: ${cookieErr.message}`);
      }
    }

    // If all cookies expired, update status and notify user
    if (cookiesExpired) {
      await supabase
        .from("watches")
        .update({ cookie_status: "expired", last_checked: new Date().toISOString() })
        .eq("id", watch.id);

      return new Response(
        JSON.stringify({
          watch_id: watch.id,
          changed: false,
          result_text: "Session expired — please sign in again",
          cookie_status: "expired",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the URL content
    let pageText = "";
    let fetchSuccess = true;
    try {
      const response = await fetch(fetchUrl, {
        headers: fetchHeaders,
        redirect: "follow",
      });
      pageText = await response.text();

      // Detect login page redirect (page requires re-authentication)
      if (watch.site_cookies && watch.cookie_status === "active") {
        const finalUrl = response.url?.toLowerCase() ?? "";
        const textLower = pageText.toLowerCase().substring(0, 5000);
        const isLoginPage =
          finalUrl.includes("/login") ||
          finalUrl.includes("/signin") ||
          finalUrl.includes("/sign-in") ||
          finalUrl.includes("/auth") ||
          (textLower.includes('type="password"') && textLower.includes("sign in"));

        if (isLoginPage) {
          console.log(`[check-watch] Login page detected for ${watch.id}, marking cookies expired`);
          await supabase
            .from("watches")
            .update({ cookie_status: "expired", last_checked: new Date().toISOString() })
            .eq("id", watch.id);

          return new Response(
            JSON.stringify({
              watch_id: watch.id,
              changed: false,
              result_text: "Session expired — please sign in again",
              cookie_status: "expired",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch (fetchErr) {
      fetchSuccess = false;
      pageText = `Fetch error: ${fetchErr.message}`;
    }

    // Extract current price from raw HTML (structured selectors work best on raw HTML)
    const currentPrice = fetchSuccess ? extractPrice(pageText) : null;

    // Strip HTML for condition evaluation (AI and regex work better on plain text)
    const plainText = fetchSuccess ? stripHtml(pageText) : pageText;

    // ─── Content Hash: skip evaluation if page hasn't changed ───
    let contentHash: string | null = null;
    let lastContentHash: string | null = null;
    let lastKnownPrice: number | null = null;

    if (fetchSuccess) {
      contentHash = await computeContentHash(plainText);

      // Fetch last check result for hash comparison and price history
      try {
        const { data: lastCheck } = await supabase
          .from("check_results")
          .select("result_data, price")
          .eq("watch_id", watch.id)
          .order("checked_at", { ascending: false })
          .limit(1)
          .single();

        if (lastCheck) {
          lastContentHash = lastCheck.result_data?.content_hash ?? null;
          if (lastCheck.price != null) {
            lastKnownPrice = parseFloat(lastCheck.price);
            if (isNaN(lastKnownPrice)) lastKnownPrice = null;
          }
        }
      } catch {
        // No previous check — that's fine
      }

      // If page content is identical to last check, skip evaluation entirely
      // (Still record the check for price tracking, but avoid expensive AI calls)
      if (contentHash && lastContentHash && contentHash === lastContentHash) {
        const now = new Date().toISOString();
        console.log(`[check-watch] Content unchanged for ${watch.id}, skipping evaluation`);

        await supabase.from("check_results").insert({
          id: crypto.randomUUID(),
          watch_id: watch.id,
          result_data: { text: "No change detected", content_hash: contentHash },
          changed: false,
          price: currentPrice,
          checked_at: now,
        });

        await supabase.from("watches").update({ last_checked: now }).eq("id", watch.id);

        return new Response(
          JSON.stringify({
            watch_id: watch.id,
            changed: false,
            result_text: "No change detected",
            price: currentPrice,
            checked_at: now,
            skipped_reason: "content_unchanged",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Evaluate the condition against the page content
    const { changed, resultText } = await evaluateConditionAsync(
      watch.condition,
      plainText,
      fetchSuccess,
      lastKnownPrice,
      watch.action_type
    );

    // Store the check result (with content hash for future change detection)
    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from("check_results").insert({
      id: crypto.randomUUID(),
      watch_id: watch.id,
      result_data: { text: resultText, content_hash: contentHash },
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

    let actionUrl: string | null = null;
    if (changed) {
      updateData.triggered = true;
      updateData.status = "triggered";
      updateData.change_note = resultText;

      // Generate action URL for actionable watch types
      actionUrl = generateActionURL(watch);
      if (actionUrl) {
        updateData.action_url = actionUrl;
      }
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
          body: { watch_id: watch.id, user_id: watch.user_id, action_url: actionUrl },
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
  fetchSuccess: boolean,
  lastKnownPrice: number | null = null,
  actionType: string = "notify"
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
      // Sanity check: if we have a previous price, reject implausible drops (>70%)
      if (lastKnownPrice !== null && lastKnownPrice > 0) {
        const dropPct = (lastKnownPrice - currentPrice) / lastKnownPrice;
        if (dropPct > 0.70) {
          console.log(`[check-watch] Suspicious price drop: $${lastKnownPrice.toFixed(2)} → $${currentPrice.toFixed(2)} (${(dropPct * 100).toFixed(0)}% drop). Likely extraction error.`);
          return {
            changed: false,
            resultText: `Current price: $${lastKnownPrice.toFixed(2)} (verifying)`,
          };
        }
      }
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
      // Sanity check: reject implausible jumps (>300% increase)
      if (lastKnownPrice !== null && lastKnownPrice > 0) {
        const jumpPct = (currentPrice - lastKnownPrice) / lastKnownPrice;
        if (jumpPct > 3.0) {
          console.log(`[check-watch] Suspicious price jump: $${lastKnownPrice.toFixed(2)} → $${currentPrice.toFixed(2)} (${(jumpPct * 100).toFixed(0)}% jump). Likely extraction error.`);
          return {
            changed: false,
            resultText: `Current price: $${lastKnownPrice.toFixed(2)} (verifying)`,
          };
        }
      }
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

  // 6) For price/cart type watches that didn't match regex patterns above,
  //    don't fall through to expensive AI — just report price if available
  if (actionType === "price") {
    const price = extractPrice(pageText);
    if (price !== null) {
      return { changed: false, resultText: `Current price: $${price.toFixed(2)}` };
    }
    return { changed: false, resultText: "Price not found on page" };
  }

  // 7) AI-powered evaluation for generic/ambiguous conditions
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

  // 8) Fallback: Basic keyword check (if AI is unavailable)
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

// Static evaluation instructions — cached across all watch checks to save tokens
const EVALUATION_SYSTEM_PROMPT = `You are evaluating whether a specific condition has been met on a web page.
You will receive the user's watch condition and the page content. Determine if the condition is CLEARLY met.

Respond with EXACTLY this JSON format, nothing else:
{"changed": true/false, "resultText": "A short, specific description of what you found"}

CRITICAL RULES:
- Default to changed: false unless you have STRONG evidence the condition is met.
- For price conditions: only use prices that clearly belong to the MAIN product on the page. Ignore prices from related products, accessories, "other sellers", shipping costs, or promotional offers for different items.
- For "price drops to new low" or similar: you CANNOT determine a historical low from a single page visit. Return changed: false with the current price.
- If the page content is garbled, mostly HTML/CSS, or hard to parse, return changed: false.
- Be skeptical — a false positive is worse than a missed detection.

RULES FOR resultText:
- Be specific and reference actual content from the page (e.g., "Price is now $299.99" not "Price changed")
- Keep it under 60 characters
- If the condition IS met, describe what was found (e.g., "New size M available at $45", "Sale: 30% off now live")
- If the condition is NOT met, briefly state the current status (e.g., "Still showing $349.99", "No restock yet")
- Write in a friendly, natural tone

Respond ONLY with the JSON object.`;

async function evaluateWithAI(
  condition: string,
  pageText: string
): Promise<{ changed: boolean; resultText: string } | null> {
  // Aggressively strip HTML to reduce tokens: remove nav, footer, sidebar, ads, etc.
  const cleanedPage = stripHtmlAggressive(pageText);
  // Truncate to ~4000 chars (keep the first part which usually has key product/page info)
  const truncatedPage = cleanedPage.length > 4000
    ? cleanedPage.substring(0, 4000) + "\n...[page truncated]"
    : cleanedPage;

  const userMessage = `CONDITION THE USER IS WATCHING FOR:
"${condition}"

PAGE CONTENT (plain text, may be truncated):
${truncatedPage}`;

  // Retry on 429/529 with exponential backoff
  let response: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        system: [
          {
            type: "text",
            text: EVALUATION_SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (response.status === 429 || response.status === 529) {
      const waitMs = Math.min(1000 * Math.pow(2, attempt), 8000);
      console.log(`[check-watch] Rate limited (${response.status}), retrying in ${waitMs}ms (attempt ${attempt + 1}/3)`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    break;
  }

  if (!response || !response.ok) {
    console.error(`[check-watch] Anthropic API error: ${response?.status ?? "no response"}`);
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

// ─── Content Hash ─────────────────────────────────────────────────

async function computeContentHash(text: string): Promise<string> {
  // Normalize whitespace before hashing to avoid false "changes" from trivial formatting diffs
  const normalized = text.replace(/\s+/g, " ").trim().substring(0, 10000);
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  // Use first 16 hex chars (64 bits) — collision-safe for our purpose
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .substring(0, 16);
}

// ─── HTML Stripping ───────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Aggressive HTML strip for AI: removes nav, footer, sidebar, ads, etc. to minimize tokens */
function stripHtmlAggressive(html: string): string {
  return html
    // Remove entire blocks that are typically non-content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, " ")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, " ")
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, " ")
    // Remove data URIs and long base64 strings
    .replace(/data:[^"'\s]{50,}/g, " ")
    // Remove inline event handlers and long attribute values
    .replace(/\s(?:on\w+|data-[\w-]+)="[^"]*"/gi, " ")
    // Now strip remaining tags
    .replace(/<[^>]+>/g, " ")
    // Decode common entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, " ")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

function extractPrice(text: string): number | null {
  // Strategy: meta tags → JSON-LD → Amazon-specific → structured HTML → context → frequency fallback

  // 0a) og:price:amount or product:price:amount meta tags (most reliable)
  const ogPricePatterns = [
    /property="(?:og|product):price:amount"\s+content="([^"]+)"/i,
    /content="([^"]+)"\s+property="(?:og|product):price:amount"/i,
  ];
  for (const pattern of ogPricePatterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(/,/g, ""));
      if (price > 0.50 && price < 100_000) return price;
    }
  }

  // 0b) JSON-LD structured data: <script type="application/ld+json">
  const jsonLdPattern = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdPattern.exec(text)) !== null) {
    try {
      const jsonData = JSON.parse(jsonLdMatch[1]);
      const price = findPriceInJsonLd(jsonData);
      if (price !== null && price > 0.50 && price < 100_000) return price;
    } catch {
      // Invalid JSON, skip
    }
  }

  // 0c) Amazon-specific: look for the main product price in known Amazon HTML structures
  //     These target the primary buy box price, NOT accessories/related items/warranties
  const isAmazon = /amazon\.(com|co\.|ca|de|fr|it|es)/i.test(text);
  if (isAmazon) {
    const amazonPricePatterns = [
      // "corePrice" data attribute often has the real price
      /corePrice[^}]*"value":\s*([\d.]+)/i,
      // Desktop buy box: <span class="a-price" data-a-color="price">...<span class="a-offscreen">$XX.XX</span>
      /id="corePrice[^"]*"[\s\S]{0,500}?a-offscreen[^>]*>\s*\$\s*([\d,]+\.\d{2})/i,
      // "priceblock_ourprice" or "priceblock_dealprice"
      /id="priceblock_(?:ourprice|dealprice|saleprice)"[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
      // "price_inside_buybox"
      /id="price_inside_buybox"[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
      // "tp_price_block_total_price" — whole price
      /tp_price_block_total_price[\s\S]{0,300}?a-offscreen[^>]*>\s*\$\s*([\d,]+\.\d{2})/i,
      // "priceToPay" specifically in the buy box area
      /priceToPay[\s\S]{0,200}?a-offscreen[^>]*>\s*\$\s*([\d,]+\.\d{2})/i,
      // General Amazon "a-price" with "a-offscreen" for main product (first occurrence is usually the product)
      /a-price[^>]*data-a-color="(?:price|base)"[\s\S]{0,200}?a-offscreen[^>]*>\s*\$\s*([\d,]+\.\d{2})/i,
    ];

    for (const pattern of amazonPricePatterns) {
      const match = text.match(pattern);
      if (match) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (price > 0.50 && price < 100_000) return price;
      }
    }
  }

  // 1) Try structured price selectors common on e-commerce sites
  const structuredPatterns = [
    /priceAmount[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
    /priceToPay[^>]*>.*?\$?\s*([\d,]+\.?\d{0,2})/is,
    /a-price-whole[^>]*>\s*([\d,]+)/i,
    /product[_-]?price[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
    /sale[_-]?price[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
    /current[_-]?price[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
    /price__current[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
  ];

  for (const pattern of structuredPatterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(/,/g, ""));
      if (price > 0.50 && price < 100_000) return price;
    }
  }

  // 2) Look for prices with dollar sign that have surrounding product context
  //    e.g. near "price", "cost", "now", "sale", "buy"
  const contextPattern = /(?:price|cost|now|sale|buy|pay)[^$]{0,40}\$([\d,]+\.\d{2})/gi;
  const contextMatches = [...text.matchAll(contextPattern)];
  if (contextMatches.length > 0) {
    const price = parseFloat(contextMatches[0][1].replace(/,/g, ""));
    if (price > 0.50 && price < 100_000) return price;
  }

  // 3) Fallback: collect all $X.XX prices (require cents for precision)
  //    and return the most frequently occurring one (likely the main product price)
  const pricePattern = /\$([\d,]+\.\d{2})/g;
  const matches = [...text.matchAll(pricePattern)];
  if (matches.length === 0) return null;

  const prices = matches
    .map((m) => parseFloat(m[1].replace(/,/g, "")))
    .filter((p) => p > 0.50 && p < 100_000);

  if (prices.length === 0) return null;

  // Count frequency of each price — the main product price usually appears multiple times
  const freq = new Map<number, number>();
  for (const p of prices) {
    freq.set(p, (freq.get(p) ?? 0) + 1);
  }

  // Return the most frequent price, but if tied, prefer the higher price
  // (accessories/add-ons tend to be cheaper and can pollute results)
  let bestPrice = prices[0];
  let bestCount = 0;
  for (const [price, count] of freq) {
    if (count > bestCount || (count === bestCount && price > bestPrice)) {
      bestCount = count;
      bestPrice = price;
    }
  }

  return bestPrice;
}

// deno-lint-ignore no-explicit-any
function findPriceInJsonLd(obj: any): number | null {
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const result = findPriceInJsonLd(item);
      if (result !== null) return result;
    }
    return null;
  }
  if (obj && typeof obj === "object") {
    // Direct price field
    if (obj.price !== undefined) {
      const p = typeof obj.price === "number" ? obj.price : parseFloat(String(obj.price).replace(/,/g, ""));
      if (!isNaN(p) && p > 0) return p;
    }
    // Check lowPrice
    if (obj.lowPrice !== undefined) {
      const p = typeof obj.lowPrice === "number" ? obj.lowPrice : parseFloat(String(obj.lowPrice).replace(/,/g, ""));
      if (!isNaN(p) && p > 0) return p;
    }
    // Recurse into offers
    if (obj.offers) {
      const result = findPriceInJsonLd(obj.offers);
      if (result !== null) return result;
    }
  }
  return null;
}
