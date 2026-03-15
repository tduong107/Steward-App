import SwiftUI
import SwiftData

struct RootView: View {
    @Environment(AuthManager.self) private var authManager
    @AppStorage("hasSeenOnboardingA") private var hasSeenOnboardingA = false
    @AppStorage("hasSeenOnboardingB") private var hasSeenOnboardingB = false

    var body: some View {
        Group {
            if authManager.isLoading {
                SplashScreen()
            } else if !hasSeenOnboardingA && !authManager.isAuthenticated {
                // Flow A: First time opening the app (not signed in)
                OnboardingFlowA {
                    withAnimation(.easeInOut(duration: 0.4)) {
                        hasSeenOnboardingA = true
                    }
                }
                .transition(.opacity)
            } else if authManager.isAuthenticated && !hasSeenOnboardingB {
                // Flow B: First time signing in
                OnboardingFlowB {
                    withAnimation(.easeInOut(duration: 0.4)) {
                        hasSeenOnboardingB = true
                    }
                }
                .transition(.opacity)
            } else if authManager.isAuthenticated {
                ContentView()
            } else {
                AuthScreen()
            }
        }
        .animation(.easeInOut(duration: 0.4), value: authManager.isAuthenticated)
        .animation(.easeInOut(duration: 0.3), value: authManager.isLoading)
        .animation(.easeInOut(duration: 0.4), value: hasSeenOnboardingA)
        .animation(.easeInOut(duration: 0.4), value: hasSeenOnboardingB)
        .task {
            await authManager.initialize()
        }
    }
}
