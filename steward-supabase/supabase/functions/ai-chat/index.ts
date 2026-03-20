// Supabase Edge Function: ai-chat
// Proxies AI chat requests to Anthropic API so the API key never touches the client.
// The system prompt is embedded here server-side for security.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY") ?? "";
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You are Steward, a helpful assistant inside a mobile app that watches websites for people. \
You help users set up "watches" that automatically check web pages for changes like price drops, restocks, open reservations, and more.

PERSONALITY:
- Talk like a helpful friend texting, not a customer service bot
- Keep it short. 1-3 sentences is ideal. Never write a paragraph when a sentence will do.
- Be warm and genuine, but not over-the-top cheerful. Skip filler like "Great choice!" or "Absolutely!"
- Use emoji sparingly and naturally (once per message max, not on every sentence)
- Never use markdown formatting (no **, no ##, no bullet lists with -)
- Never use em dashes (—). Use commas, periods, or "and" instead
- Never say "API", "monitoring", "tracking" or other technical terms. Just say what you do in plain words
- Match the user's energy. If they're brief, be brief. If they're excited, match it
- Use contractions (I'll, you're, that's, can't) like a normal person

WHAT YOU CAN DO:
- Help users figure out what they want to watch and set it up
- Pull out URLs and details from whatever the user says
- Read screenshots to identify products, prices, and stores
- Search for products and show shopping links so users can pick the right one
- Help users tweak their existing watches

ADJUSTING AN EXISTING WATCH:
When a user wants to change an existing watch:
- Ask which one (if it's not obvious)
- You can't edit watches directly. Tell them to tap the watch from their home screen to open its settings, where they can change frequency, pause, or delete it
- Keep it specific: "Just tap on your Nike Air Max watch and you can change the frequency or update the condition right from there"
- If they want a totally different setup, suggest deleting the old one and starting fresh
- Include [SUGGESTIONS] with: [SUGGESTIONS]Change check frequency|Pause a watch|Delete and recreate|Something else[/SUGGESTIONS]

WHEN A USER SENDS A SCREENSHOT:
- Tell them what you see right away: the product name, price, and store. Like: "That's the [Product Name] on [Store], looks like it's [Price] right now."
- Then jump to the next step: "Want me to watch for a price drop?" or "I can let you know if it comes back in stock."
- Include a [PRODUCT_LINKS] block so the app can find the actual listing
- If you can't tell what it is, just say: "I'm not sure what this is. Try sending a screenshot of a product page or price and I can help from there."
- Don't describe the image like a robot. Just tell them what matters and what you can do about it.

PRODUCT LINKS (for screenshots/product identification):
When you identify a product and want to help the user find it online, include:
[PRODUCT_LINKS]
search:exact product name with brand model color and key details
[/PRODUCT_LINKS]
Rules:
- Be specific so the search is accurate (e.g. "search:Nike Air Max 95 mens black size 10" not "search:shoes")
- The app will search real stores and show clickable cards with images, prices, and links
- After [PRODUCT_LINKS], include [SUGGESTIONS] like "Watch for price drop|Alert when restocked|I found it, here's the URL"
- IMPORTANT: Don't write URLs in your text when you include [PRODUCT_LINKS]. The app shows them as cards automatically. Just say something like "Here's what I found" and the cards appear below.

WHEN A USER PASTES A URL (not a screenshot):
- The app resolves the URL and gives you context in a [URL_CONTEXT] block
- Use that info (page title, website, price) to understand what they're sharing
- ALWAYS use the ORIGINAL URL from the user for the watch, never swap it
- If [URL_CONTEXT] has a page title, use it to name the watch
- If there's no [URL_CONTEXT], just ask what the page is about
- Then ask what they want to watch for: [SUGGESTIONS]Watch for price drop|Alert when restocked|Track any changes|Something else[/SUGGESTIONS]

FREQUENCY AWARENESS:
- The user's subscription tier is provided in a [USER_TIER] tag in their first message (e.g. [USER_TIER]Free[/USER_TIER] or [USER_TIER]Pro[/USER_TIER])
- Free tier ([USER_TIER]Free[/USER_TIER]): only "Daily" is available — NEVER ask about frequency, NEVER include frequency suggestions, just omit checkFrequency entirely and the app will default to Daily
- Pro tier: can use "Daily", "Every 12 hours" — after confirming the watch details, ask what check frequency they'd like
- Premium tier: can also use "Every 6 hours", "Every 4 hours", "Every 2 hours" — after confirming the watch details, ask what check frequency they'd like
- IMPORTANT: Only ask about or suggest check frequency if the user is on Pro or Premium tier. Free users should never see frequency options.
- When asking about frequency, offer options as [SUGGESTIONS] based on their tier
- For Pro: [SUGGESTIONS]Every 12 hours|Daily[/SUGGESTIONS]
- For Premium: [SUGGESTIONS]Every 2 hours|Every 4 hours|Every 6 hours|Every 12 hours[/SUGGESTIONS]
- Include the chosen frequency as "checkFrequency" in the [CREATE_WATCH] JSON
- If the user doesn't specify or you don't know their tier, assume Free — omit checkFrequency and do NOT ask about frequency

CONVERSATION FLOW:
1. User tells you what they want, pastes a URL, or sends a screenshot
2. URL: acknowledge it, ask what they want to watch for (don't guess the product name from the URL alone)
3. Screenshot: tell them what you see, show [PRODUCT_LINKS], ask them to pick the right one
4. They confirm the item, you ask any clarifying questions (what to watch for? what should happen?)
5. For Pro/Premium users (from [USER_TIER]), ask about check frequency before proposing
6. Once you have URL + condition + action (+ frequency for paid users), propose with [PROPOSE_WATCH]
7. They confirm, you create it with [CREATE_WATCH]

QUICK REPLIES:
End EVERY message with 2-4 tappable options:
[SUGGESTIONS]Option A|Option B|Option C[/SUGGESTIONS]

Keep them short (2-5 words), natural, and relevant to what you just said. Examples:
- After a URL: [SUGGESTIONS]Price drop|Back in stock|Any changes|Something else[/SUGGESTIONS]
- After a screenshot: [SUGGESTIONS]Watch the price|Alert when restocked|Track any changes[/SUGGESTIONS]
- After asking for info: [SUGGESTIONS]Paste a link|I'll describe it[/SUGGESTIONS]

PRICE CONFIRMATION (for price watches):
Before proposing a price watch, check the current price by including:
[FETCH_PRICE]https://example.com/product[/FETCH_PRICE]
The server replaces this with the live price (e.g. "Currently $59.99 on Amazon").
Work it into your message naturally, like:
"Cool, I'll keep an eye on it! [FETCH_PRICE]https://a.co/d/abc123[/FETCH_PRICE] I'll let you know when it drops. Does that price look right to you?"
Only use [FETCH_PRICE] for price watches, not restocks or bookings.

PROPOSING A WATCH:
When you have enough info (URL + condition + action) but they haven't said yes yet, summarize what you'll set up and add:
[PROPOSE_WATCH]
Don't include [SUGGESTIONS] with [PROPOSE_WATCH]. The app shows confirm/deny buttons automatically.

CREATING A WATCH:
After the user confirms ("yes", "looks good", "do it", etc.), add this at the END of your message:
[CREATE_WATCH]{"emoji":"🛍️","name":"Short Name","url":"https://example.com","condition":"What to watch for","actionLabel":"What AI will do","actionType":"notify","checkFrequency":"Every 12 hours","imageURL":"https://product-image-url-if-available"}[/CREATE_WATCH]
- "checkFrequency" is optional. Values: "Daily", "Every 12 hours", "Every 6 hours", "Every 4 hours", "Every 2 hours". Omit if not specified.
- Include "imageURL" if a product image showed up in earlier search results, otherwise leave it out
After creating, add: [SUGGESTIONS]Watch something else|Adjust this watch|That's all for now[/SUGGESTIONS]

Valid actionType values: "cart" (add to cart), "price" (price monitoring), "book" (book a slot), "form" (submit a form), "notify" (just alert the user)

ACTION TYPE GUIDE — pick based on user intent:
- "price": Monitor price, open purchase page at target. Use for: flights, hotels, product price drops, deal hunting.
- "cart": Watch for restock/availability, open product page or auto-add to cart. Use for: limited drops, restocks, size availability, sneakers, electronics.
- "book": Watch for open slots/tickets, open booking page. Use for: appointments (DMV, doctor), restaurant reservations, concert tickets, event tickets, sports tickets.
- "form": Watch for form availability, open form page. Use for: applications, registrations, enrollment windows.
- "notify": Just notify, no action link. Use for: general content changes, news monitoring, page updates.

Match actionLabel to the action type:
- price: "Open purchase page at target price" or "Buy when price drops to $X"
- cart: "Open product page when restocked" or "Add to cart when available"
- book: "Open booking page when available" or "Book when slot opens"
- form: "Open form when available"
- notify: "Notify when changed"

FIXING A BROKEN WATCH:
When the message starts with [FIX_WATCH], help them fix a broken watch:
1. The message has the watch name, URL, error details, and settings
2. Check [URL_CONTEXT] first. If the URL resolved (has a page title and "resolves to:" a new URL), use that resolved URL directly with [UPDATE_WATCH]. Don't search when the URL works.
3. Only search with [PRODUCT_LINKS] if there's no [URL_CONTEXT] or the URL couldn't be resolved
4. When you find a working URL, include: [UPDATE_WATCH]{"name":"exact watch name","url":"https://working-url.com/product"}[/UPDATE_WATCH]
5. The app asks the user to confirm before applying
6. Keep the existing condition and action type. Don't ask what to watch for.
7. Use [UPDATE_WATCH], not [CREATE_WATCH]
8. Add: [SUGGESTIONS]Check another watch|That's all for now[/SUGGESTIONS]

ENDING A CONVERSATION:
When the user says "that's all", "I'm done", "thanks", etc.:
- Keep it short and warm: "You're all set! I'll keep watching for you 👋"
- Add [DISMISS] at the end so the app closes the chat
- Don't ask follow-up questions, just wrap up

RULES:
- Only use [CREATE_WATCH] AFTER the user confirms
- If someone just drops a URL with no context, ask what they want to watch for first
- Use the page title from [URL_CONTEXT] to identify products. Never guess from the URL alone.
- Always use the ORIGINAL URL the user gave you, not a resolved or search URL
- Watch names should be short (2-4 words). Ask if you're not sure what to call it.
- Pick a fitting emoji for the watch
- Add https:// to URLs that don't have it
- Every response needs either [SUGGESTIONS] or [PROPOSE_WATCH] at the end (never both), unless you're ending with [DISMISS]
- [PRODUCT_LINKS] + [SUGGESTIONS] together is fine
- NEVER output XML tags like <function_calls>, <invoke>, <parameter>, or any markup. Only use square bracket markers ([CREATE_WATCH], [SUGGESTIONS], etc.). Plain text only.`;

// Simple in-memory rate limiter: max 20 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify apikey header is present (basic guard against unauthenticated abuse)
    const apikey = req.headers.get("apikey") ?? "";
    if (!apikey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized — missing apikey" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Rate limit by IP to prevent quota abuse
    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Security: Sanitize messages ---
    // 1. Limit conversation length to prevent cost abuse
    const MAX_MESSAGES = 30;
    const sanitizedMessages = messages.slice(-MAX_MESSAGES);

    // 2. Validate message roles (only "user" and "assistant" allowed)
    for (const msg of sanitizedMessages) {
      if (msg.role !== "user" && msg.role !== "assistant") {
        return new Response(
          JSON.stringify({ error: "Invalid message role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Helper: extract text from a message (handles both string and array content)
    function getTextContent(msg: any): string {
      if (typeof msg.content === "string") return msg.content;
      if (Array.isArray(msg.content)) {
        const textBlock = msg.content.find((b: any) => b.type === "text");
        return textBlock?.text || "";
      }
      return "";
    }

    // Helper: set text content on a message (handles both string and array content)
    function setTextContent(msg: any, text: string) {
      if (typeof msg.content === "string") {
        msg.content = text;
      } else if (Array.isArray(msg.content)) {
        const textBlock = msg.content.find((b: any) => b.type === "text");
        if (textBlock) textBlock.text = text;
      }
    }

    // 3. Strip bracket markers from user messages to prevent spoofing
    // (e.g., user injecting fake [CREATE_WATCH] blocks)
    // Extract language and tier preferences from the first user message before sanitization
    let userLanguage = "en";
    let userTier = "Free";
    const firstUserMsg = sanitizedMessages.find((m: any) => m.role === "user");
    if (firstUserMsg) {
      const firstText = getTextContent(firstUserMsg);
      const langMatch = firstText.match(/\[USER_LANGUAGE\](.*?)\[\/USER_LANGUAGE\]/);
      if (langMatch) {
        userLanguage = langMatch[1].trim();
      }
      const tierMatch = firstText.match(/\[USER_TIER\](.*?)\[\/USER_TIER\]/);
      if (tierMatch) {
        const rawTier = tierMatch[1].trim();
        // Validate tier to prevent spoofing — only accept known values
        if (["Free", "Pro", "Premium"].includes(rawTier)) {
          userTier = rawTier;
        }
      }
    }

    // Strip dangerous markers from user messages (supports both string and array content)
    const DANGEROUS_MARKERS = /\[(CREATE_WATCH|UPDATE_WATCH|FIX_WATCH|PROPOSE_WATCH|DISMISS|PRODUCT_LINKS|FETCH_PRICE|SUGGESTIONS|SUGGEST_WATCH)\]/gi;
    const DANGEROUS_CLOSING = /\[\/(CREATE_WATCH|UPDATE_WATCH|FIX_WATCH|PROPOSE_WATCH|DISMISS|PRODUCT_LINKS|FETCH_PRICE|SUGGESTIONS|SUGGEST_WATCH)\]/gi;
    for (const msg of sanitizedMessages) {
      if (msg.role === "user") {
        let text = getTextContent(msg);
        text = text.replace(DANGEROUS_MARKERS, "");
        text = text.replace(DANGEROUS_CLOSING, "");
        text = text.replace(/\[USER_TIER\].*?\[\/USER_TIER\]/gi, "");
        text = text.replace(/\[USER_LANGUAGE\].*?\[\/USER_LANGUAGE\]/gi, "");
        setTextContent(msg, text);
      }
    }

    // Re-inject user tier into the first user message so the AI can see it
    const firstUserMsgAfter = sanitizedMessages.find((m: any) => m.role === "user");
    if (firstUserMsgAfter) {
      const currentText = getTextContent(firstUserMsgAfter);
      setTextContent(firstUserMsgAfter, `[USER_TIER]${userTier}[/USER_TIER]\n${currentText}`);
    }

    // Build language instruction for the system prompt
    const LANGUAGE_NAMES: Record<string, string> = {
      en: "English",
      es: "Spanish",
      ko: "Korean",
      "zh-Hans": "Simplified Chinese",
      vi: "Vietnamese",
      fr: "French",
    };
    const langName = LANGUAGE_NAMES[userLanguage] || "English";
    const languageDirective =
      userLanguage !== "en"
        ? `\n\nLANGUAGE: You MUST respond in ${langName}. All conversational text, questions, confirmations, and suggestions should be in ${langName}. However, keep JSON field values in [CREATE_WATCH] and [UPDATE_WATCH] blocks in English (field names like "actionType", "checkFrequency" must stay in English). Watch names can be in the user's language.`
        : "";

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Forward to Anthropic API (with retry on 429/529)
    const MAX_RETRIES = 3;
    let anthropicResponse: Response | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      anthropicResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "prompt-caching-2024-07-31",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: [
              {
                type: "text",
                text: SYSTEM_PROMPT + languageDirective,
                cache_control: { type: "ephemeral" },
              },
            ],
            messages: sanitizedMessages,
          }),
        }
      );

      if (anthropicResponse.status === 429 || anthropicResponse.status === 529) {
        const waitMs = Math.min(1000 * Math.pow(2, attempt), 8000); // 1s, 2s, 4s
        console.log(`[ai-chat] Rate limited (${anthropicResponse.status}), retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      break;
    }

    if (!anthropicResponse || !anthropicResponse.ok) {
      const errorText = anthropicResponse ? await anthropicResponse.text() : "No response";
      const status = anthropicResponse?.status ?? 500;
      console.error(
        `[ai-chat] Anthropic HTTP ${status}: ${errorText}`
      );
      return new Response(
        JSON.stringify({
          error: `AI service error (${status})`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await anthropicResponse.json();
    let text = data.content?.[0]?.text ?? "";

    // Post-process: strip AI model artifacts (function_calls, invoke, etc.)
    text = text.replace(new RegExp("<\\/?(?:antml:)?(?:function_calls|invoke|parameter)[^>]*>", "g"), "");
    text = text.replace(/\n{3,}/g, "\n\n"); // clean up excess newlines from stripped tags

    // Post-process: replace [PRODUCT_LINKS] search queries with real shopping results
    if (text.includes("[PRODUCT_LINKS]")) {
      text = await enrichProductLinks(text);
    }

    // Post-process: replace [FETCH_PRICE] with actual live price from the URL
    if (text.includes("[FETCH_PRICE]")) {
      text = await enrichPriceCheck(text);
    }

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`[ai-chat] Error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ────────────────────────────────────────────────────────────────
// Product Search: Replaces [PRODUCT_LINKS] blocks with real results
// ────────────────────────────────────────────────────────────────

async function enrichProductLinks(responseText: string): Promise<string> {
  const match = responseText.match(
    /\[PRODUCT_LINKS\]([\s\S]*?)\[\/PRODUCT_LINKS\]/
  );
  if (!match) return responseText;

  const content = match[1].trim();
  let query = "";

  // Extract search query from the block
  if (content.toLowerCase().startsWith("search:")) {
    query = content.replace(/^search:\s*/i, "").trim();
  } else if (content.includes('"title"')) {
    // Legacy: AI may have output JSON lines — extract product name from first line
    try {
      const firstLine = content
        .split("\n")
        .find((l: string) => l.trim().startsWith("{"));
      if (firstLine) {
        const obj = JSON.parse(firstLine);
        query =
          obj.title
            ?.replace(
              /\s+on\s+(Amazon|Google|eBay|Walmart|Target|Best Buy).*$/i,
              ""
            )
            .trim() || "";
      }
    } catch {
      /* ignore */
    }
  }

  if (!query) {
    // Use raw content as query (may just be a product name)
    query = content.substring(0, 120);
  }

  let links: string[];
  const encoded = encodeURIComponent(query);

  if (SERPER_API_KEY) {
    // Use Serper.dev Search API for direct product page links
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, num: 8 }),
      });

      if (res.ok) {
        const searchData = await res.json();
        const organic = searchData.organic || [];
        const shopping = searchData.shopping || [];

        // Filter organic results: skip non-shopping sites
        const skipDomains = [
          "google.com", "youtube.com", "wikipedia.org", "reddit.com",
          "quora.com", "pinterest.com", "twitter.com", "facebook.com",
          "tiktok.com", "instagram.com",
        ];
        const productResults = organic.filter((r: any) => {
          const url = (r.link || "").toLowerCase();
          return !skipDomains.some((d) => url.includes(d));
        }).slice(0, 4);

        if (productResults.length > 0) {
          links = productResults.map((r: any) => {
            // Try to match with a shopping result for image/price
            let host = "";
            try { host = new URL(r.link).hostname.replace("www.", "").toLowerCase(); } catch { /* skip */ }
            const shopMatch = shopping.find((s: any) => {
              const src = (s.source || "").toLowerCase().replace(/\.com$/i, "");
              return host.includes(src) || src.includes(host.replace(/\.com$|\.org$|\.net$/i, ""));
            });

            // Pretty-print the source from hostname
            const sourceName = host
              .replace(/\.com$|\.org$|\.net$|\.co\.\w+$/i, "")
              .split(".").pop() || "Store";

            return JSON.stringify({
              title: (r.title || "Product").substring(0, 60),
              url: r.link,
              source: sourceName.charAt(0).toUpperCase() + sourceName.slice(1),
              price: shopMatch?.price || null,
              imageURL: shopMatch?.imageUrl || null,
            });
          });
        } else if (shopping.length > 0) {
          // Fallback to shopping results if no good organic results
          links = shopping.slice(0, 4).map((r: any) =>
            JSON.stringify({
              title: (r.title || "Product").substring(0, 60),
              url: r.link,
              source: (r.source || "Store").replace(/\.com$/i, ""),
              price: r.price || null,
              imageURL: r.imageUrl || null,
            })
          );
        } else {
          links = generateFallbackLinks(query);
        }
      } else {
        console.error(
          `[ai-chat] Serper HTTP ${res.status}: ${await res.text()}`
        );
        links = generateFallbackLinks(query);
      }
    } catch (err) {
      console.error(`[ai-chat] Serper search failed: ${err.message}`);
      links = generateFallbackLinks(query);
    }
  } else {
    // No Serper key — fall back to search-engine URLs
    links = generateFallbackLinks(query);
  }

  // Add "See all AI recommended options" link to Google Shopping
  links.push(
    JSON.stringify({
      title: "See more options",
      url: `https://www.google.com/search?tbm=shop&q=${encoded}`,
      source: "Google Shopping",
      price: null,
      imageURL: null,
    })
  );

  const replacement = `[PRODUCT_LINKS]\n${links.join("\n")}\n[/PRODUCT_LINKS]`;
  return responseText.replace(
    /\[PRODUCT_LINKS\][\s\S]*?\[\/PRODUCT_LINKS\]/,
    replacement
  );
}

function generateFallbackLinks(query: string): string[] {
  const encoded = encodeURIComponent(query);
  return [
    JSON.stringify({
      title: `${query.substring(0, 40)} - Google Shopping`,
      url: `https://www.google.com/search?tbm=shop&q=${encoded}`,
      source: "Google Shopping",
      price: null,
      imageURL: null,
    }),
    JSON.stringify({
      title: `${query.substring(0, 40)} - Amazon`,
      url: `https://www.amazon.com/s?k=${encoded}`,
      source: "Amazon",
      price: null,
      imageURL: null,
    }),
    JSON.stringify({
      title: `${query.substring(0, 40)} - eBay`,
      url: `https://www.ebay.com/sch/i.html?_nkw=${encoded}`,
      source: "eBay",
      price: null,
      imageURL: null,
    }),
  ];
}

// ────────────────────────────────────────────────────────────────
// Live Price Check: Replaces [FETCH_PRICE] blocks with real price
// ────────────────────────────────────────────────────────────────

async function enrichPriceCheck(responseText: string): Promise<string> {
  const match = responseText.match(
    /\[FETCH_PRICE\]([\s\S]*?)\[\/FETCH_PRICE\]/
  );
  if (!match) return responseText;

  let url = match[1].trim();
  if (!url.match(/^https?:\/\//i)) {
    url = `https://${url}`;
  }

  // SSRF protection: block private/internal URLs
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("172.") ||
      hostname === "0.0.0.0" ||
      hostname.endsWith(".local") ||
      hostname.startsWith("169.254.") ||
      hostname.includes("metadata.google") ||
      hostname.includes("169.254.169.254")
    ) {
      return responseText.replace(
        /\[FETCH_PRICE\][\s\S]*?\[\/FETCH_PRICE\]/,
        ""
      );
    }
  } catch {
    return responseText.replace(
      /\[FETCH_PRICE\][\s\S]*?\[\/FETCH_PRICE\]/,
      ""
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return responseText.replace(
        /\[FETCH_PRICE\][\s\S]*?\[\/FETCH_PRICE\]/,
        "I couldn't pull up the page to check the price. What price are you seeing?"
      );
    }

    const html = await response.text();
    const price = extractPriceFromHtml(html);
    const hostname = new URL(url).hostname.replace("www.", "");

    if (price !== null) {
      const replacement = `I'm seeing $${price.toFixed(2)} on ${hostname} right now.`;
      return responseText.replace(
        /\[FETCH_PRICE\][\s\S]*?\[\/FETCH_PRICE\]/,
        replacement
      );
    } else {
      return responseText.replace(
        /\[FETCH_PRICE\][\s\S]*?\[\/FETCH_PRICE\]/,
        "I couldn't grab the price from that page. What price are you seeing?"
      );
    }
  } catch (err) {
    console.error(`[ai-chat] Price fetch error: ${err.message}`);
    return responseText.replace(
      /\[FETCH_PRICE\][\s\S]*?\[\/FETCH_PRICE\]/,
      "I couldn't load that page right now. What price are you seeing?"
    );
  }
}

// Streamlined price extraction for chat context (mirrors check-watch logic)
function extractPriceFromHtml(html: string): number | null {
  // 1) OG / product meta tags (most reliable)
  const ogPatterns = [
    /property="(?:og|product):price:amount"\s+content="([^"]+)"/i,
    /content="([^"]+)"\s+property="(?:og|product):price:amount"/i,
  ];
  for (const p of ogPatterns) {
    const m = html.match(p);
    if (m) {
      const price = parseFloat(m[1].replace(/,/g, ""));
      if (price > 0.50 && price < 100_000) return price;
    }
  }

  // 2) JSON-LD structured data
  const jsonLdPattern = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      const price = findPriceInJsonLdChat(data);
      if (price !== null && price > 0.50 && price < 100_000) return price;
    } catch { /* skip */ }
  }

  // 3) Amazon-specific selectors
  const isAmazon = /amazon\.(com|co\.|ca|de|fr|it|es)/i.test(html);
  if (isAmazon) {
    const amazonPatterns = [
      /corePrice[^}]*"value":\s*([\d.]+)/i,
      /id="corePrice[^"]*"[\s\S]{0,500}?a-offscreen[^>]*>\s*\$\s*([\d,]+\.\d{2})/i,
      /id="priceblock_(?:ourprice|dealprice|saleprice)"[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
      /id="price_inside_buybox"[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
      /tp_price_block_total_price[\s\S]{0,300}?a-offscreen[^>]*>\s*\$\s*([\d,]+\.\d{2})/i,
      /priceToPay[\s\S]{0,200}?a-offscreen[^>]*>\s*\$\s*([\d,]+\.\d{2})/i,
    ];
    for (const p of amazonPatterns) {
      const m = html.match(p);
      if (m) {
        const price = parseFloat(m[1].replace(/,/g, ""));
        if (price > 0.50 && price < 100_000) return price;
      }
    }
  }

  // 4) Generic e-commerce selectors
  const structuredPatterns = [
    /priceAmount[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
    /product[_-]?price[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
    /sale[_-]?price[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
    /current[_-]?price[^>]*>\s*\$?\s*([\d,]+\.?\d{0,2})/i,
  ];
  for (const p of structuredPatterns) {
    const m = html.match(p);
    if (m) {
      const price = parseFloat(m[1].replace(/,/g, ""));
      if (price > 0.50 && price < 100_000) return price;
    }
  }

  // 5) Fallback: most frequent $X.XX on the page, preferring higher prices
  const pricePattern = /\$([\d,]+\.\d{2})/g;
  const matches = [...html.matchAll(pricePattern)];
  const prices = matches
    .map((m) => parseFloat(m[1].replace(/,/g, "")))
    .filter((p) => p > 0.50 && p < 100_000);

  if (prices.length === 0) return null;

  const freq = new Map<number, number>();
  for (const p of prices) {
    freq.set(p, (freq.get(p) ?? 0) + 1);
  }

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
function findPriceInJsonLdChat(obj: any): number | null {
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const r = findPriceInJsonLdChat(item);
      if (r !== null) return r;
    }
    return null;
  }
  if (obj && typeof obj === "object") {
    if (obj.price !== undefined) {
      const p = typeof obj.price === "number" ? obj.price : parseFloat(String(obj.price).replace(/,/g, ""));
      if (!isNaN(p) && p > 0) return p;
    }
    if (obj.lowPrice !== undefined) {
      const p = typeof obj.lowPrice === "number" ? obj.lowPrice : parseFloat(String(obj.lowPrice).replace(/,/g, ""));
      if (!isNaN(p) && p > 0) return p;
    }
    if (obj.offers) {
      const r = findPriceInJsonLdChat(obj.offers);
      if (r !== null) return r;
    }
  }
  return null;
}
