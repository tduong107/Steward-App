import Foundation
import Observation
import Supabase

@Observable
@MainActor
final class SupabaseService {

    // MARK: - Watches

    func fetchWatches(limit: Int = 200) async throws -> [WatchDTO] {
        try await SupabaseConfig.client
            .from("watches")
            .select()
            .neq("status", value: "deleted")
            .order("created_at", ascending: false)
            .limit(limit)
            .execute()
            .value
    }

    func createWatch(_ dto: WatchDTO) async throws {
        try await SupabaseConfig.client
            .from("watches")
            .insert(dto)
            .execute()
    }

    func updateWatch(_ dto: WatchDTO) async throws {
        try await SupabaseConfig.client
            .from("watches")
            .update(dto)
            .eq("id", value: dto.id.uuidString)
            .execute()
    }

    func deleteWatch(id: UUID) async throws {
        // Delete related records first (check_results, activities, shared_watches)
        _ = try? await SupabaseConfig.client
            .from("check_results")
            .delete()
            .eq("watch_id", value: id.uuidString)
            .execute()

        _ = try? await SupabaseConfig.client
            .from("activities")
            .delete()
            .eq("watch_id", value: id.uuidString)
            .execute()

        _ = try? await SupabaseConfig.client
            .from("shared_watches")
            .delete()
            .eq("source_watch_id", value: id.uuidString)
            .execute()

        // Then delete the watch itself
        try await SupabaseConfig.client
            .from("watches")
            .delete()
            .eq("id", value: id.uuidString)
            .execute()
    }

    // MARK: - Check Results

    func fetchCheckResults(forWatchId watchId: UUID, limit: Int = 20) async throws -> [CheckResultDTO] {
        try await SupabaseConfig.client
            .from("check_results")
            .select()
            .eq("watch_id", value: watchId.uuidString)
            .order("checked_at", ascending: false)
            .limit(limit)
            .execute()
            .value
    }

    // MARK: - Price History

    /// Fetches check results that have a price value, for building price history charts.
    /// Returns results ordered by checked_at ascending (oldest first) for charting.
    func fetchPriceHistory(forWatchId watchId: UUID, days: Int = 90) async throws -> [CheckResultDTO] {
        let calendar = Calendar.current
        let startDate = calendar.date(byAdding: .day, value: -days, to: Date()) ?? Date()
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        let startDateStr = formatter.string(from: startDate)

        return try await SupabaseConfig.client
            .from("check_results")
            .select()
            .eq("watch_id", value: watchId.uuidString)
            .not("price", operator: .is, value: "null")
            .gte("checked_at", value: startDateStr)
            .order("checked_at", ascending: true)
            .execute()
            .value
    }

    /// Fetches aggregate weekly check stats across all of a user's watches.
    /// Returns (totalChecks, triggeredChecks) for the past 7 days.
    /// Uses server-side counting to avoid the default 1,000 row limit and minimize data transfer.
    func fetchWeeklyCheckStats() async throws -> (total: Int, triggered: Int) {
        let calendar = Calendar.current
        let startDate = calendar.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        let startDateStr = formatter.string(from: startDate)

        // Use head: true with count: .exact to get server-side counts without fetching rows.
        // This avoids Supabase's default 1,000 row limit and is much more efficient.
        async let totalResponse = SupabaseConfig.client
            .from("check_results")
            .select("*", head: true, count: .exact)
            .gte("checked_at", value: startDateStr)
            .execute()

        async let triggeredResponse = SupabaseConfig.client
            .from("check_results")
            .select("*", head: true, count: .exact)
            .gte("checked_at", value: startDateStr)
            .eq("changed", value: true)
            .execute()

        let (totalResult, triggeredResult) = try await (totalResponse, triggeredResponse)
        let total = totalResult.count ?? 0
        let triggered = triggeredResult.count ?? 0
        return (total: total, triggered: triggered)
    }

    /// Stores a user-confirmed price as the initial check_result for a price watch
    func createInitialPricePoint(watchId: UUID, price: Double) async throws {
        let now = ISO8601DateFormatter().string(from: Date())
        try await SupabaseConfig.client
            .from("check_results")
            .insert([
                "id": UUID().uuidString,
                "watch_id": watchId.uuidString,
                "result_data": "{\"text\":\"Initial price confirmed by user\"}",
                "changed": "false",
                "price": String(price),
                "checked_at": now
            ])
            .execute()
    }

    // MARK: - Trigger Check

    /// Invokes the check-watch edge function to perform an immediate check for a watch
    func triggerCheck(watchId: UUID) async throws {
        let url = SupabaseConfig.url.appendingPathComponent("functions/v1/check-watch")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(SupabaseConfig.anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")

        // Get the current session token for authenticated invocation
        if let accessToken = try? await SupabaseConfig.client.auth.session.accessToken {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }

        request.httpBody = try JSONEncoder().encode(["watch_id": watchId.uuidString])
        request.timeoutInterval = 30

        let (_, response) = try await URLSession.shared.data(for: request)

        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode != 200 {
            #if DEBUG
            print("[SupabaseService] triggerCheck failed with status \(httpResponse.statusCode)")
            #endif
        }
    }

    /// Calls the `probe-session` edge function to check whether stored cookies
    /// still authenticate the user at the retailer. Never fires a cart-add;
    /// read-only. Returns a `loggedIn` flag and a user-facing detail string.
    ///
    /// See `steward-supabase/supabase/functions/probe-session/index.ts`.
    struct ProbeSessionResult: Decodable {
        let logged_in: Bool
        let detail: String
    }

    func probeSession(watchId: UUID, userId: UUID) async throws -> ProbeSessionResult {
        let url = SupabaseConfig.url.appendingPathComponent("functions/v1/probe-session")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")

        // probe-session is deployed with verify_jwt=true, so we must pass the
        // current user's access token in the Authorization header. Falling
        // back to the anon key would get a 401.
        if let accessToken = try? await SupabaseConfig.client.auth.session.accessToken {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        } else {
            request.setValue("Bearer \(SupabaseConfig.anonKey)", forHTTPHeaderField: "Authorization")
        }

        request.httpBody = try JSONEncoder().encode([
            "watch_id": watchId.uuidString,
            "user_id": userId.uuidString,
        ])
        // Upper bound slightly above the edge fn's 8s retailer timeout.
        request.timeoutInterval = 15

        let (data, response) = try await URLSession.shared.data(for: request)

        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode >= 400 {
            #if DEBUG
            print("[SupabaseService] probeSession HTTP \(httpResponse.statusCode)")
            #endif
        }

        return try JSONDecoder().decode(ProbeSessionResult.self, from: data)
    }

    // MARK: - Activities

    func fetchActivities(limit: Int = 100) async throws -> [ActivityDTO] {
        try await SupabaseConfig.client
            .from("activities")
            .select()
            .order("created_at", ascending: false)
            .limit(limit)
            .execute()
            .value
    }

    func createActivity(_ dto: ActivityDTO) async throws {
        try await SupabaseConfig.client
            .from("activities")
            .insert(dto)
            .execute()
    }

    // MARK: - Profile

    func updateDeviceToken(_ token: String) async throws {
        let userId = try await SupabaseConfig.client.auth.session.user.id
        try await SupabaseConfig.client
            .from("profiles")
            .update(["device_token": token])
            .eq("id", value: userId.uuidString)
            .execute()
    }

    // MARK: - Share Watch

    /// Creates a share link for a watch, returns the share code
    func createShareLink(watchId: UUID) async throws -> String {
        let url = SupabaseConfig.url.appendingPathComponent("functions/v1/share-watch")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")
        request.httpBody = try JSONEncoder().encode(["watch_id": watchId.uuidString])

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            let body = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw NSError(domain: "ShareWatch", code: -1, userInfo: [NSLocalizedDescriptionKey: body])
        }

        struct ShareResponse: Codable {
            let share_code: String
        }

        let result = try JSONDecoder().decode(ShareResponse.self, from: data)
        return result.share_code
    }

    /// Resolves a share code into shared watch data
    func resolveShareCode(_ code: String) async throws -> SharedWatchData {
        let url = SupabaseConfig.url.appendingPathComponent("functions/v1/get-shared-watch")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")
        request.httpBody = try JSONEncoder().encode(["share_code": code])

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            let body = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw NSError(domain: "ShareWatch", code: -1, userInfo: [NSLocalizedDescriptionKey: body])
        }

        return try JSONDecoder().decode(SharedWatchData.self, from: data)
    }
}
