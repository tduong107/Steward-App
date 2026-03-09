import Foundation

/// Lightweight network client for the Share Extension.
/// Uses URLSession directly (no Supabase SDK dependency) to call AI chat
/// and create watches via the Supabase REST API.
enum ShareAPIService {

    // MARK: - Config

    private static let supabaseURL = "https://lwtzutbaqcafqkpaaaib.supabase.co"
    private static let anonKey = "sb_publishable_p1md1ejTmoPsoJnhrBm9nA_HfVPRd4q"
    private static let sharedDefaults = UserDefaults(suiteName: "group.Steward.Steward-App")

    // MARK: - Auth Helpers

    /// Reads the current access token from shared App Group storage
    static var accessToken: String? {
        sharedDefaults?.string(forKey: "accessToken")
    }

    /// Reads the current user ID from shared App Group storage
    static var userId: String? {
        sharedDefaults?.string(forKey: "userId")
    }

    /// Whether the user is logged in (has stored credentials)
    static var isAuthenticated: Bool {
        accessToken != nil && userId != nil
    }

    // MARK: - AI Chat

    /// Sends a single message to the AI chat edge function and returns the response text
    static func chatWithAI(userMessage: String) async throws -> String {
        let messages: [[String: Any]] = [
            ["role": "user", "content": userMessage]
        ]
        return try await chatWithAI(messages: messages)
    }

    /// Sends a full conversation history to the AI chat edge function and returns the response text
    static func chatWithAI(messages: [[String: Any]]) async throws -> String {
        let url = URL(string: "\(supabaseURL)/functions/v1/ai-chat")!

        let body: [String: Any] = ["messages": messages]

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        // Include access token if available for authenticated rate-limiting
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        // Share extensions have limited execution time — keep timeout tight
        request.timeoutInterval = 15

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            let errorText = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw ShareError.apiError("AI chat failed: \(errorText)")
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let text = json?["text"] as? String else {
            throw ShareError.parseError
        }
        return text
    }

    // MARK: - Create Watch

    /// Inserts a watch into Supabase via the PostgREST API
    static func createWatch(_ watchData: ShareWatchDTO) async throws {
        guard let token = accessToken else {
            throw ShareError.notAuthenticated
        }

        let url = URL(string: "\(supabaseURL)/rest/v1/watches")!

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        request.setValue("return=minimal", forHTTPHeaderField: "Prefer")

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        request.httpBody = try encoder.encode(watchData)
        request.timeoutInterval = 15

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
            let errorText = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw ShareError.apiError("Create watch failed: \(errorText)")
        }
    }

    // MARK: - Trigger First Check

    /// Triggers the check-watch edge function for the newly created watch
    static func triggerCheck(watchId: String) async throws {
        let url = URL(string: "\(supabaseURL)/functions/v1/check-watch")!

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")

        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        } else {
            request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        }

        request.httpBody = try JSONEncoder().encode(["watch_id": watchId])
        request.timeoutInterval = 30

        let (_, _) = try await URLSession.shared.data(for: request)
        // Fire-and-forget — we don't need to wait for the result
    }

    // MARK: - Errors

    enum ShareError: LocalizedError {
        case apiError(String)
        case parseError
        case notAuthenticated

        var errorDescription: String? {
            switch self {
            case .apiError(let msg): return msg
            case .parseError: return "Could not parse response"
            case .notAuthenticated: return "Not signed in. Open Steward to sign in first."
            }
        }
    }
}

// MARK: - Watch DTO (for direct Supabase insert)

/// Minimal DTO matching the Supabase `watches` table schema
struct ShareWatchDTO: Codable {
    let id: String
    let user_id: String
    let emoji: String
    let name: String
    let url: String
    let condition: String
    let action_label: String
    let action_type: String
    let status: String
    let check_frequency: String
    let preferred_check_time: String?
    let notify_channels: String
    let triggered: Bool
    let image_url: String?
    let created_at: String

    // Cookie fields for auth-walled sites
    let site_cookies: String?     // JSON-serialized cookie array
    let cookie_domain: String?    // Domain the cookies belong to
    let cookie_status: String?    // "active" or "expired"

    // Multi-source search watch fields
    let watch_mode: String        // "url" (default) or "search"
    let search_query: String?     // Product search query for search-mode watches
}
