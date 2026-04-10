import UIKit
import UserNotifications

class AppDelegate: NSObject, UIApplicationDelegate {

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Set notification delegate for foreground display
        UNUserNotificationCenter.current().delegate = self

        // Register rich notification categories with action buttons
        registerNotificationCategories()

        // Handle notification that launched the app (cold start / killed state)
        if let remoteNotification = launchOptions?[.remoteNotification] as? [String: Any],
           let watchIdString = remoteNotification["watch_id"] as? String,
           let watchId = UUID(uuidString: watchIdString) {
            // Delay slightly to let the UI initialize before posting deep link
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                NotificationCenter.default.post(
                    name: .didTapWatchNotification,
                    object: nil,
                    userInfo: ["watch_id": watchId]
                )
            }
        }

        return true
    }

    // MARK: - Notification Categories

    private func registerNotificationCategories() {
        // "Open & Act" — opens the action URL directly (add-to-cart, booking page, etc.)
        let openAction = UNNotificationAction(
            identifier: "OPEN_ACTION_URL",
            title: "Open & Act",
            options: [.foreground]
        )

        // "View Details" — opens the watch detail screen in-app
        let viewAction = UNNotificationAction(
            identifier: "VIEW_DETAILS",
            title: "View Details",
            options: [.foreground]
        )

        let triggeredCategory = UNNotificationCategory(
            identifier: "WATCH_TRIGGERED",
            actions: [openAction, viewAction],
            intentIdentifiers: [],
            options: []
        )

        // "Needs attention" category — just a view action, no "act" button
        let viewOnlyAction = UNNotificationAction(
            identifier: "VIEW_DETAILS",
            title: "View Details",
            options: [.foreground]
        )

        let attentionCategory = UNNotificationCategory(
            identifier: "WATCH_NEEDS_ATTENTION",
            actions: [viewOnlyAction],
            intentIdentifiers: [],
            options: []
        )

        UNUserNotificationCenter.current().setNotificationCategories([
            triggeredCategory,
            attentionCategory,
        ])
    }

    // MARK: - Remote Notifications

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        // Forward to NotificationManager — handled via notification post
        NotificationCenter.default.post(
            name: .didRegisterForRemoteNotifications,
            object: nil,
            userInfo: ["token": deviceToken]
        )
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        NotificationCenter.default.post(
            name: .didFailToRegisterForRemoteNotifications,
            object: nil,
            userInfo: ["error": error]
        )
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension AppDelegate: UNUserNotificationCenterDelegate {
    // Show notifications even when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .badge, .sound])
    }

    // Handle notification tap — route based on action identifier
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        let actionId = response.actionIdentifier

        #if DEBUG
        print("[AppDelegate] Notification tapped: action=\(actionId) userInfo=\(userInfo)")
        #endif

        guard let watchIdString = userInfo["watch_id"] as? String,
              let watchId = UUID(uuidString: watchIdString) else {
            completionHandler()
            return
        }

        // Track notification tap in PostHog
        let notificationType = userInfo["notification_type"] as? String ?? "triggered"
        Task { @MainActor in
            AnalyticsService.shared.trackNotificationTapped(type: notificationType, watchId: watchIdString)
        }

        if actionId == "OPEN_ACTION_URL",
           let actionURLString = userInfo["action_url"] as? String {
            // User tapped "Open & Act" — open the action URL directly
            NotificationCenter.default.post(
                name: .didTapActionURL,
                object: nil,
                userInfo: ["watch_id": watchId, "action_url": actionURLString]
            )
        } else {
            // Default tap or "View Details" — navigate to watch detail screen
            NotificationCenter.default.post(
                name: .didTapWatchNotification,
                object: nil,
                userInfo: ["watch_id": watchId]
            )
        }

        completionHandler()
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let didRegisterForRemoteNotifications = Notification.Name("didRegisterForRemoteNotifications")
    static let didFailToRegisterForRemoteNotifications = Notification.Name("didFailToRegisterForRemoteNotifications")
    static let didTapWatchNotification = Notification.Name("didTapWatchNotification")
    static let didTapActionURL = Notification.Name("didTapActionURL")
    static let didOpenSharedWatch = Notification.Name("didOpenSharedWatch")
    static let didReceiveSharedURL = Notification.Name("didReceiveSharedURL")
}
