import SwiftUI
import AuthenticationServices

struct AuthScreen: View {
    @Environment(AuthManager.self) private var authManager

    // Colors matching the splash / icon
    private let bgTop = Color(red: 0.141, green: 0.239, blue: 0.188)
    private let bgBottom = Color(red: 0.059, green: 0.125, blue: 0.094)
    private let mint = Color(red: 0.431, green: 0.906, blue: 0.718)

    @State private var logoScale: CGFloat = 0.8
    @State private var logoOpacity: Double = 0
    @State private var contentOpacity: Double = 0

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [bgTop, bgBottom],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            // Concentric rings
            Circle()
                .stroke(mint.opacity(0.04), lineWidth: 1)
                .frame(width: 376, height: 376)

            Circle()
                .stroke(mint.opacity(0.05), lineWidth: 1)
                .frame(width: 296, height: 296)

            VStack(spacing: 0) {
                Spacer()

                // Logo
                StewardLogo(size: 100)
                    .scaleEffect(logoScale)
                    .opacity(logoOpacity)

                Spacer().frame(height: 28)

                // Title
                Text("STEWARD")
                    .font(.system(size: 26, weight: .regular, design: .serif))
                    .tracking(9)
                    .foregroundStyle(.white.opacity(0.95))
                    .opacity(contentOpacity)

                Spacer().frame(height: 10)

                Text("Your personal AI concierge")
                    .font(.system(size: 14, weight: .regular, design: .serif))
                    .foregroundStyle(mint.opacity(0.5))
                    .opacity(contentOpacity)

                Spacer()

                // Sign-in section
                VStack(spacing: 16) {
                    SignInWithAppleButton(.signIn) { request in
                        request.requestedScopes = [.fullName, .email]
                    } onCompletion: { result in
                        handleAppleSignIn(result)
                    }
                    .signInWithAppleButtonStyle(.white)
                    .frame(height: 52)
                    .clipShape(RoundedRectangle(cornerRadius: 14))

                    // Error message
                    if let error = authManager.errorMessage {
                        Text(error)
                            .font(.system(size: 12))
                            .foregroundStyle(.red.opacity(0.8))
                            .multilineTextAlignment(.center)
                    }

                    Text("By signing in, you agree to our [\(Text("Terms of Service").underline())](https://steward.app/terms) and [\(Text("Privacy Policy").underline())](https://steward.app/privacy).")
                        .font(.system(size: 11, weight: .regular))
                        .foregroundStyle(mint.opacity(0.35))
                        .tint(mint.opacity(0.6))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 20)
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 50)
                .opacity(contentOpacity)
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.5)) {
                logoScale = 1.0
                logoOpacity = 1.0
            }
            withAnimation(.easeOut(duration: 0.5).delay(0.25)) {
                contentOpacity = 1.0
            }
        }
    }

    // MARK: - Handle Sign-In

    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
                authManager.errorMessage = "Unexpected credential type."
                return
            }
            Task {
                do {
                    try await authManager.signInWithApple(credential: credential)
                } catch {
                    authManager.errorMessage = error.localizedDescription
                }
            }

        case .failure(let error):
            // ASAuthorizationError.canceled means user dismissed the dialog -- not an error
            if (error as? ASAuthorizationError)?.code == .canceled { return }
            authManager.errorMessage = error.localizedDescription
        }
    }
}
