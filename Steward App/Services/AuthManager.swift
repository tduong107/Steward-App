import Foundation
import Observation
import Supabase
import AuthenticationServices
import GoogleSignIn

@Observable
@MainActor
final class AuthManager {
    var isAuthenticated = false
    var isLoading = true
    var currentUserId: UUID?
    var displayName: String?
    var phoneNumber: String?
    var notificationEmail: String?
    var authEmail: String?
    var authPhone: String?
    var errorMessage: String?

    /// Best available email — notification_email from profile, or auth login email
    var effectiveEmail: String? {
        if let e = notificationEmail, !e.isEmpty { return e }
        if let e = authEmail, !e.isEmpty { return e }
        return nil
    }

    /// Best available phone — profile phone_number, or auth login phone
    var effectivePhone: String? {
        if let p = phoneNumber, !p.isEmpty { return p }
        if let p = authPhone, !p.isEmpty { return p }
        return nil
    }

    // Shared App Group suite for communicating with the Share Extension
    private static let sharedDefaults = UserDefaults(suiteName: "group.Steward.Steward-App")

    // MARK: - Initialize (check existing session)

    func initialize() async {
        do {
            let session = try await SupabaseConfig.client.auth.session
            self.currentUserId = session.user.id
            self.isAuthenticated = true
            self.authEmail = session.user.email
            self.authPhone = session.user.phone

            // Sync auth token to App Group so Share Extension can use it
            Self.syncTokenToAppGroup(accessToken: session.accessToken, userId: session.user.id)

            // Fetch display name and phone from profile
            if let profile: ProfileDTO = try? await SupabaseConfig.client
                .from("profiles")
                .select()
                .eq("id", value: session.user.id.uuidString)
                .single()
                .execute()
                .value {
                self.displayName = profile.displayName
                self.phoneNumber = profile.phoneNumber
                self.notificationEmail = profile.notificationEmail
            }
        } catch {
            self.isAuthenticated = false
            Self.clearTokenFromAppGroup()
        }
        self.isLoading = false
    }

    // MARK: - Phone + Password Sign Up

    /// Validates phone number format (E.164: +1XXXXXXXXXX)
    private func isValidPhone(_ phone: String) -> Bool {
        let digits = phone.replacingOccurrences(of: "[^0-9+]", with: "", options: .regularExpression)
        // Must start with + and be 10-15 digits
        return digits.hasPrefix("+") && digits.count >= 11 && digits.count <= 16
    }

    /// Creates a new account with phone number and password.
    /// After sign-up, an OTP code is sent to the phone for verification.
    func signUp(phone: String, password: String, name: String) async throws {
        errorMessage = nil

        guard isValidPhone(phone) else {
            errorMessage = "Please enter a valid phone number"
            return
        }

        guard password.count >= 6 else {
            errorMessage = "Password must be at least 6 characters"
            return
        }

        let response = try await SupabaseConfig.client.auth.signUp(
            phone: phone,
            password: password
        )

        // If we got a session immediately (auto-confirm enabled), finalize
        if let session = response.session {
            self.currentUserId = session.user.id
            self.isAuthenticated = true
            Self.syncTokenToAppGroup(accessToken: session.accessToken, userId: session.user.id)

            // Save profile data
            await saveProfile(userId: session.user.id, name: name, phone: phone)
        }
        // Otherwise, user needs to verify OTP first
    }

    // MARK: - Phone OTP Verification

    /// Verifies the OTP code sent to the phone during sign-up
    func verifyOTP(phone: String, code: String, name: String) async throws {
        errorMessage = nil

        let response = try await SupabaseConfig.client.auth.verifyOTP(
            phone: phone,
            token: code,
            type: .sms
        )

        guard let session = response.session else {
            throw AuthError.missingToken
        }

        self.currentUserId = session.user.id
        self.isAuthenticated = true
        Self.syncTokenToAppGroup(accessToken: session.accessToken, userId: session.user.id)

        // Save profile data after verification
        await saveProfile(userId: session.user.id, name: name, phone: phone)
    }

    // MARK: - Phone + Password Sign In

    /// Signs in an existing user with phone number and password
    func signIn(phone: String, password: String) async throws {
        errorMessage = nil

        let session = try await SupabaseConfig.client.auth.signIn(
            phone: phone,
            password: password
        )

        self.currentUserId = session.user.id
        self.isAuthenticated = true
        Self.syncTokenToAppGroup(accessToken: session.accessToken, userId: session.user.id)

        // Fetch profile
        if let profile: ProfileDTO = try? await SupabaseConfig.client
            .from("profiles")
            .select()
            .eq("id", value: session.user.id.uuidString)
            .single()
            .execute()
            .value {
            self.displayName = profile.displayName
            self.phoneNumber = profile.phoneNumber
            self.notificationEmail = profile.notificationEmail
        }
    }

    // MARK: - Apple Sign-In (secondary option)

    func signInWithApple(credential: ASAuthorizationAppleIDCredential) async throws {
        guard let identityToken = credential.identityToken,
              let tokenString = String(data: identityToken, encoding: .utf8) else {
            throw AuthError.missingToken
        }

        errorMessage = nil

        let session = try await SupabaseConfig.client.auth.signInWithIdToken(
            credentials: .init(
                provider: .apple,
                idToken: tokenString
            )
        )

        self.currentUserId = session.user.id
        self.isAuthenticated = true

        // Sync auth token to App Group so Share Extension can use it
        Self.syncTokenToAppGroup(accessToken: session.accessToken, userId: session.user.id)

        // Save display name if Apple provides it (only on first sign-in)
        if let fullName = credential.fullName {
            let name = [fullName.givenName, fullName.familyName]
                .compactMap { $0 }
                .joined(separator: " ")
            if !name.isEmpty {
                self.displayName = name
                _ = try? await SupabaseConfig.client
                    .from("profiles")
                    .update(["display_name": name])
                    .eq("id", value: session.user.id.uuidString)
                    .execute()
            }
        }
    }

    // MARK: - Google Sign-In

    /// Signs in with Google using the GoogleSignIn SDK + Supabase signInWithIdToken
    func signInWithGoogle() async throws {
        errorMessage = nil

        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootVC = windowScene.windows.first?.rootViewController else {
            throw AuthError.missingToken
        }

        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: rootVC)
        guard let idToken = result.user.idToken?.tokenString else {
            throw AuthError.missingToken
        }
        let accessToken = result.user.accessToken.tokenString

        let session = try await SupabaseConfig.client.auth.signInWithIdToken(
            credentials: .init(
                provider: .google,
                idToken: idToken,
                accessToken: accessToken
            )
        )

        self.currentUserId = session.user.id
        self.isAuthenticated = true
        self.authEmail = session.user.email
        self.authPhone = session.user.phone
        Self.syncTokenToAppGroup(accessToken: session.accessToken, userId: session.user.id)

        // Save display name and email from Google profile
        var profileData: [String: String] = ["id": session.user.id.uuidString]
        if let fullName = result.user.profile?.name, !fullName.isEmpty {
            self.displayName = fullName
            profileData["display_name"] = fullName
        }
        // Auto-save Google email as notification email so alerts work immediately
        if let email = session.user.email, !email.isEmpty {
            self.notificationEmail = email
            profileData["notification_email"] = email
        }
        if profileData.count > 1 { // more than just "id"
            _ = try? await SupabaseConfig.client
                .from("profiles")
                .upsert(profileData)
                .execute()
        }

        await fetchProfile(userId: session.user.id)
    }

    // MARK: - Forgot Password (Phone OTP)

    /// Sends a password reset OTP to the user's phone number
    func sendPasswordResetOTP(phone: String) async throws {
        errorMessage = nil
        try await SupabaseConfig.client.auth.signInWithOTP(phone: phone)
    }

    /// Verifies the OTP and resets the user's password
    func resetPassword(phone: String, otp: String, newPassword: String) async throws {
        errorMessage = nil

        // Step 1: Verify the OTP to establish a session
        let response = try await SupabaseConfig.client.auth.verifyOTP(
            phone: phone,
            token: otp,
            type: .sms
        )

        guard response.session != nil else {
            throw AuthError.invalidOTP
        }

        // Step 2: Update the password using the newly established session
        try await SupabaseConfig.client.auth.update(user: .init(password: newPassword))

        // Sign out after password reset — user needs to sign in with new password
        await signOut()
    }

    // MARK: - Sign Out

    func signOut() async {
        do {
            try await SupabaseConfig.client.auth.signOut()
        } catch {
            // Sign out locally even if the server call fails
        }
        self.isAuthenticated = false
        self.currentUserId = nil
        self.displayName = nil
        self.phoneNumber = nil
        self.notificationEmail = nil
        self.authEmail = nil
        self.authPhone = nil
        Self.clearTokenFromAppGroup()
    }

    // MARK: - Profile Helpers

    /// Fetches and populates profile fields from Supabase
    func fetchProfile(userId: UUID) async {
        if let profile: ProfileDTO = try? await SupabaseConfig.client
            .from("profiles")
            .select()
            .eq("id", value: userId.uuidString)
            .single()
            .execute()
            .value {
            self.displayName = profile.displayName
            self.phoneNumber = profile.phoneNumber
            self.notificationEmail = profile.notificationEmail
        }
    }

    /// Saves or updates the user's profile with name and phone number
    private func saveProfile(userId: UUID, name: String, phone: String) async {
        self.displayName = name
        self.phoneNumber = phone

        _ = try? await SupabaseConfig.client
            .from("profiles")
            .upsert([
                "id": userId.uuidString,
                "display_name": name,
                "phone_number": phone
            ])
            .execute()
    }

    // MARK: - Notification Contact Methods

    func saveNotificationEmail(_ email: String) async {
        guard let userId = currentUserId else { return }
        self.notificationEmail = email
        _ = try? await SupabaseConfig.client
            .from("profiles")
            .update(["notification_email": email])
            .eq("id", value: userId.uuidString)
            .execute()
    }

    func clearNotificationEmail() async {
        guard let userId = currentUserId else { return }
        self.notificationEmail = nil
        _ = try? await SupabaseConfig.client
            .from("profiles")
            .update(["notification_email": ""])
            .eq("id", value: userId.uuidString)
            .execute()
    }

    func savePhoneNumber(_ phone: String) async {
        guard let userId = currentUserId else { return }
        self.phoneNumber = phone
        _ = try? await SupabaseConfig.client
            .from("profiles")
            .update(["phone_number": phone])
            .eq("id", value: userId.uuidString)
            .execute()
    }

    // MARK: - Account Deletion

    func deleteAccount() async throws {
        guard let userId = currentUserId else { return }

        // Delete profile data from Supabase (RLS will scope to user's own data)
        _ = try? await SupabaseConfig.client
            .from("watches")
            .delete()
            .eq("user_id", value: userId.uuidString)
            .execute()

        _ = try? await SupabaseConfig.client
            .from("profiles")
            .delete()
            .eq("id", value: userId.uuidString)
            .execute()

        // Sign out and clear local state
        await signOut()
    }

    // MARK: - App Group Token Sync (for Share Extension)
    // Uses Keychain with shared access group for secure storage.
    // Falls back to App Group UserDefaults for userId (non-sensitive).

    private static let keychainService = "com.steward.shared-auth"
    private static let keychainAccessGroup = "group.Steward.Steward-App"
    private static let keychainAccountKey = "accessToken"

    /// Writes the current auth token to shared Keychain + userId to App Group
    static func syncTokenToAppGroup(accessToken: String, userId: UUID) {
        // Store access token in Keychain (encrypted, hardware-backed)
        let tokenData = Data(accessToken.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccountKey,
            kSecAttrAccessGroup as String: keychainAccessGroup,
        ]
        // Delete any existing item first
        SecItemDelete(query as CFDictionary)
        // Add new item
        var addQuery = query
        addQuery[kSecValueData as String] = tokenData
        addQuery[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        SecItemAdd(addQuery as CFDictionary, nil)

        // Store userId in App Group UserDefaults (non-sensitive)
        guard let defaults = sharedDefaults else { return }
        defaults.set(userId.uuidString, forKey: "userId")
    }

    /// Reads the access token from shared Keychain
    static func readTokenFromKeychain() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccountKey,
            kSecAttrAccessGroup as String: keychainAccessGroup,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    /// Removes auth token from Keychain and userId from App Group on sign-out
    static func clearTokenFromAppGroup() {
        // Remove from Keychain
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccountKey,
            kSecAttrAccessGroup as String: keychainAccessGroup,
        ]
        SecItemDelete(query as CFDictionary)

        // Remove userId from App Group
        guard let defaults = sharedDefaults else { return }
        defaults.removeObject(forKey: "accessToken") // Clean up old UserDefaults token if present
        defaults.removeObject(forKey: "userId")
    }

    // MARK: - Errors

    enum AuthError: LocalizedError {
        case missingToken
        case invalidPhone
        case invalidOTP

        var errorDescription: String? {
            switch self {
            case .missingToken:
                return "Could not complete sign-in. Please try again."
            case .invalidPhone:
                return "Please enter a valid phone number."
            case .invalidOTP:
                return "Invalid verification code. Please try again."
            }
        }
    }
}
