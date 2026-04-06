import SwiftUI
import SwiftData

struct RootView: View {
    @Environment(AuthManager.self) private var authManager
    @AppStorage("hasSeenOnboardingB") private var hasSeenOnboardingB = false
    @State private var authInitialMode: AuthScreen.AuthMode = .signUp
    @State private var showAuth = false

    var body: some View {
        Group {
            if authManager.isLoading {
                SplashScreen()
            } else if !authManager.isAuthenticated && !showAuth {
                // Not logged in — show onboarding (every time, not just first launch)
                OnboardingFlowA { wantsSignIn in
                    authInitialMode = wantsSignIn ? .signIn : .signUp
                    withAnimation(.easeInOut(duration: 0.4)) {
                        showAuth = true
                    }
                }
                .transition(.opacity)
            } else if !authManager.isAuthenticated && showAuth {
                // User tapped sign up/sign in from onboarding
                AuthScreen(initialMode: authInitialMode)
                    .transition(.opacity)
            } else if authManager.isAuthenticated && !hasSeenOnboardingB {
                // First time signing in — show tutorial
                OnboardingFlowB {
                    withAnimation(.easeInOut(duration: 0.4)) {
                        hasSeenOnboardingB = true
                    }
                }
                .transition(.opacity)
            } else {
                ContentView()
            }
        }
        .animation(.easeInOut(duration: 0.4), value: authManager.isAuthenticated)
        .animation(.easeInOut(duration: 0.3), value: authManager.isLoading)
        .animation(.easeInOut(duration: 0.4), value: showAuth)
        .animation(.easeInOut(duration: 0.4), value: hasSeenOnboardingB)
        .onChange(of: authManager.isAuthenticated) { _, isAuth in
            if isAuth {
                // Reset so onboarding shows again on next sign-out
                showAuth = false
            }
        }
        .task {
            await authManager.initialize()
        }
    }
}
