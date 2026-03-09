import SwiftUI
import SwiftData
import Supabase

@main
struct Steward_AppApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var authManager = AuthManager()
    @State private var supabaseService = SupabaseService()
    @State private var notificationManager = NotificationManager()
    @State private var subscriptionManager = SubscriptionManager()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(authManager)
                .environment(supabaseService)
                .environment(notificationManager)
                .environment(subscriptionManager)
                .onReceive(NotificationCenter.default.publisher(for: .didRegisterForRemoteNotifications)) { notification in
                    if let token = notification.userInfo?["token"] as? Data {
                        notificationManager.didRegisterForRemoteNotifications(deviceToken: token)
                    }
                }
                .onReceive(NotificationCenter.default.publisher(for: .didFailToRegisterForRemoteNotifications)) { notification in
                    if let error = notification.userInfo?["error"] as? Error {
                        notificationManager.didFailToRegisterForRemoteNotifications(error: error)
                    }
                }
                .onOpenURL { url in
                    // Handle steward://watch/XXXXXX deep links
                    guard url.scheme == "steward",
                          url.host == "watch",
                          let code = url.pathComponents.dropFirst().first else { return }
                    NotificationCenter.default.post(
                        name: .didOpenSharedWatch,
                        object: nil,
                        userInfo: ["share_code": String(code)]
                    )
                }
                .onChange(of: scenePhase) { _, newPhase in
                    if newPhase == .active {
                        checkForSharedURL()
                        refreshSharedToken()
                    }
                }
                .task {
                    notificationManager.configure(supabase: supabaseService)
                    await notificationManager.checkCurrentStatus()
                    await subscriptionManager.loadProducts()
                    await subscriptionManager.checkEntitlements()
                }
        }
        .modelContainer(for: [Watch.self, ActivityItem.self])
    }

    // MARK: - Auth Token Refresh for Share Extension

    /// Keeps the App Group access token fresh so the Share Extension can authenticate
    private func refreshSharedToken() {
        Task {
            if let session = try? await SupabaseConfig.client.auth.session {
                AuthManager.syncTokenToAppGroup(accessToken: session.accessToken, userId: session.user.id)
            }
        }
    }

    // MARK: - Share Extension URL Pickup

    /// Checks App Group storage for a URL shared via the Share Extension.
    /// Posts a notification so ContentView can open the chat with the URL pre-filled.
    private func checkForSharedURL() {
        guard let defaults = UserDefaults(suiteName: "group.Steward.Steward-App"),
              let url = defaults.string(forKey: "pendingSharedURL") else { return }

        // Ignore stale URLs (older than 24 hours)
        let timestamp = defaults.double(forKey: "pendingSharedURLTimestamp")
        let age = Date().timeIntervalSince1970 - timestamp
        guard age < 86400 else {
            defaults.removeObject(forKey: "pendingSharedURL")
            defaults.removeObject(forKey: "pendingSharedURLTimestamp")
            return
        }

        // Clear immediately to prevent re-processing
        defaults.removeObject(forKey: "pendingSharedURL")
        defaults.removeObject(forKey: "pendingSharedURLTimestamp")

        // Post notification for ContentView to pick up
        NotificationCenter.default.post(
            name: .didReceiveSharedURL,
            object: nil,
            userInfo: ["url": url]
        )
    }
}
