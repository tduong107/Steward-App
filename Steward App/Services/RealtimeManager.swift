import Foundation
import Observation
import Supabase

@Observable
@MainActor
final class RealtimeManager {
    var isConnected = false

    private var watchChannel: RealtimeChannelV2?
    private var viewModel: WatchViewModel?

    // MARK: - Start Listening

    func start(for userId: UUID, viewModel: WatchViewModel) {
        self.viewModel = viewModel

        let channel = SupabaseConfig.client.realtimeV2.channel("watches-\(userId.uuidString)")

        // Create async stream BEFORE subscribing (required by Supabase)
        let changes = channel.postgresChange(
            AnyAction.self,
            schema: "public",
            table: "watches",
            filter: .eq("user_id", value: userId.uuidString)
        )

        // Subscribe to the channel
        Task {
            await channel.subscribe()
            isConnected = true
        }

        // Listen for changes in a separate task
        Task { [weak self] in
            for await _ in changes {
                guard let self else { return }
                #if DEBUG
                print("[Realtime] Watch table changed — syncing from cloud")
                #endif
                await self.viewModel?.syncFromCloud()
            }
        }

        self.watchChannel = channel
    }

    // MARK: - Stop Listening

    func stop() {
        Task {
            if let channel = watchChannel {
                await SupabaseConfig.client.realtimeV2.removeChannel(channel)
            }
        }
        watchChannel = nil
        isConnected = false
    }
}
