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

            // Fetch display name from profile
            if let profile: ProfileDTO = try? await SupabaseConfig.client
                .from("profiles")
                .select()
                .eq("id", value: session.user.id.uuidString)
                .single()
                .execute()
                .value {
                self.displayName = profile.displayName
            }
        } catch {
            self.isAuthenticated = false
            Self.clearTokenFromAppGroup()
        }
        self.isLoading = false
    }

    // MARK: - Apple Sign-In

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
        Self.clearTokenFromAppGroup()
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

        var errorDescription: String? {
            switch self {
            case .missingToken:
                return "Could not retrieve Apple ID token. Please try again."
            }
        }
    }
}
