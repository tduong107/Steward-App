import Foundation
import Observation
import Supabase

@Observable
@MainActor
final class RealtimeManager {
    var isConnected = false

    private var watchChannel: RealtimeChannelV2?
    private weak var viewModel: WatchViewModel?
    private var pendingSyncTask: Task<Void, Never>?
    private var listenTask: Task<Void, Never>?
    private var activityListenTask: Task<Void, Never>?
    private var subscribeTask: Task<Void, Never>?

    // MARK: - Start Listening

    func start(for userId: UUID, viewModel: WatchViewModel) {
        self.viewModel = viewModel

        let channel = SupabaseConfig.client.realtimeV2.channel("watches-\(userId.uuidString)")

        // Create async streams BEFORE subscribing (required by Supabase)
        let watchChanges = channel.postgresChange(
            AnyAction.self,
            schema: "public",
            table: "watches",
            filter: .eq("user_id", value: userId.uuidString)
        )

        let activityChanges = channel.postgresChange(
            AnyAction.self,
            schema: "public",
            table: "activities",
            filter: .eq("user_id", value: userId.uuidString)
        )

        // Subscribe to the channel
        subscribeTask = Task {
            do {
                try await channel.subscribeWithError()
                isConnected = true
            } catch {
                #if DEBUG
                print("[Realtime] Subscribe error: \(error)")
                #endif
            }
        }

        // Listen for watch changes — debounced
        listenTask = Task { [weak self] in
            for await _ in watchChanges {
                guard let self else { return }
                guard !Task.isCancelled else { return }
                #if DEBUG
                print("[Realtime] Watch table changed — scheduling sync")
                #endif
                self.scheduleSync()
            }
        }

        // Listen for activity changes — debounced
        activityListenTask = Task { [weak self] in
            for await _ in activityChanges {
                guard let self else { return }
                guard !Task.isCancelled else { return }
                #if DEBUG
                print("[Realtime] Activity table changed — scheduling sync")
                #endif
                self.scheduleSync()
            }
        }

        self.watchChannel = channel
    }

    /// Debounced sync: cancel any pending sync and wait 1 second
    /// so rapid-fire changes are batched into a single sync
    private func scheduleSync() {
        pendingSyncTask?.cancel()
        pendingSyncTask = Task {
            try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
            guard !Task.isCancelled else { return }
            await viewModel?.syncFromCloud()
        }
    }

    // MARK: - Stop Listening

    func stop() {
        // Cancel all running tasks
        listenTask?.cancel()
        listenTask = nil
        activityListenTask?.cancel()
        activityListenTask = nil
        subscribeTask?.cancel()
        subscribeTask = nil
        pendingSyncTask?.cancel()
        pendingSyncTask = nil

        Task {
            if let channel = watchChannel {
                await SupabaseConfig.client.realtimeV2.removeChannel(channel)
            }
        }
        watchChannel = nil
        viewModel = nil
        isConnected = false
    }
}
