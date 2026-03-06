import Foundation
import Observation
import Supabase

@Observable
@MainActor
final class SupabaseService {

    // MARK: - Watches

    func fetchWatches() async throws -> [WatchDTO] {
        try await SupabaseConfig.client
            .from("watches")
            .select()
            .order("created_at", ascending: false)
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

    // MARK: - Activities

    func fetchActivities() async throws -> [ActivityDTO] {
        try await SupabaseConfig.client
            .from("activities")
            .select()
            .order("created_at", ascending: false)
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
}
