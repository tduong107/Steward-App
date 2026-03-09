import Foundation
import Observation
import Supabase
import AuthenticationServices

@Observable
@MainActor
final class AuthManager {
    var isAuthenticated = false
    var isLoading = true
    var currentUserId: UUID?
    var displayName: String?
    var phoneNumber: String?
    var errorMessage: String?

    // Shared App Group suite for communicating with the Share Extension
    private static let sharedDefaults = UserDefaults(suiteName: "group.Steward.Steward-App")

    // MARK: - Initialize (check existing session)

    func initialize() async {
        do {
            let session = try await SupabaseConfig.client.auth.session
            self.currentUserId = session.user.id
            self.isAuthenticated = true

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
            }
        } catch {
            self.isAuthenticated = false
            Self.clearTokenFromAppGroup()
        }
        self.isLoading = false
    }

    // MARK: - Phone + Password Sign Up

    /// Creates a new account with phone number and password.
    /// After sign-up, an OTP code is sent to the phone for verification.
    func signUp(phone: String, password: String, name: String) async throws {
        errorMessage = nil

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
        Self.clearTokenFromAppGroup()
    }

    // MARK: - Profile Helpers

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

    // MARK: - App Group Token Sync (for Share Extension)

    /// Writes the current auth token to shared App Group storage
    static func syncTokenToAppGroup(accessToken: String, userId: UUID) {
        guard let defaults = sharedDefaults else { return }
        defaults.set(accessToken, forKey: "accessToken")
        defaults.set(userId.uuidString, forKey: "userId")
    }

    /// Removes auth token from App Group on sign-out
    static func clearTokenFromAppGroup() {
        guard let defaults = sharedDefaults else { return }
        defaults.removeObject(forKey: "accessToken")
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
