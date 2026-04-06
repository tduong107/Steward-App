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

        // Re-register for remote notifications to ensure device token is fresh
        if isPermissionGranted {
            await MainActor.run {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    // MARK: - Handle Device Token

    func didRegisterForRemoteNotifications(deviceToken data: Data) {
        let token = data.map { String(format: "%02.2hhx", $0) }.joined()
        self.deviceToken = token
        #if DEBUG
        print("[NotificationManager] APNs token: \(token)")
        #endif

        // Store token in Supabase (retry up to 3 times on failure)
        Task {
            var lastError: Error?
            for attempt in 1...3 {
                do {
                    try await supabase?.updateDeviceToken(token)
                    #if DEBUG
                    print("[NotificationManager] Token saved to Supabase")
                    #endif
                    return
                } catch {
                    lastError = error
                    #if DEBUG
                    print("[NotificationManager] Token save attempt \(attempt) failed: \(error)")
                    #endif
                    if attempt < 3 {
                        try? await Task.sleep(for: .seconds(Double(attempt) * 2))
                    }
                }
            }
            #if DEBUG
            print("[NotificationManager] Token save failed after 3 attempts: \(lastError?.localizedDescription ?? "unknown")")
            #endif
        }
    }

    func didFailToRegisterForRemoteNotifications(error: Error) {
        #if DEBUG
        print("[NotificationManager] Failed to register: \(error)")
        #endif
    }

    // MARK: - Quiet Hours

    /// Whether the current time falls within the user's quiet hours window.
    /// Used to suppress local notifications; server-side suppression uses the profile fields.
    var isInQuietHours: Bool {
        let defaults = UserDefaults.standard
        guard defaults.bool(forKey: "quietHoursEnabled") else { return false }

        let startHour = Int(defaults.double(forKey: "quietHoursStart"))
        let endHour = Int(defaults.double(forKey: "quietHoursEnd"))
        let currentHour = Calendar.current.component(.hour, from: Date())

        if startHour <= endHour {
            // Same-day range (e.g., 9 AM → 5 PM)
            return currentHour >= startHour && currentHour < endHour
        } else {
            // Overnight range (e.g., 10 PM → 7 AM)
            return currentHour >= startHour || currentHour < endHour
        }
    }
}
