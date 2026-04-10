import Foundation
import Security

/// Lightweight network client for the Share Extension.
/// Uses URLSession directly (no Supabase SDK dependency) to call AI chat
/// and create watches via the Supabase REST API.
enum ShareAPIService {

    // MARK: - Config

    private static let supabaseURL = "https://lwtzutbaqcafqkpaaaib.supabase.co"
    private static let anonKey = "sb_publishable_p1md1ejTmoPsoJnhrBm9nA_HfVPRd4q"
    private static let sharedDefaults = UserDefaults(suiteName: "group.Steward.Steward-App")

    // Keychain config (must match AuthManager)
    private static let keychainService = "com.steward.shared-auth"
    private static let keychainAccessGroup = "group.Steward.Steward-App"
    private static let keychainAccountKey = "accessToken"

    // MARK: - Auth Helpers

    /// Reads the current access token from shared Keychain (secure)
    static var accessToken: String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccountKey,
            kSecAttrAccessGroup as String: keychainAccessGroup,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
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

    /// Validates watch data before submission
    private static func validateWatchData(_ data: ShareWatchDTO) throws {
        // Validate URL
        guard let watchURL = URL(string: data.url),
              let scheme = watchURL.scheme,
              ["http", "https"].contains(scheme.lowercased()),
              watchURL.host != nil else {
            throw ShareError.apiError("The URL doesn't look valid. Please try sharing from the website again.")
        }
        // Validate name length
        guard !data.name.isEmpty, data.name.count <= 500 else {
            throw ShareError.apiError("Watch name is too long. Please try a shorter name.")
        }
    }

    /// Inserts a watch into Supabase via the PostgREST API
    static func createWatch(_ watchData: ShareWatchDTO) async throws {
        // Validate input before sending
        try validateWatchData(watchData)

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
            // Map technical errors to user-friendly messages
            if errorText.contains("JWT expired") || errorText.contains("PGRST303") {
                throw ShareError.apiError("Your session has expired. Tap Try Again — if that doesn't work, open the Steward app to refresh your login, then come back and share again.")
            }
            throw ShareError.apiError("Something went wrong creating the watch. Tap Try Again, or open the Steward app and try sharing again.\n\nDetails: \(errorText)")
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

    /// Counts the user's existing watches via Supabase
    static func countWatches(userId: String) async throws -> Int {
        var url = URLComponents(string: "\(supabaseURL)/rest/v1/watches")!
        url.queryItems = [
            URLQueryItem(name: "user_id", value: "eq.\(userId)"),
            URLQueryItem(name: "select", value: "id"),
        ]

        var request = URLRequest(url: url.url!)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(accessToken ?? anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue("exact", forHTTPHeaderField: "Prefer")
        request.timeoutInterval = 10

        let (data, response) = try await URLSession.shared.data(for: request)

        // Check Content-Range header for exact count
        if let httpResponse = response as? HTTPURLResponse,
           let contentRange = httpResponse.value(forHTTPHeaderField: "Content-Range"),
           let totalStr = contentRange.split(separator: "/").last,
           let total = Int(totalStr) {
            return total
        }

        // Fallback: count the returned array
        if let items = try? JSONDecoder().decode([[String: String]].self, from: data) {
            return items.count
        }

        return 0
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
    let response_mode: String     // "notify", "quickLink", or "stewardActs"
    let triggered: Bool
    let image_url: String?
    let created_at: String

    // Cookie fields for auth-walled sites
    let site_cookies: String?     // JSON-serialized cookie array
    let cookie_domain: String?    // Domain the cookies belong to
    let cookie_status: String?    // "active" or "expired"

    // Multi-source search watch fields
    let watch_mode: String        // "url", "search", "camping", "ticket", or "travel"
    let search_query: String?     // Product search query for search-mode watches
    let ticket_meta: String?      // JSON string for ticket metadata (tm_event_id, etc.)
    let travel_meta: String?      // JSON string for travel metadata (flight/hotel/car)
    let resy_meta: String?        // JSON string for Resy metadata (venue_id, date, party_size)
    let camping_meta: String?     // JSON string for camping metadata (facility_id, dates)
}
