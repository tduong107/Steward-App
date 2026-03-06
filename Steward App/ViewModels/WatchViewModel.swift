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
    var showPriceInsights = false

    // Chat
    var isChatOpen = false

    // Action modal
    var actionModalWatch: Watch?
    var actionState: ActionState = .idle

    // Sync state
    var isSyncing = false
    var syncError: String?

    // Savings milestones
    var savingsCalculation: SavingsCalculation = .empty
    var isLoadingSavings = false

    private var modelContext: ModelContext?
    private var auth: AuthManager?
    private var supabase: SupabaseService?
    private var subscriptionManager: SubscriptionManager?

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

    func configure(with context: ModelContext, auth: AuthManager, supabase: SupabaseService, subscription: SubscriptionManager? = nil) {
        self.modelContext = context
        self.auth = auth
        self.supabase = supabase
        self.subscriptionManager = subscription

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

        // Load savings data after sync completes
        await loadSavings()
    }

    // MARK: - Savings

    func loadSavings() async {
        guard let supabase else { return }
        isLoadingSavings = true

        // Filter price-related watches
        let priceWatches = watches.filter { watch in
            watch.actionType == .price ||
            watch.condition.lowercased().contains("price") ||
            watch.actionLabel.lowercased().contains("price")
        }

        var priceHistories: [UUID: [PricePoint]] = [:]

        for watch in priceWatches {
            do {
                let results = try await supabase.fetchPriceHistory(forWatchId: watch.id)
                let points = PricePoint.fromCheckResults(results)
                priceHistories[watch.id] = points
            } catch {
                // Skip watches we can't load
            }
        }

        let watchTuples = priceWatches.map { (id: $0.id, name: $0.name, emoji: $0.emoji) }
        savingsCalculation = SavingsCalculator.calculate(
            watches: watchTuples,
            priceHistories: priceHistories
        )

        isLoadingSavings = false
    }

    // MARK: - Watch Management

    var triggeredWatches: [Watch] {
        watches.filter { $0.triggered }
    }

    /// Whether the user can add another watch under their current tier
    var canAddWatch: Bool {
        let maxWatches = subscriptionManager?.currentTier.maxWatches ?? 3
        return watches.count < maxWatches
    }

    func addWatch(_ watch: Watch) {
        guard let context = modelContext, let userId = auth?.currentUserId else { return }

        // Check watch limit — show paywall if over the tier's max
        let maxWatches = subscriptionManager?.currentTier.maxWatches ?? 3
        if !canAddWatch {
            subscriptionManager?.presentPaywall(
                highlighting: .pro,
                reason: "You've reached the \(maxWatches)-watch limit on your Free plan. Upgrade to add more watches."
            )
            return
        }

        // Apply user's default frequency if watch still has the default "Daily"
        // (AI-specified frequencies are already non-"Daily" and won't be overridden)
        if watch.checkFrequency == "Daily" {
            let defaultFreq = UserDefaults.standard.string(forKey: "defaultCheckFrequency") ?? "Daily"
            if let freq = CheckFrequency.from(string: defaultFreq),
               subscriptionManager?.currentTier.includes(freq.requiredTier) == true {
                watch.checkFrequency = defaultFreq
            }
        }

        // Insert locally first for instant UI
        context.insert(watch)
        try? context.save()
        withAnimation(.spring(response: 0.4)) {
            fetchLocalWatches()
        }

        // Fetch product image in background, then push to Supabase
        Task {
            // Try to fetch og:image if no imageURL yet
            if watch.imageURL == nil {
                if let ogImage = await fetchOGImageURL(for: watch.url) {
                    watch.imageURL = ogImage
                    try? context.save()
                    withAnimation(.spring(response: 0.3)) {
                        fetchLocalWatches()
                    }
                }
            }

            do {
                let dto = watch.toDTO(userId: userId)
                try await supabase?.createWatch(dto)
            } catch {
                syncError = "Failed to sync watch: \(error.localizedDescription)"
            }
        }
    }

    // MARK: - OG Image Extraction

    /// Fetches a URL's HTML and extracts the og:image meta tag
    private func fetchOGImageURL(for urlString: String) async -> String? {
        var fullURL = urlString
        if !fullURL.lowercased().hasPrefix("http") {
            fullURL = "https://\(fullURL)"
        }
        guard let url = URL(string: fullURL) else { return nil }

        do {
            var request = URLRequest(url: url)
            request.timeoutInterval = 10
            // Use a browser-like User-Agent so servers return full HTML
            request.setValue("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1", forHTTPHeaderField: "User-Agent")

            let (data, _) = try await URLSession.shared.data(for: request)
            guard let html = String(data: data, encoding: .utf8) else { return nil }

            // Parse og:image from HTML using regex
            // Match: <meta property="og:image" content="...">
            let patterns = [
                "property=\"og:image\"\\s+content=\"([^\"]+)\"",
                "content=\"([^\"]+)\"\\s+property=\"og:image\"",
                "property='og:image'\\s+content='([^']+)'",
                "content='([^']+)'\\s+property='og:image'"
            ]

            for pattern in patterns {
                if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
                   let match = regex.firstMatch(in: html, range: NSRange(html.startIndex..., in: html)),
                   let range = Range(match.range(at: 1), in: html) {
                    let imageURL = String(html[range])
                    // Make relative URLs absolute
                    if imageURL.hasPrefix("//") {
                        return "https:\(imageURL)"
                    } else if imageURL.hasPrefix("/") {
                        return "\(url.scheme ?? "https")://\(url.host ?? "")\(imageURL)"
                    }
                    return imageURL
                }
            }

            return nil
        } catch {
            #if DEBUG
            print("[WatchViewModel] Failed to fetch og:image: \(error)")
            #endif
            return nil
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

    /// Save a watch locally and sync to cloud (used for inline edits like frequency change)
    func saveAndSync(_ watch: Watch) throws {
        try modelContext?.save()
        fetchLocalWatches()

        // Push update to Supabase
        if let userId = auth?.currentUserId {
            Task {
                let dto = watch.toDTO(userId: userId)
                try? await supabase?.updateWatch(dto)
            }
        }
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
            guard let watch = actionModalWatch else {
                actionState = .idle
                return
            }

            // Mark the watch as acted upon locally
            watch.triggered = false
            watch.status = .watching
            try? modelContext?.save()

            // Sync the change to Supabase
            if let userId = auth?.currentUserId {
                let dto = watch.toDTO(userId: userId)
                try? await supabase?.updateWatch(dto)
            }

            withAnimation(.spring(response: 0.4)) {
                actionState = .done
            }

            let activity = ActivityItem(
                icon: "checkmark",
                iconColorName: "accent",
                label: watch.actionLabel,
                subtitle: "\(watch.name) \u{00B7} Action completed",
                time: "Just now"
            )
            logActivity(activity, watchId: watch.id)

            fetchLocalWatches()
        }
    }

    func dismissAction() {
        actionModalWatch = nil
        actionState = .idle
    }
}
