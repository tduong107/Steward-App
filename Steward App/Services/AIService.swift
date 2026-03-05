import Foundation

actor AIService {
    static let shared = AIService()

    private let apiKey = Secrets.anthropicAPIKey
    private let endpoint = URL(string: "https://api.anthropic.com/v1/messages")!
    private let model = "claude-haiku-4-5-20251001"

    private let systemPrompt = """
    You are Steward, a friendly and concise AI assistant inside a mobile app that helps users monitor websites. \
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

    WHEN A USER SENDS A SCREENSHOT:
    - Identify what's shown (product name, price, store, URL if visible)
    - Suggest what you could monitor for them (price drop, restock, etc.)
    - Ask for any missing info (like the exact URL if not visible in the screenshot)
    - Be specific about what you see — mention the product name, current price, store name, etc.

    CONVERSATION FLOW:
    1. User describes what they want (or pastes a URL, or sends a screenshot)
    2. You ask clarifying questions if needed (what condition? what action?)
    3. Once you have: URL, condition, and desired action — propose the watch with [PROPOSE_WATCH]
    4. If user confirms, create it with [CREATE_WATCH]

    QUICK REPLIES:
    After EVERY response, include 2-4 short quick-reply options the user can tap. Place them at the very end of your message using this format:
    [SUGGESTIONS]Option A|Option B|Option C[/SUGGESTIONS]

    Examples:
    - After greeting: [SUGGESTIONS]Track a price drop|Watch for a restock|Monitor availability[/SUGGESTIONS]
    - After asking for a URL: [SUGGESTIONS]Paste a link|I'll describe it instead[/SUGGESTIONS]
    - After asking what to watch for: [SUGGESTIONS]Price drops below $X|Back in stock|Any change[/SUGGESTIONS]
    - After analyzing a screenshot: [SUGGESTIONS]Watch for price drop|Alert when restocked|Track any changes[/SUGGESTIONS]
    - Keep each option short (2-6 words max), natural, and relevant to what you just asked

    PROPOSING A WATCH:
    When you have enough info (URL + condition + action) but the user hasn't confirmed yet, propose what you'll set up and include this marker:
    [PROPOSE_WATCH]
    Do NOT include [SUGGESTIONS] when you include [PROPOSE_WATCH] — the app will automatically show confirm/deny buttons.

    CREATING A WATCH:
    After the user confirms (says "yes", "looks good", "do it", "start watching", etc.), include this exact block at the END of your message:
    [CREATE_WATCH]{"emoji":"🛍️","name":"Short Name","url":"https://example.com","condition":"What to watch for","actionLabel":"What AI will do","actionType":"notify"}[/CREATE_WATCH]
    After creating a watch, include [SUGGESTIONS] with follow-up options like: [SUGGESTIONS]Watch something else|Adjust this watch|That's all for now[/SUGGESTIONS]

    Valid actionType values: "cart" (add to cart), "price" (price monitoring), "book" (book a slot), "form" (submit a form), "notify" (just alert the user)

    RULES:
    - Only include [CREATE_WATCH] AFTER the user confirms they want to set it up
    - If the user just asks a question or pastes a URL, propose what you'd do first with [PROPOSE_WATCH]
    - Keep the "name" field short (2-4 words, like "Nike Air Max" or "Tesla Model Y")
    - Pick an appropriate emoji for the watch
    - If a URL doesn't start with http, add https:// to it
    - ALWAYS include either [SUGGESTIONS] or [PROPOSE_WATCH] at the end of every response (never both)
    """

    struct Message {
        let role: String // "user" or "assistant"
        let content: String
        let imageData: Data? // Optional JPEG image data for vision

        init(role: String, content: String, imageData: Data? = nil) {
            self.role = role
            self.content = content
            self.imageData = imageData
        }
    }

    func chat(messages: [Message]) async throws -> String {
        let apiMessages: [[String: Any]] = messages.map { msg in
            if let imageData = msg.imageData {
                // Multi-modal message: image + text
                let base64 = imageData.base64EncodedString()
                var contentBlocks: [[String: Any]] = [
                    [
                        "type": "image",
                        "source": [
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": base64
                        ]
                    ]
                ]
                if !msg.content.isEmpty {
                    contentBlocks.append([
                        "type": "text",
                        "text": msg.content
                    ])
                } else {
                    contentBlocks.append([
                        "type": "text",
                        "text": "What's in this screenshot? Help me set up a watch for it."
                    ])
                }
                return ["role": msg.role, "content": contentBlocks] as [String: Any]
            } else {
                // Text-only message
                return ["role": msg.role, "content": msg.content] as [String: Any]
            }
        }

        let body: [String: Any] = [
            "model": model,
            "max_tokens": 1024,
            "system": systemPrompt,
            "messages": apiMessages
        ]

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        request.timeoutInterval = 60 // Longer timeout for vision requests

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AIError.apiError("No HTTP response received")
        }

        guard httpResponse.statusCode == 200 else {
            let errorText = String(data: data, encoding: .utf8) ?? "Unknown error"
            print("[AIService] HTTP \(httpResponse.statusCode): \(errorText)")
            throw AIError.apiError("HTTP \(httpResponse.statusCode): \(errorText)")
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let content = json?["content"] as? [[String: Any]],
              let firstBlock = content.first,
              let text = firstBlock["text"] as? String else {
            throw AIError.parseError
        }

        return text
    }

    enum AIError: LocalizedError {
        case apiError(String)
        case parseError

        var errorDescription: String? {
            switch self {
            case .apiError(let msg): return "AI service error: \(msg)"
            case .parseError: return "Could not parse AI response"
            }
        }
    }
}
