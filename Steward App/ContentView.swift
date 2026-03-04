import SwiftUI

struct ContentView: View {
    @State private var viewModel = WatchViewModel()

    var body: some View {
        ZStack {
            VStack(spacing: 0) {
                // Main content area
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

                // Custom tab bar
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
        .environment(viewModel)
    }
}

#Preview {
    ContentView()
}
