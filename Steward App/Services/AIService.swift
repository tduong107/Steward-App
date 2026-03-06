import Foundation

actor AIService {
    static let shared = AIService()

    /// Edge Function URL — the AI chat proxy that holds the API key server-side
    private let functionURL: URL = {
        let base = SupabaseConfig.url.absoluteString
        return URL(string: "\(base)/functions/v1/ai-chat")!
    }()

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
        // Build messages in Anthropic format (the edge function passes them through)
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

        let body: [String: Any] = ["messages": apiMessages]

        var request = URLRequest(url: functionURL)
        request.httpMethod = "POST"
        // Authenticate with Supabase anon key (deployed with --no-verify-jwt)
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        request.timeoutInterval = 60 // Longer timeout for vision requests

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw AIError.apiError("No HTTP response received")
        }

        guard httpResponse.statusCode == 200 else {
            let errorText = String(data: data, encoding: .utf8) ?? "Unknown error"
            #if DEBUG
            print("[AIService] HTTP \(httpResponse.statusCode): \(errorText)")
            #endif
            throw AIError.apiError("HTTP \(httpResponse.statusCode): \(errorText)")
        }

        // Edge function returns { "text": "..." }
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let text = json?["text"] as? String else {
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
