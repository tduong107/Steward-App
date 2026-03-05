import SwiftUI
import SwiftData

struct ContentView: View {
    @State private var viewModel = WatchViewModel()
    @State private var realtimeManager = RealtimeManager()
    @Environment(\.modelContext) private var modelContext
    @Environment(AuthManager.self) private var authManager
    @Environment(SupabaseService.self) private var supabaseService
    @AppStorage("isDarkMode") private var isDarkMode = true

    var body: some View {
        ZStack {
            // Main app content
            VStack(spacing: 0) {
                NavigationStack {
                    Group {
                        switch viewModel.selectedTab {
                        case .home:
                            HomeScreen()
                        case .activity:
                            ActivityScreen()
                        case .settings:
                            SettingsScreen()
                        }
                    }
                    .navigationDestination(isPresented: $viewModel.showDetail) {
                        if let watch = viewModel.selectedWatch {
                            DetailScreen(watch: watch)
                        }
                    }
                }

                CustomTabBar(
                    selectedTab: $viewModel.selectedTab,
                    onChatTap: {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                            viewModel.isChatOpen = true
                        }
                    }
                )
            }

            // Chat drawer overlay
            if viewModel.isChatOpen {
                ChatDrawer(isPresented: $viewModel.isChatOpen)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .zIndex(100)
            }

            // Action modal overlay
            if let watch = viewModel.actionModalWatch {
                ActionModal(watch: watch)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .zIndex(200)
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.85), value: viewModel.isChatOpen)
        .animation(.spring(response: 0.3, dampingFraction: 0.85), value: viewModel.actionModalWatch != nil)
        .preferredColorScheme(isDarkMode ? .dark : .light)
        .environment(viewModel)
        .onAppear {
            viewModel.configure(
                with: modelContext,
                auth: authManager,
                supabase: supabaseService
            )

            // Start realtime subscriptions
            if let userId = authManager.currentUserId {
                realtimeManager.start(for: userId, viewModel: viewModel)
            }
        }
        .onDisappear {
            realtimeManager.stop()
        }
    }
}

#Preview {
    ContentView()
        .modelContainer(for: [Watch.self, ActivityItem.self], inMemory: true)
        .environment(AuthManager())
        .environment(SupabaseService())
        .environment(NotificationManager())
}
