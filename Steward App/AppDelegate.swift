import UIKit

class AppDelegate: NSObject, UIApplicationDelegate {

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Set notification delegate for foreground display
        UNUserNotificationCenter.current().delegate = self

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

    // Handle notification tap — extract watch_id and deep link to detail screen
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo

        if let watchIdString = userInfo["watch_id"] as? String,
           let watchId = UUID(uuidString: watchIdString) {
            NotificationCenter.default.post(
                name: .didTapWatchNotification,
                object: nil,
                userInfo: ["watch_id": watchId]
            )
        }

        #if DEBUG
        print("[AppDelegate] Notification tapped: \(userInfo)")
        #endif

        completionHandler()
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let didRegisterForRemoteNotifications = Notification.Name("didRegisterForRemoteNotifications")
    static let didFailToRegisterForRemoteNotifications = Notification.Name("didFailToRegisterForRemoteNotifications")
    static let didTapWatchNotification = Notification.Name("didTapWatchNotification")
    static let didOpenSharedWatch = Notification.Name("didOpenSharedWatch")
}
