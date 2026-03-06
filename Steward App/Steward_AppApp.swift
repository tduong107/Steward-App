import SwiftUI
import SwiftData

@main
struct Steward_AppApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var authManager = AuthManager()
    @State private var supabaseService = SupabaseService()
    @State private var notificationManager = NotificationManager()
    @State private var subscriptionManager = SubscriptionManager()

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
                .task {
                    notificationManager.configure(supabase: supabaseService)
                    await notificationManager.checkCurrentStatus()
                    await subscriptionManager.loadProducts()
                    await subscriptionManager.checkEntitlements()
                }
        }
        .modelContainer(for: [Watch.self, ActivityItem.self])
    }
}
