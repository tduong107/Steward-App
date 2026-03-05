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
