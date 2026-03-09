import SwiftUI
import SwiftData

struct RootView: View {
    @Environment(AuthManager.self) private var authManager

    var body: some View {
        Group {
            if authManager.isLoading {
                SplashScreen()
            } else if authManager.isAuthenticated {
                ContentView()
            } else {
                AuthScreen()
            }
        }
        .animation(.easeInOut(duration: 0.4), value: authManager.isAuthenticated)
        .animation(.easeInOut(duration: 0.3), value: authManager.isLoading)
        .task {
            await authManager.initialize()
        }
    }
}
