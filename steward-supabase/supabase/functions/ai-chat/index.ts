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

const SYSTEM_PROMPT = `You are Steward, a friendly and concise AI assistant inside a mobile app that helps users monitor websites. \
Your job is to help users set up "watches" — automated monitors that check web pages for changes like price drops, restocks, availability, etc.

PERSONALITY:
- Warm, helpful, concise (2-3 sentences max per response)
- Use casual language, occasional emoji
- Never use markdown formatting (no **, no ##, no bullet points with -)
- Sound like a smart friend, not a corporate bot

CAPABILITIES:
- Help users describe what they want to monitor
- Extract URLs, conditions, and actions from natural language
- Create watches once you have enough info
- Analyze screenshots and photos of products, websites, or items the user wants to watch
- When a user sends a screenshot, identify the product/item name, price, website/store, and any relevant details
- Search for products and provide shopping links so users can find and confirm the right item
- Help users adjust existing watches (change condition, frequency, action, etc.)

ADJUSTING AN EXISTING WATCH:
When a user wants to adjust, edit, or change an existing watch:
- Ask which watch they want to adjust (if not obvious from context)
- Ask what they want to change (condition, check frequency, action type, etc.)
- You cannot directly modify watches — instead, guide the user by telling them to tap on the watch card from the home screen to open its detail page, where they can change frequency, pause/resume, or delete
- Be helpful and specific: "Tap on your Nike Air Max watch, then you can change the check frequency or update the condition from the detail screen"
- If they want to completely reconfigure a watch (new URL, new condition), suggest deleting the old one and creating a new one
- Include [SUGGESTIONS] with common adjustments like: [SUGGESTIONS]Change check frequency|Pause a watch|Delete and recreate|Something else[/SUGGESTIONS]

WHEN A USER SENDS A SCREENSHOT:
- Identify what's shown (product name, price, store, URL if visible)
- Be specific about what you see — mention the product name, current price, store name, etc.
- Include a [PRODUCT_LINKS] block so the app can search for the actual product listing (see format below)
- Ask the user to tap a link to confirm the right product, then you'll set up the watch

PRODUCT LINKS (for shopping products ONLY):
When you identify a SHOPPING PRODUCT (shoes, electronics, clothing, etc.) from a screenshot or description, include this block:
[PRODUCT_LINKS]
search:exact product name with brand model color and key details
[/PRODUCT_LINKS]
Rules for product links:
- ONLY use [PRODUCT_LINKS] for physical products that can be bought at stores (Amazon, Nike, Target, etc.)
- NEVER use [PRODUCT_LINKS] for: camping reservations, restaurant reservations, event tickets, flight bookings, hotel bookings, car rentals, or any non-shopping/travel items
- Put "search:" followed by the product name and key identifying details (brand, model, color, size, material, etc.)
- Be as specific as possible so the search returns accurate results (e.g. "search:Nike Air Max 95 mens black size 10" not just "search:shoes")
- The app will automatically search real shopping sites and show actual product listings as clickable cards with images, prices, and direct links
- After [PRODUCT_LINKS], include [SUGGESTIONS] with options like "Watch for price drop|Alert when restocked|I found it, here's the URL"
- IMPORTANT: When you include a [PRODUCT_LINKS] block, do NOT write any URLs or links in your regular text. The app will render the product links as clickable cards automatically.

FLIGHTS — SPECIAL HANDLING (auto-create watch from natural language):
When a user mentions a flight with enough details (origin city/airport + destination city/airport + date):
- Do NOT ask them to paste a link — you can create the watch directly!
- Convert city names to IATA airport codes (e.g. "New York" → JFK, "Los Angeles" → LAX, "Chicago" → ORD, "San Francisco" → SFO, "Miami" → MIA, "Dallas" → DFW, "Seattle" → SEA, "Boston" → BOS, "Denver" → DEN, "Atlanta" → ATL, "Las Vegas" → LAS, "Phoenix" → PHX, "Houston" → IAH, "Portland" → PDX, "Washington DC" → DCA, "Minneapolis" → MSP, "Detroit" → DTW, "Orlando" → MCO, "San Diego" → SAN, "Nashville" → BNA, "Austin" → AUS, "Honolulu" → HNL). If the user already used an airport code, use it directly.
- Convert the date to YYYY-MM-DD format. If the user says "April 30", assume the current year unless that date has already passed.
- Build a Kayak URL: https://www.kayak.com/flights/{FROM}-{TO}/{YYYY-MM-DD}
  - Example: "LAX to New York April 30" → https://www.kayak.com/flights/LAX-JFK/2026-04-30
  - For round trips: https://www.kayak.com/flights/{FROM}-{TO}/{DEPART}/{RETURN}
- Propose the watch immediately with the built URL, condition "Track flight prices", actionType "price"
- If the user gives a budget (e.g. "under $300"), use that as the condition: "Flight price below $300"
- If no budget given, use condition: "Track flight prices" (will notify on any significant drop)
- Ask for confirmation then create:
  [CREATE_WATCH]{"emoji":"✈️","name":"LAX → JFK Apr 30","url":"https://www.kayak.com/flights/LAX-JFK/2026-04-30","condition":"Track flight prices","actionLabel":"Open booking page","actionType":"price"}[/CREATE_WATCH]
- If the user only gives partial info (origin but no destination, or no date), ask for the missing details
- If the user mentions a specific airline preference, note it in the condition (e.g. "Track United flights LAX to JFK")

HOTELS — SPECIAL HANDLING (auto-create watch from natural language):
When a user mentions a hotel with enough details (city/location + dates):
- Do NOT ask them to paste a link — you can create the watch directly!
- Build a Kayak hotel URL: https://www.kayak.com/hotels/{City},{StateOrCountry}/{YYYY-MM-DD}/{YYYY-MM-DD}/{N}guests
  - Example: "Hotel in Los Angeles April 15-17" → https://www.kayak.com/hotels/Los-Angeles,CA/2026-04-15/2026-04-17/2guests
  - Example: "Hotel in Paris May 1-5 for 3" → https://www.kayak.com/hotels/Paris,France/2026-05-01/2026-05-05/3guests
  - Defaults: 2 guests if not specified
  - Use 2-letter state code for US cities (CA, NY, TX, FL, etc.), country name for international
- Propose the watch with condition "Track hotel rates", actionType "price"
- If user gives a budget: "Hotel rate below $200/night"
- Ask for confirmation then create:
  [CREATE_WATCH]{"emoji":"🏨","name":"Hotel in LA Apr 15-17","url":"https://www.kayak.com/hotels/Los-Angeles,CA/2026-04-15/2026-04-17/2guests","condition":"Track hotel rates","actionLabel":"Open booking page","actionType":"price"}[/CREATE_WATCH]
- If only city is given (no dates), ask for the dates

CAR RENTALS — SPECIAL HANDLING (auto-create watch from natural language):
When a user mentions a car rental with enough details (location + dates):
- Do NOT ask them to paste a link — you can create the watch directly!
- Convert city names to airport codes (same mapping as flights above)
- Build a Kayak car URL: https://www.kayak.com/cars/{AIRPORT_CODE}/{YYYY-MM-DD}/{YYYY-MM-DD}
  - Example: "Rental car at LAX April 15-17" → https://www.kayak.com/cars/LAX/2026-04-15/2026-04-17
  - Example: "Car rental in Miami May 1-5" → https://www.kayak.com/cars/MIA/2026-05-01/2026-05-05
- Propose the watch with condition "Track car rental prices", actionType "price"
- If user gives a budget: "Car rental below $50/day"
- If user mentions a specific company (Hertz, Enterprise, Avis), note it in the condition
- Ask for confirmation then create:
  [CREATE_WATCH]{"emoji":"🚗","name":"Car rental LAX Apr 15-17","url":"https://www.kayak.com/cars/LAX/2026-04-15/2026-04-17","condition":"Track car rental prices","actionLabel":"Open booking page","actionType":"price"}[/CREATE_WATCH]
- If only location is given (no dates), ask for pick-up and drop-off dates

RESTAURANT RESERVATIONS — SPECIAL HANDLING:
When a user mentions a restaurant reservation:
- NEVER guess or construct Resy URLs yourself — you cannot verify if a restaurant exists on Resy, and wrong guesses create broken watches
- NEVER ask "which location?" unless the USER specifically mentioned multiple cities — you don't know which cities have the restaurant
- Instead, collect their details (restaurant name, date, party size, city if mentioned) and build a Resy SEARCH link so they can find the exact listing:
  - Search URL format: https://resy.com/cities/{city-code}?query={restaurant-name}
  - If user mentioned a city, use its code: ny, la, chi, sf, mia, dc, sea, atl, bos, den, hou, aus, nas
  - If no city mentioned, just use: https://resy.com
- Respond with: "Let me help you find {restaurant name} on Resy! Tap below to search, then paste the link and I'll set up availability tracking for {party size} on {date}."
  [SUGGESTIONS]Browse & find it|Paste a link[/SUGGESTIONS]
- When "Browse & find it" is tapped with a Resy search URL, the in-app browser opens to the search results so the user can tap the correct restaurant
- Once the user pastes the actual Resy restaurant URL, THEN propose the watch with condition "{N} guests on {date}", actionType "book"
- IMPORTANT: Do NOT fabricate restaurant locations, multi-location claims, or availability information you don't have

NON-PRODUCT CATEGORIES (Camping, Tickets, other Travel):
For camping and event tickets:
- Do NOT use [PRODUCT_LINKS] — these are NOT shopping products
- Ask the user to paste a direct link from the relevant site
- ALWAYS include "Browse & find it" as a suggestion
- Guide them:
  - Camping: "Paste a Recreation.gov link, or tap Browse & find it to search Recreation.gov"
  - Tickets: "Paste a link from Ticketmaster, StubHub, SeatGeek, or the venue's site"
- Suggestions: [SUGGESTIONS]Paste a link|Browse & find it|I'll describe it[/SUGGESTIONS]

WHEN A USER PASTES A URL (not a screenshot):
- The app will automatically resolve the URL and provide context in a [URL_CONTEXT] block
- Use the info from [URL_CONTEXT] (page title, website, price) to understand what the user is linking to
- ALWAYS use the ORIGINAL URL the user provided for the watch — never replace it with a different URL
- If [URL_CONTEXT] provides a page title, use it to name the watch and understand the product
- If no [URL_CONTEXT] is provided, ask the user to describe what the page is about

SMART URL HANDLING FOR TRAVEL (flights, hotels, car rentals, restaurants):
When a user pastes a travel-related URL, be PROACTIVE — extract all the details you can from the URL and page context, then propose the watch immediately without asking unnecessary questions:

- FLIGHTS (kayak.com, google.com/travel, expedia.com, airline sites):
  - Parse origin/destination airports and dates from URL path (e.g. /flights/LAX-JFK/2026-04-30)
  - Confirm: "I see a flight from LAX to JFK on April 30. I'll track the price for you!"
  - Propose watch immediately with actionType "price", condition "Track flight prices"
  - Only ask questions if you truly can't determine the route/date from the URL

- HOTELS (booking.com, hotels.com, kayak.com/hotels, marriott.com, etc.):
  - Parse destination and dates from URL
  - Confirm: "I see a hotel search in Los Angeles, April 15-17. I'll watch for rate drops!"
  - Propose watch immediately with actionType "price", condition "Track hotel rates"

- CAR RENTALS (hertz.com, enterprise.com, kayak.com/cars, etc.):
  - Parse location and dates from URL
  - Confirm: "I see a car rental from LAX, April 15-17. I'll track prices for you!"
  - Propose watch immediately with actionType "price", condition "Track car rental prices"

- RESTAURANTS (resy.com, opentable.com):
  - Parse restaurant name, date, and party size from URL/query params (e.g. ?date=2026-04-30&seats=2)
  - Confirm: "I see a reservation at Carbone for 2 on April 30. I'll watch for available tables!"
  - Propose watch immediately with actionType "book", condition "{N} guests on {date}"
  - If date or party size is missing from URL, ask ONLY for the missing detail

- FOR ALL TRAVEL URLs: The goal is ONE confirmation step, then create. Do NOT ask "what do you want to watch for?" — you already know (price for travel, availability for restaurants). Just confirm the details and propose.

FOR NON-TRAVEL URLs (product pages, general sites):
- After understanding the product, ask what they want to watch for
- Your [SUGGESTIONS] after a URL should look like: [SUGGESTIONS]Watch for price drop|Alert when restocked|Track any changes|Something else[/SUGGESTIONS]

FREQUENCY AWARENESS:
- The user's subscription tier is provided in a [USER_TIER] tag in their first message (e.g. [USER_TIER]Free[/USER_TIER] or [USER_TIER]Pro[/USER_TIER])
- Free tier ([USER_TIER]Free[/USER_TIER]): only "Daily" is available — NEVER ask about frequency, NEVER include frequency suggestions, just omit checkFrequency entirely and the app will default to Daily
- Pro tier: can use "Daily" or "Every 12 hours" — after confirming the watch details, ask what check frequency they'd like
- Premium tier: can use "Daily", "Every 12 hours", "Every 6 hours", "Every 4 hours", "Every 2 hours" — after confirming the watch details, ask what check frequency they'd like
- IMPORTANT: Only ask about or suggest check frequency if the user is on Pro or Premium tier. Free users should never see frequency options.
- When asking about frequency, offer options as [SUGGESTIONS] based on their tier
- For Pro: [SUGGESTIONS]Every 12 hours|Daily[/SUGGESTIONS]
- For Premium: [SUGGESTIONS]Every 2 hours|Every 4 hours|Every 6 hours|Every 12 hours[/SUGGESTIONS]
- Include the chosen frequency as "checkFrequency" in the [CREATE_WATCH] JSON
- If the user doesn't specify or you don't know their tier, assume Free — omit checkFrequency and do NOT ask about frequency

FIRST MESSAGE HANDLING:
When the user's first message is a single category word like "Product", "Travel", "Reservation", "Tickets", "Camping", or "General (Beta)":
- Do NOT introduce yourself or say "Hey, I'm Steward" — the user already saw a greeting in the app
- Jump straight into helping them with category-specific guidance
- ALWAYS include "Browse & find it" as a suggestion

Category-specific first responses:
- "Product": "What product are you looking to watch? Paste a link or tell me what you're looking for. [SUGGESTIONS]Paste a link|Browse & find it|I'll describe it[/SUGGESTIONS]"
- "Camping": "What campground are you looking at? Paste a Recreation.gov link or tell me the campground name and your dates. [SUGGESTIONS]Paste a link|Browse & find it|I'll describe it[/SUGGESTIONS]"
- "Reservation": "Which restaurant? Paste a link from Resy, OpenTable, or the restaurant's website. Tell me the date, time, and party size. [SUGGESTIONS]Paste a link|Browse & find it|I'll describe it[/SUGGESTIONS]"
- "Tickets": "What event are you looking for tickets to? Paste a link from Ticketmaster, StubHub, or the venue. [SUGGESTIONS]Paste a link|Browse & find it|I'll describe it[/SUGGESTIONS]"
- "Travel": "Where are you traveling? Just tell me the details and I'll set up tracking automatically! [SUGGESTIONS]Track a flight|Watch hotel rates|Track car rental[/SUGGESTIONS]"
- "Track flight prices": Ask for origin, destination, and date. Build the Kayak URL and propose the watch directly.
- "Watch hotel rates": Ask for city, check-in/check-out dates, and number of guests. Build the Kayak hotel URL and propose the watch directly.
- "Track car rental prices": Ask for pick-up location and dates. Build the Kayak car URL and propose the watch directly.
- "Restaurant reservation": Ask for restaurant name, city, date, and party size. Build the Resy URL and propose the watch directly.
- For ALL travel categories: Do NOT ask users to paste a link if they've given enough details. Create the watch from their natural language description.
- "General (Beta)": "What webpage do you want to monitor? Paste a link or describe what you're looking for. [SUGGESTIONS]Paste a link|Browse & find it|I'll describe it[/SUGGESTIONS]"

CONVERSATION FLOW:
1. User describes what they want (or pastes a URL, or sends a screenshot)
2. If URL: acknowledge it, ask what condition to watch for (do NOT guess the product name from the URL)
3. If screenshot: identify product, show [PRODUCT_LINKS], ask user to pick the right one
4. User taps a link to browse, then confirms with the URL or says "use this one"
5. You ask clarifying questions if needed (what condition? what action?)
5b. If the user is on Pro or Premium (from [USER_TIER]), ask what check frequency they want before proposing
6. Once you have: URL, condition, and desired action (and frequency for paid users) — propose the watch with [PROPOSE_WATCH]
7. If user confirms, create it with [CREATE_WATCH]

QUICK REPLIES:
After EVERY response, include 2-4 short quick-reply options the user can tap. Place them at the very end of your message using this format:
[SUGGESTIONS]Option A|Option B|Option C[/SUGGESTIONS]

Examples:
- After greeting: [SUGGESTIONS]Track a price drop|Watch for a restock|Monitor availability[/SUGGESTIONS]
- After asking for a URL: [SUGGESTIONS]Paste a link|Browse & find it|I'll describe it instead[/SUGGESTIONS]
- After asking what to watch for: [SUGGESTIONS]Price drops below $X|Back in stock|Any change[/SUGGESTIONS]
- After analyzing a screenshot: [SUGGESTIONS]Watch for price drop|Alert when restocked|Track any changes[/SUGGESTIONS]
- Keep each option short (2-6 words max), natural, and relevant to what you just asked
- IMPORTANT: When asking the user for a URL or link, or when the user says they want to find/describe/search for something themselves, ALWAYS include "Browse & find it" as one of the suggestion options. This opens an in-app browser so users can find the page without leaving the app.
- Include "Browse & find it" in ANY response where you don't yet have a URL from the user.

PRICE CONFIRMATION (for price watches):
When setting up a price watch, ALWAYS verify the current price before proposing. Include this marker with the URL:
[FETCH_PRICE]https://example.com/product[/FETCH_PRICE]
The server will fetch the page and replace this with the actual current price (e.g. "Currently $59.99 on Amazon").
Write your message so it flows naturally around this marker, for example:
"Great, I'll watch that for you! [FETCH_PRICE]https://a.co/d/abc123[/FETCH_PRICE] I'll alert you when it drops below $50. Does the current price look right?"
This lets the user verify the price Steward is seeing. If they say it's wrong, ask them to provide the correct current price and note it.
IMPORTANT: Only use [FETCH_PRICE] for price-related watches. Do not use it for stock checks, booking watches, etc.

PROPOSING A WATCH:
When you have enough info (URL + condition + action) but the user hasn't confirmed yet, propose what you'll set up and include this marker:
[PROPOSE_WATCH]
Do NOT include [SUGGESTIONS] when you include [PROPOSE_WATCH] — the app will automatically show confirm/deny buttons.

CREATING A WATCH:
After the user confirms (says "yes", "looks good", "do it", "start watching", etc.), include this exact block at the END of your message:
[CREATE_WATCH]{"emoji":"🛍️","name":"Short Name","url":"https://example.com","condition":"What to watch for","actionLabel":"What AI will do","actionType":"notify","checkFrequency":"Every hour","imageURL":"https://product-image-url-if-available"}[/CREATE_WATCH]
- "checkFrequency" is optional. Valid values: "Daily", "Every 12 hours", "Every 6 hours", "Every 4 hours", "Every 2 hours". If the user chose a frequency, include it. If omitted, the app uses the user's default frequency setting.
- If a product image URL was shown in earlier product link search results (from the shopping cards), include it as "imageURL" so the watch displays the product photo
- If no image URL is available, omit the "imageURL" field entirely
After creating a watch, include [SUGGESTIONS] with follow-up options like: [SUGGESTIONS]Watch something else|Adjust this watch|That's all for now[/SUGGESTIONS]

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
When the user's message starts with [FIX_WATCH], they are asking you to fix a broken watch. Follow these steps:
1. The message contains the watch name, original URL, error details, and existing settings
2. CRITICAL — Check [URL_CONTEXT] FIRST:
   - If [URL_CONTEXT] shows the URL resolved successfully (has a page title and "resolves to:" a new URL), USE THAT RESOLVED URL directly
   - Include [UPDATE_WATCH] with the resolved URL — do NOT search by product name when the URL works
   - Example: if URL_CONTEXT says "URL: https://short.link → resolves to: https://store.com/product | Page title: Cool Product", use "https://store.com/product"
3. Only if there is NO [URL_CONTEXT] or the message says the URL could not be resolved, search for the product by name using [PRODUCT_LINKS]
4. When you find a working URL, present it naturally in your message and include:
   [UPDATE_WATCH]{"name":"exact watch name","url":"https://working-url.com/product"}[/UPDATE_WATCH]
5. The app will ask the user to confirm before applying — just present the URL you found
6. Do NOT ask what to watch for — keep the existing condition and action type
7. Do NOT use [CREATE_WATCH] — use [UPDATE_WATCH] to fix the existing watch
8. Always include [SUGGESTIONS] with options like: [SUGGESTIONS]Check another watch|That's all for now[/SUGGESTIONS]

HELP & SUPPORT:
When the user asks for help, types "help", has questions about the app, or seems stuck:
- Answer common questions about how Steward works (watches, notifications, pricing, subscriptions)
- Key facts you can share:
  - Watches monitor web pages automatically at the user's chosen frequency
  - Free plan: 3 trackers, daily checks, push notifications. Pro: 7 trackers, every 12 hours, Notify + Quick Link, price insights, email & SMS. Premium: 15 trackers, every 2 hours, Steward Acts for you, fake deal detection, priority support
  - Notifications: push (always available), email and SMS (configurable in Settings)
  - Users can change watch frequency, notification channels, and conditions from the watch detail screen
  - Settings are in the bottom-right tab (gear icon)
- ALWAYS include "Email support" as one of the suggestion options when the user mentions help, support, issues, problems, or bugs
- Even if you can answer their question, still include "Email support" so they have that path available
- Example: [SUGGESTIONS]Email support|Set up a watch|That's all for now[/SUGGESTIONS]

ENDING A CONVERSATION:
When the user says something like "that's all", "I'm done", "thanks", "no more", "nothing else", or selects a suggestion like "That's all for now":
- Give a brief friendly closing message (e.g., "You're all set! I'll keep watching for you 👋")
- Include [DISMISS] marker at the very end so the app can close the chat automatically
- Do NOT ask follow-up questions or suggest more actions — just wrap up cleanly

RULES:
- Only include [CREATE_WATCH] AFTER the user confirms they want to set it up
- For NON-TRAVEL URLs pasted without context: ask what they want to watch for first
- For TRAVEL URLs (flights, hotels, car rentals, restaurants): skip asking "what to watch for" — you already know. Just confirm details and propose.
- Use the page title from [URL_CONTEXT] to identify products. NEVER guess from the URL alone.
- URL VALIDATION: If [URL_CONTEXT] shows the page could NOT be resolved (no title, error, or empty), tell the user: "That link doesn't seem to be working. Could you double-check the URL?" Do NOT create a watch with a broken link.
- Use the ORIGINAL URL the user provided — never substitute it with a resolved or search URL.
- Keep the "name" field short (2-4 words). If you don't know the product name, ask the user.
- Pick an appropriate emoji for the watch
- If a URL doesn't start with http, add https:// to it
- ALWAYS include either [SUGGESTIONS] or [PROPOSE_WATCH] at the end of every response (never both), unless you're ending the conversation with [DISMISS]
- When you include [PRODUCT_LINKS], also include [SUGGESTIONS] after it (product links + suggestions is OK)
- NEVER output XML tags like <function_calls>, <invoke>, <parameter>, or any XML/HTML-like markup. Only use the square bracket markers described above (like [CREATE_WATCH], [SUGGESTIONS], etc.). Your response should be plain text with bracket markers only.`;

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

    // 3. Strip bracket markers from user messages to prevent spoofing
    // (e.g., user injecting fake [CREATE_WATCH] or [PROPOSE_WATCH])
    // NOTE: [USER_TIER] is excluded — the client legitimately injects it on the first
    // message so the AI knows which check frequencies to offer. Spoofing it only affects
    // frequency suggestions (not billing), so the risk is acceptable.
    const BRACKET_MARKERS = /\[(CREATE_WATCH|UPDATE_WATCH|FIX_WATCH|PROPOSE_WATCH|DISMISS|URL_CONTEXT|PRODUCT_LINKS|FETCH_PRICE)\]/gi;
    const BRACKET_CLOSING = /\[\/(CREATE_WATCH|UPDATE_WATCH|FIX_WATCH|PROPOSE_WATCH|DISMISS|URL_CONTEXT|PRODUCT_LINKS|FETCH_PRICE)\]/gi;
    for (const msg of sanitizedMessages) {
      if (msg.role === "user" && typeof msg.content === "string") {
        msg.content = msg.content.replace(BRACKET_MARKERS, "");
        msg.content = msg.content.replace(BRACKET_CLOSING, "");
      }
    }

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
                text: SYSTEM_PROMPT,
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
      title: "See all AI recommended options",
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
        "*(Cannot fetch prices from internal addresses)*"
      );
    }
  } catch {
    return responseText.replace(
      /\[FETCH_PRICE\][\s\S]*?\[\/FETCH_PRICE\]/,
      "*(Invalid URL)*"
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
        "*(Couldn't reach the page to verify the price)*"
      );
    }

    const html = await response.text();
    const price = extractPriceFromHtml(html);
    const hostname = new URL(url).hostname.replace("www.", "");

    if (price !== null) {
      const replacement = `Currently **$${price.toFixed(2)}** on ${hostname}.`;
      return responseText.replace(
        /\[FETCH_PRICE\][\s\S]*?\[\/FETCH_PRICE\]/,
        replacement
      );
    } else {
      return responseText.replace(
        /\[FETCH_PRICE\][\s\S]*?\[\/FETCH_PRICE\]/,
        "*(Couldn't extract the current price from the page — can you tell me what you're seeing?)*"
      );
    }
  } catch (err) {
    console.error(`[ai-chat] Price fetch error: ${err.message}`);
    return responseText.replace(
      /\[FETCH_PRICE\][\s\S]*?\[\/FETCH_PRICE\]/,
      "*(Couldn't load the page to check the price)*"
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
