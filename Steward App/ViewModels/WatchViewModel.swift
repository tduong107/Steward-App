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
    var pendingChatURL: String?  // URL shared via Share Extension
    var pendingFixContext: String?  // Context for "Ask AI to fix" broken watch

    // Action modal
    var actionModalWatch: Watch?
    var actionState: ActionState = .idle

    // Sync state
    var isSyncing = false
    var syncError: String?

    // Savings milestones
    var savingsCalculation: SavingsCalculation = .empty
    var isLoadingSavings = false
    var allPriceHistories: [UUID: [PricePoint]] = [:]

    // Cached filtered collections (updated in fetchLocalWatches to avoid recomputing in every SwiftUI body)
    var triggeredWatches: [Watch] = []

    private var modelContext: ModelContext?
    private var auth: AuthManager?
    private var supabase: SupabaseService?
    private var subscriptionManager: SubscriptionManager?
    private var hasConfigured = false
    private var lastSyncTime: Date?

    // Task handles for cancellation
    private var backgroundTasks: [Task<Void, Never>] = []

    enum Tab: String, CaseIterable {
        case home = "Watches"
        case savings = "Savings"
        case activity = "Activity"
        case settings = "Settings"

        var icon: String {
            switch self {
            case .home: return "square.grid.2x2"
            case .savings: return "chart.line.uptrend.xyaxis"
            case .activity: return "bolt"
            case .settings: return "gearshape"
            }
        }
    }

    // MARK: - Setup

    func configure(with context: ModelContext, auth: AuthManager, supabase: SupabaseService, subscription: SubscriptionManager? = nil) {
        guard !hasConfigured else { return }
        hasConfigured = true

        self.modelContext = context
        self.auth = auth
        self.supabase = supabase
        self.subscriptionManager = subscription

        // Load local data immediately for fast UI
        fetchLocalWatches()
        purgeOrphanedActivities()
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
        triggeredWatches = watches.filter { $0.triggered }
    }

    private func fetchLocalActivities() {
        guard let context = modelContext else { return }
        let descriptor = FetchDescriptor<ActivityItem>(sortBy: [SortDescriptor(\.createdAt, order: .reverse)])
        activities = (try? context.fetch(descriptor)) ?? []
    }

    /// Permanently deletes local activities whose watch no longer exists or whose watchId is nil (legacy orphans)
    private func purgeOrphanedActivities() {
        guard let context = modelContext else { return }
        let currentWatchIds = Set(watches.map(\.id))
        let allActivities = (try? context.fetch(FetchDescriptor<ActivityItem>())) ?? []
        var deleted = 0
        for activity in allActivities {
            if activity.watchId == nil || !currentWatchIds.contains(activity.watchId!) {
                context.delete(activity)
                deleted += 1
            }
        }
        if deleted > 0 {
            try? context.save()
            #if DEBUG
            print("[WatchViewModel] Purged \(deleted) orphaned activities")
            #endif
        }
    }

    // MARK: - Cloud Sync

    func syncFromCloud(force: Bool = false) async {
        guard let context = modelContext, auth?.isAuthenticated == true else { return }

        // Throttle: don't re-sync if we synced within the last 3 seconds (unless forced)
        if !force, let lastSync = lastSyncTime, Date().timeIntervalSince(lastSync) < 3 {
            return
        }

        // Prevent concurrent syncs
        guard !isSyncing else { return }
        isSyncing = true
        syncError = nil

        do {
            // Fetch remote data (async — frees main thread while waiting)
            let remoteDTOs = try await supabase?.fetchWatches() ?? []
            let remoteActivities = try await supabase?.fetchActivities() ?? []

            // Merge watches: update existing, insert new, delete removed
            // (preserves SwiftData object identity so live references in DetailScreen stay valid)
            let existingWatches = (try? context.fetch(FetchDescriptor<Watch>())) ?? []
            let existingById = Dictionary(uniqueKeysWithValues: existingWatches.map { ($0.id, $0) })
            let remoteIds = Set(remoteDTOs.map(\.id))

            for dto in remoteDTOs {
                if let existing = existingById[dto.id] {
                    // Update in-place — preserves object identity
                    existing.emoji = dto.emoji
                    existing.name = dto.name
                    existing.url = dto.url
                    existing.condition = dto.condition
                    existing.actionLabel = dto.actionLabel
                    existing.actionTypeRaw = dto.actionType
                    existing.statusRaw = dto.status
                    existing.triggered = dto.triggered
                    existing.changeNote = dto.changeNote
                    existing.checkFrequency = dto.checkFrequency
                    existing.preferredCheckTime = dto.preferredCheckTime
                    existing.notifyChannels = dto.notifyChannels ?? "push"
                    existing.imageURL = dto.imageURL
                    existing.actionURL = dto.actionURL
                    existing.lastCheckedAt = dto.lastChecked
                    existing.lastSeen = dto.lastChecked?.formatted(.relative(presentation: .named)) ?? "Not yet"
                    existing.watchMode = dto.watchMode
                    existing.searchQuery = dto.searchQuery
                    existing.consecutiveFailures = dto.consecutiveFailures
                    existing.lastError = dto.lastError
                    existing.needsAttention = dto.needsAttention
                } else {
                    // New remote watch — insert
                    context.insert(Watch(from: dto))
                }
            }
            // Delete local watches that no longer exist on remote
            for watch in existingWatches where !remoteIds.contains(watch.id) {
                context.delete(watch)
            }

            // Build a lookup of remote activities by ID for quick access
            let remoteActivityById = Dictionary(uniqueKeysWithValues: remoteActivities.map { ($0.id, $0) })
            let existingActivities = (try? context.fetch(FetchDescriptor<ActivityItem>())) ?? []
            let existingActivityIds = Set(existingActivities.map(\.id))
            let remoteActivityIds = Set(remoteActivities.map(\.id))

            for activity in existingActivities {
                if !remoteActivityIds.contains(activity.id) {
                    // Deleted on remote — remove locally
                    context.delete(activity)
                } else if let dto = remoteActivityById[activity.id] {
                    // Backfill watchId from server (for activities created before watchId was tracked)
                    if activity.watchId == nil, let remoteWatchId = dto.watchId {
                        activity.watchId = remoteWatchId
                    }
                    // Delete if the activity's watch no longer exists
                    if let wid = activity.watchId, !remoteIds.contains(wid) {
                        context.delete(activity)
                    }
                }
            }
            // Insert new activities — only if their watch still exists
            for dto in remoteActivities where !existingActivityIds.contains(dto.id) {
                guard let wid = dto.watchId, remoteIds.contains(wid) else {
                    continue // skip orphaned or unlinked activities from server
                }
                context.insert(ActivityItem(from: dto))
            }

            try? context.save()

            // Single UI update after all data is ready
            fetchLocalWatches()
            purgeOrphanedActivities()
            fetchLocalActivities()
        } catch {
            syncError = error.localizedDescription
        }

        lastSyncTime = Date()
        isSyncing = false

        // Load savings data after sync completes
        await loadSavings()

        // Backfill product images for watches missing them
        backfillMissingImages()

        // Resolve placeholder watch names (created via Share Extension with just a domain)
        await resolveWatchNames()
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

        // Fetch all price histories concurrently instead of sequentially
        let watchIds = priceWatches.map { $0.id }
        var priceHistories: [UUID: [PricePoint]] = [:]

        await withTaskGroup(of: (UUID, [CheckResultDTO]).self) { group in
            for watchId in watchIds {
                group.addTask {
                    do {
                        let results = try await supabase.fetchPriceHistory(forWatchId: watchId)
                        return (watchId, results)
                    } catch {
                        return (watchId, [])
                    }
                }
            }

            // Convert to PricePoints on the main actor (after async fetches complete)
            for await (watchId, results) in group {
                priceHistories[watchId] = PricePoint.fromCheckResults(results)
            }
        }

        let watchTuples = priceWatches.map { (id: $0.id, name: $0.name, emoji: $0.emoji) }
        // Store for SavingsScreen
        allPriceHistories = priceHistories

        savingsCalculation = SavingsCalculator.calculate(
            watches: watchTuples,
            priceHistories: priceHistories
        )

        isLoadingSavings = false
    }

    // MARK: - Image Backfill

    /// Fetches OG images for any watches that don't have a product image yet.
    /// Runs as a fire-and-forget Task so it doesn't block the sync flow.
    private func backfillMissingImages() {
        let watchesMissingImages = watches.filter { $0.imageURL == nil }
        guard !watchesMissingImages.isEmpty else { return }

        let task = Task {
            for watch in watchesMissingImages {
                guard !Task.isCancelled else { return }
                if let ogImage = await fetchOGImageURL(for: watch.url) {
                    watch.imageURL = ogImage
                    try? modelContext?.save()

                    // Push update to Supabase
                    if let userId = auth?.currentUserId {
                        let dto = watch.toDTO(userId: userId)
                        try? await supabase?.updateWatch(dto)
                    }
                }
            }
            // Refresh UI once after all backfills complete
            fetchLocalWatches()
        }
        backgroundTasks.append(task)
    }

    // MARK: - Watch Name Resolution

    /// Resolves placeholder watch names created by the Share Extension.
    /// The Share Extension saves watches with just the domain name (e.g. "rei.com")
    /// because mobile app URLs are unreliable for name extraction. This method
    /// fetches the actual page, extracts the real product name, and updates the watch.
    private func resolveWatchNames() async {
        let watchesNeedingNames = watches.filter { watch in
            guard let host = URL(string: watch.url)?.host?.replacingOccurrences(of: "www.", with: "") else { return false }
            // Watch name matches the domain — it's a placeholder from Share Extension
            return watch.name.lowercased() == host.lowercased()
                || watch.name.lowercased() == "www.\(host.lowercased())"
        }
        guard !watchesNeedingNames.isEmpty else { return }

        #if DEBUG
        print("[WatchViewModel] Resolving names for \(watchesNeedingNames.count) watch(es)")
        #endif

        for watch in watchesNeedingNames {
            guard let result = await resolveWatchURL(for: watch.url) else { continue }

            var didChange = false

            // Update URL if it resolved to a different (better) URL
            if let resolvedURL = result.resolvedURL, resolvedURL != watch.url {
                watch.url = resolvedURL
                didChange = true
                #if DEBUG
                print("[WatchViewModel] Resolved watch URL: \(resolvedURL)")
                #endif
            }

            // Update name if we extracted one
            if let resolvedName = result.name {
                watch.name = resolvedName
                didChange = true
                #if DEBUG
                print("[WatchViewModel] Resolved watch name: \(resolvedName)")
                #endif
            }

            if didChange {
                try? modelContext?.save()

                // Push update to Supabase
                if let userId = auth?.currentUserId {
                    let dto = watch.toDTO(userId: userId)
                    try? await supabase?.updateWatch(dto)
                }
            }
        }

        // Refresh UI after updates
        if !watchesNeedingNames.isEmpty {
            fetchLocalWatches()
        }
    }

    /// Result of resolving a watch URL — contains the final resolved URL and extracted product name.
    private struct ResolvedWatch {
        let resolvedURL: String?
        let name: String?
    }

    /// Fetches a URL (with desktop User-Agent, following redirects) and returns
    /// both the final resolved URL and the extracted product name.
    /// Tries the original URL first to follow short-link redirects, then falls back
    /// to the desktop-normalized URL if the original fails.
    private func resolveWatchURL(for urlString: String) async -> ResolvedWatch? {
        guard let originalURL = URL(string: urlString) else { return nil }

        let desktopUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

        // Step 1: Fetch the ORIGINAL URL first.
        // Mobile short links (e.g. mobile.rei.com/AkCd/xyz) only resolve on their original domain.
        // Changing the subdomain before fetching would break the short link path.
        var request = URLRequest(url: originalURL)
        request.httpMethod = "GET"
        request.timeoutInterval = 10
        request.setValue(desktopUA, forHTTPHeaderField: "User-Agent")

        var html: String?
        var resolvedURL: String?

        if let (data, response) = try? await URLSession.shared.data(for: request) {
            html = String(data: data, encoding: .utf8)
            if let finalURL = response.url?.absoluteString, finalURL != urlString {
                // Don't use the resolved URL if it's just a homepage redirect
                // (app deep links like mobile.rei.com/AkCd/xyz → www.rei.com/ are useless)
                if !Self.isHomepageRedirect(resolved: finalURL, original: urlString) {
                    resolvedURL = finalURL
                } else {
                    // Homepage redirect means the HTML is the homepage too — discard it
                    html = nil
                    #if DEBUG
                    print("[WatchViewModel] Detected homepage redirect: \(urlString) → \(finalURL) — keeping original URL")
                    #endif
                }
            }
        }

        // Step 2: If the original failed, try the desktop-normalized URL as fallback
        if html == nil || html?.count ?? 0 < 200 {
            let desktopURLString = Self.normalizeToDesktopURL(urlString)
            if desktopURLString != urlString, let desktopURL = URL(string: desktopURLString) {
                var fallbackRequest = URLRequest(url: desktopURL)
                fallbackRequest.httpMethod = "GET"
                fallbackRequest.timeoutInterval = 10
                fallbackRequest.setValue(desktopUA, forHTTPHeaderField: "User-Agent")

                if let (data, response) = try? await URLSession.shared.data(for: fallbackRequest) {
                    html = String(data: data, encoding: .utf8)
                    if let finalURL = response.url?.absoluteString, finalURL != urlString {
                        if !Self.isHomepageRedirect(resolved: finalURL, original: urlString) {
                            resolvedURL = finalURL
                        } else {
                            html = nil
                        }
                    }
                }
            }
        }

        guard let pageHTML = html else { return nil }

        // Extract og:title or <title>
        var resolvedName: String?
        let patterns = [
            "property=\"og:title\"\\s+content=\"([^\"]+)\"",
            "content=\"([^\"]+)\"\\s+property=\"og:title\"",
            "<title[^>]*>([^<]+)</title>"
        ]
        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
               let match = regex.firstMatch(in: pageHTML, range: NSRange(pageHTML.startIndex..., in: pageHTML)),
               let range = Range(match.range(at: 1), in: pageHTML) {
                let title = String(pageHTML[range]).trimmingCharacters(in: .whitespacesAndNewlines)
                if !title.isEmpty && !Self.isGenericTitle(title) {
                    resolvedName = title
                    break
                }
            }
        }

        // Only return if we found at least something useful
        guard resolvedURL != nil || resolvedName != nil else { return nil }
        return ResolvedWatch(resolvedURL: resolvedURL, name: resolvedName)
    }

    /// Converts mobile URLs to desktop for better page fetching.
    private static func normalizeToDesktopURL(_ urlString: String) -> String {
        guard var components = URLComponents(string: urlString),
              let host = components.host?.lowercased() else { return urlString }
        if host.hasPrefix("mobile.") {
            components.host = "www." + host.dropFirst("mobile.".count)
        } else if host.hasPrefix("m.") {
            components.host = "www." + host.dropFirst("m.".count)
        } else if host.hasPrefix("amp.") {
            components.host = "www." + host.dropFirst("amp.".count)
        }
        return components.url?.absoluteString ?? urlString
    }

    /// Returns true if the redirect lost all path specificity — i.e. the original
    /// URL had a meaningful path but the resolved URL is just a homepage ("/").
    /// This happens with app deep links (e.g. mobile.rei.com/AkCd/xyz → www.rei.com/).
    private static func isHomepageRedirect(resolved: String, original: String) -> Bool {
        guard let resolvedURL = URL(string: resolved),
              let originalURL = URL(string: original) else { return false }
        let resolvedPath = resolvedURL.path
        let originalPath = originalURL.path
        let resolvedIsHomepage = resolvedPath.isEmpty || resolvedPath == "/"
        let originalHadPath = !originalPath.isEmpty && originalPath != "/"
        return resolvedIsHomepage && originalHadPath
    }

    /// Checks if a page title is generic (site tagline, redirect page, etc.)
    private static func isGenericTitle(_ title: String) -> Bool {
        let lower = title.lowercased()
        // Redirect / loading pages
        let bad = ["launching app", "loading", "redirect", "please wait",
                   "checking your browser", "page not found", "404",
                   "access denied", "sign in", "log in", "captcha",
                   "download the app", "open in app"]
        if bad.contains(where: { lower.contains($0) }) { return true }
        // Site-wide taglines: "Brand – Long marketing tagline..."
        for sep in [" – ", " | ", " - ", ": "] {
            if let r = lower.range(of: sep) {
                let after = lower[r.upperBound...].trimmingCharacters(in: .whitespaces)
                if after.count > 30 { return true }
            }
        }
        // Marketing keywords
        let marketing = ["official site", "online shopping", "free shipping",
                         "top-brand", "top brand", "for all your", "best deals"]
        if marketing.contains(where: { lower.contains($0) }) { return true }
        if lower.count <= 2 { return true }
        return false
    }

    // MARK: - Watch Management

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
            let currentTier = subscriptionManager?.currentTier ?? .free
            let highlightTier: SubscriptionTier = currentTier == .free ? .pro : .premium
            subscriptionManager?.presentPaywall(
                highlighting: highlightTier,
                reason: "You've reached the \(maxWatches)-watch limit on your \(currentTier.displayName) plan. Upgrade to add more watches."
            )
            return
        }

        // Check for duplicate URL (normalized: strip protocol, www, trailing slash)
        let normalizedURL = watch.url.lowercased()
            .replacingOccurrences(of: "https://", with: "")
            .replacingOccurrences(of: "http://", with: "")
            .replacingOccurrences(of: "www.", with: "")
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let isDuplicate = watches.contains { existing in
            let n = existing.url.lowercased()
                .replacingOccurrences(of: "https://", with: "")
                .replacingOccurrences(of: "http://", with: "")
                .replacingOccurrences(of: "www.", with: "")
                .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
            return n == normalizedURL
        }
        if isDuplicate {
            syncError = "You're already watching this URL"
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

                // Trigger the first check immediately so the user gets a data point right away
                try? await supabase?.triggerCheck(watchId: watch.id)

                // Refresh local data after the check updates last_checked and potentially adds check_results
                await MainActor.run {
                    try? context.save()
                    withAnimation(.spring(response: 0.3)) {
                        fetchLocalWatches()
                    }
                }
            } catch {
                syncError = "Failed to sync watch: \(error.localizedDescription)"
            }
        }
    }

    /// Creates a watch and stores the user-confirmed price as the first check_result
    func addWatchWithPrice(_ watch: Watch, initialPrice: Double) {
        addWatch(watch)
        Task {
            try? await supabase?.createInitialPricePoint(watchId: watch.id, price: initialPrice)
        }
    }

    /// Updates the starting price for an existing watch (replaces or creates the initial price point)
    func updateWatchPrice(watchId: UUID, price: Double) {
        Task {
            try? await supabase?.createInitialPricePoint(watchId: watchId, price: price)
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

        // Also delete associated activities locally
        deleteLocalActivities(forWatchId: watchId)

        try? context.save()
        withAnimation(.spring(response: 0.3)) {
            fetchLocalWatches()
            fetchLocalActivities()
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

    /// Bulk delete multiple watches by their IDs
    func removeWatches(ids: Set<UUID>) {
        guard let context = modelContext else { return }
        let watchesToDelete = watches.filter { ids.contains($0.id) }

        for watch in watchesToDelete {
            context.delete(watch)
        }

        // Also delete associated activities locally
        for watchId in ids {
            deleteLocalActivities(forWatchId: watchId)
        }

        try? context.save()
        withAnimation(.spring(response: 0.3)) {
            fetchLocalWatches()
            fetchLocalActivities()
        }

        Task {
            for id in ids {
                try? await supabase?.deleteWatch(id: id)
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

    /// Opens the chat drawer pre-loaded with context about a broken watch
    func askAIToFix(_ watch: Watch) {
        pendingFixContext = "[FIX_WATCH] My watch \"\(watch.name)\" (URL: \(watch.url)) is broken. Error: \(watch.lastError ?? "unknown error"). Failed \(watch.consecutiveFailures) times. Existing settings — condition: \(watch.condition), action type: \(watch.actionType.displayName). IMPORTANT: First try to find a working version of the ORIGINAL URL (\(watch.url)) — it may have moved or changed format. Only if the original domain/URL is completely dead, then search for \"\(watch.name)\" to find an alternative product page. Once you find a working URL, use [UPDATE_WATCH]{\"name\":\"\(watch.name)\",\"url\":\"THE_NEW_URL\"}[/UPDATE_WATCH] to fix it. Do NOT ask me what to watch for — keep the existing settings."
        isChatOpen = true
    }

    /// Updates a broken watch with a new URL and resets error state
    func fixBrokenWatch(name: String, newURL: String) {
        guard let context = modelContext else {
            #if DEBUG
            print("[WatchVM] fixBrokenWatch: no modelContext")
            #endif
            return
        }
        #if DEBUG
        print("[WatchVM] fixBrokenWatch: searching for '\(name)' in \(watches.count) watches: \(watches.map { $0.name })")
        #endif

        // Find the watch by name (case-insensitive partial match)
        let match = watches.first { $0.name.localizedCaseInsensitiveContains(name) }
            ?? watches.first { name.localizedCaseInsensitiveContains($0.name) }
        guard let watch = match else {
            #if DEBUG
            print("[WatchVM] fixBrokenWatch: no watch found matching '\(name)'")
            #endif
            return
        }

        #if DEBUG
        print("[WatchVM] fixBrokenWatch: FOUND '\(watch.name)' — updating URL to \(newURL)")
        #endif
        watch.url = newURL
        watch.consecutiveFailures = 0
        watch.lastError = nil
        watch.needsAttention = false
        try? context.save()
        fetchLocalWatches()

        // Sync the fix to Supabase
        Task {
            guard let supabase = self.supabase, let auth = self.auth, let userId = auth.currentUserId else { return }
            let dto = watch.toDTO(userId: userId)
            try? await supabase.updateWatch(dto)
        }
    }

    // MARK: - Activity Logging

    private func logActivity(_ activity: ActivityItem, watchId: UUID? = nil) {
        guard let context = modelContext else { return }
        activity.watchId = watchId
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

    /// Deletes all local activities associated with a given watch ID
    private func deleteLocalActivities(forWatchId watchId: UUID) {
        guard let context = modelContext else { return }
        let allActivities = (try? context.fetch(FetchDescriptor<ActivityItem>())) ?? []
        for activity in allActivities where activity.watchId == watchId {
            context.delete(activity)
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
            watch.actionURL = nil  // Clear the action URL after acting
            watch.couponCode = nil // Clear coupon code after use
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
