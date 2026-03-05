import Foundation
import SwiftUI
import SwiftData
import Observation

enum ActionState {
    case idle
    case running
    case done
}

@Observable
@MainActor
final class WatchViewModel {
    var watches: [Watch] = []
    var activities: [ActivityItem] = []

    // Navigation
    var selectedTab: Tab = .home
    var selectedWatch: Watch?
    var showDetail = false

    // Chat
    var isChatOpen = false

    // Action modal
    var actionModalWatch: Watch?
    var actionState: ActionState = .idle

    // Sync state
    var isSyncing = false
    var syncError: String?

    private var modelContext: ModelContext?
    private var auth: AuthManager?
    private var supabase: SupabaseService?

    enum Tab: String, CaseIterable {
        case home = "Watches"
        case activity = "Activity"
        case settings = "Settings"

        var icon: String {
            switch self {
            case .home: return "square.grid.2x2"
            case .activity: return "bolt"
            case .settings: return "gearshape"
            }
        }
    }

    // MARK: - Setup

    func configure(with context: ModelContext, auth: AuthManager, supabase: SupabaseService) {
        self.modelContext = context
        self.auth = auth
        self.supabase = supabase

        // Load local data immediately for fast UI
        fetchLocalWatches()
        fetchLocalActivities()

        // Then sync from cloud in background
        Task {
            await syncFromCloud()
        }
    }

    // MARK: - Local Fetches (SwiftData cache)

    private func fetchLocalWatches() {
        guard let context = modelContext else { return }
        let descriptor = FetchDescriptor<Watch>(sortBy: [SortDescriptor(\.createdAt, order: .reverse)])
        watches = (try? context.fetch(descriptor)) ?? []
    }

    private func fetchLocalActivities() {
        guard let context = modelContext else { return }
        let descriptor = FetchDescriptor<ActivityItem>(sortBy: [SortDescriptor(\.createdAt, order: .reverse)])
        activities = (try? context.fetch(descriptor)) ?? []
    }

    // MARK: - Cloud Sync

    func syncFromCloud() async {
        guard let context = modelContext, auth?.isAuthenticated == true else { return }
        isSyncing = true
        syncError = nil

        do {
            // Sync watches
            let remoteDTOs = try await supabase?.fetchWatches() ?? []

            let existing = (try? context.fetch(FetchDescriptor<Watch>())) ?? []
            for watch in existing {
                context.delete(watch)
            }
            for dto in remoteDTOs {
                let watch = Watch(from: dto)
                context.insert(watch)
            }

            // Sync activities
            let remoteActivities = try await supabase?.fetchActivities() ?? []
            let existingActivities = (try? context.fetch(FetchDescriptor<ActivityItem>())) ?? []
            for activity in existingActivities {
                context.delete(activity)
            }
            for dto in remoteActivities {
                let activity = ActivityItem(from: dto)
                context.insert(activity)
            }

            try? context.save()
            fetchLocalWatches()
            fetchLocalActivities()
        } catch {
            syncError = error.localizedDescription
            // On failure, keep using local cache
        }

        isSyncing = false
    }

    // MARK: - Watch Management

    var triggeredWatches: [Watch] {
        watches.filter { $0.triggered }
    }

    func addWatch(_ watch: Watch) {
        guard let context = modelContext, let userId = auth?.currentUserId else { return }

        // Insert locally first for instant UI
        context.insert(watch)
        try? context.save()
        withAnimation(.spring(response: 0.4)) {
            fetchLocalWatches()
        }

        // Then push to Supabase
        Task {
            do {
                let dto = watch.toDTO(userId: userId)
                try await supabase?.createWatch(dto)
            } catch {
                syncError = "Failed to sync watch: \(error.localizedDescription)"
            }
        }
    }

    func removeWatch(_ watch: Watch) {
        guard let context = modelContext else { return }
        let watchId = watch.id

        // Delete locally first for instant UI
        context.delete(watch)
        try? context.save()
        withAnimation(.spring(response: 0.3)) {
            fetchLocalWatches()
        }

        // Then delete from Supabase
        Task {
            do {
                try await supabase?.deleteWatch(id: watchId)
            } catch {
                syncError = "Failed to delete from cloud: \(error.localizedDescription)"
            }
        }
    }

    /// Quick-add a watch from a rewatch suggestion (used in ActionModal done state)
    func addQuickWatch(emoji: String, name: String, url: String, condition: String, actionLabel: String, actionType: ActionType) {
        let watch = Watch(
            emoji: emoji,
            name: name,
            url: url,
            condition: condition,
            actionLabel: actionLabel,
            actionType: actionType
        )
        addWatch(watch)

        // Log an activity
        let activity = ActivityItem(
            icon: "sparkles",
            iconColorName: "accent",
            label: "New watch from suggestion",
            subtitle: "\(name) \u{00B7} \(condition)",
            time: "Just now"
        )
        logActivity(activity)

        // Dismiss modal and go home
        dismissAction()
        selectedTab = .home
    }

    func openDetail(for watch: Watch) {
        selectedWatch = watch
        showDetail = true
    }

    // MARK: - Activity Logging

    private func logActivity(_ activity: ActivityItem, watchId: UUID? = nil) {
        guard let context = modelContext else { return }
        context.insert(activity)
        try? context.save()
        fetchLocalActivities()

        // Push to Supabase
        if let userId = auth?.currentUserId {
            Task {
                let dto = activity.toDTO(userId: userId, watchId: watchId)
                try? await supabase?.createActivity(dto)
            }
        }
    }

    // MARK: - Action

    func presentAction(for watch: Watch) {
        actionModalWatch = watch
        actionState = .idle
    }

    func runAction() {
        actionState = .running
        Task {
            try? await Task.sleep(for: .seconds(2.4))
            withAnimation(.spring(response: 0.4)) {
                actionState = .done
            }
            if let watch = actionModalWatch {
                watch.triggered = false
                watch.status = .watching
                try? modelContext?.save()

                let activity = ActivityItem(
                    icon: "checkmark",
                    iconColorName: "accent",
                    label: watch.actionLabel,
                    subtitle: "\(watch.name) \u{00B7} AI acted",
                    time: "Just now"
                )
                logActivity(activity, watchId: watch.id)

                // Update cloud
                if let userId = auth?.currentUserId {
                    let dto = watch.toDTO(userId: userId)
                    try? await supabase?.updateWatch(dto)
                }

                fetchLocalWatches()
            }
        }
    }

    func dismissAction() {
        actionModalWatch = nil
        actionState = .idle
    }
}
