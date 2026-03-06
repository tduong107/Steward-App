import Foundation
import UIKit
import UserNotifications
import Observation

@Observable
@MainActor
final class NotificationManager: NSObject {
    var isPermissionGranted = false
    var deviceToken: String?

    private var supabase: SupabaseService?

    func configure(supabase: SupabaseService) {
        self.supabase = supabase
    }

    // MARK: - Request Permission

    func requestPermission() async {
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .badge, .sound])
            self.isPermissionGranted = granted

            if granted {
                // Register for remote notifications on main thread
                await MainActor.run {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }
        } catch {
            #if DEBUG
            print("[NotificationManager] Permission error: \(error)")
            #endif
        }
    }

    // MARK: - Check Current Status

    func checkCurrentStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        isPermissionGranted = settings.authorizationStatus == .authorized
    }

    // MARK: - Handle Device Token

    func didRegisterForRemoteNotifications(deviceToken data: Data) {
        let token = data.map { String(format: "%02.2hhx", $0) }.joined()
        self.deviceToken = token
        #if DEBUG
        print("[NotificationManager] APNs token: \(token)")
        #endif

        // Store token in Supabase
        Task {
            do {
                try await supabase?.updateDeviceToken(token)
                #if DEBUG
                print("[NotificationManager] Token saved to Supabase")
                #endif
            } catch {
                #if DEBUG
                print("[NotificationManager] Failed to save token: \(error)")
                #endif
            }
        }
    }

    func didFailToRegisterForRemoteNotifications(error: Error) {
        #if DEBUG
        print("[NotificationManager] Failed to register: \(error)")
        #endif
    }
}
