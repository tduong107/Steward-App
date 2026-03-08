import SwiftUI
import SwiftData

struct ContentView: View {
    @State private var viewModel = WatchViewModel()
    @State private var realtimeManager = RealtimeManager()
    @Environment(\.modelContext) private var modelContext
    @Environment(AuthManager.self) private var authManager
    @Environment(SupabaseService.self) private var supabaseService
    @Environment(SubscriptionManager.self) private var subscriptionManager
    @AppStorage("isDarkMode") private var isDarkMode = true

    // Shared watch deep link
    @State private var sharedWatchData: SharedWatchData?
    @State private var showJoinSheet = false
    @State private var shareCodeError: String?

    var body: some View {
        @Bindable var subscription = subscriptionManager
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
                    .navigationDestination(isPresented: $viewModel.showPriceInsights) {
                        PriceInsightsScreen()
                    }
                }

                CustomTabBar(
                    selectedTab: $viewModel.selectedTab,
                    onChatTap: {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                            viewModel.isChatOpen = true
                        }
                    },
                    onHomeReselect: {
                        if viewModel.showDetail {
                            viewModel.showDetail = false
                            viewModel.selectedWatch = nil
                        }
                        if viewModel.showPriceInsights {
                            viewModel.showPriceInsights = false
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
        .onChange(of: viewModel.selectedTab) { _, _ in
            if viewModel.showDetail {
                viewModel.showDetail = false
                viewModel.selectedWatch = nil
            }
            if viewModel.showPriceInsights {
                viewModel.showPriceInsights = false
            }
        }
        .preferredColorScheme(isDarkMode ? .dark : .light)
        .environment(viewModel)
        .sheet(isPresented: $subscription.showPaywall) {
            PaywallScreen()
        }
        .onAppear {
            viewModel.configure(
                with: modelContext,
                auth: authManager,
                supabase: supabaseService,
                subscription: subscriptionManager
            )

            // Start realtime subscriptions
            if let userId = authManager.currentUserId {
                realtimeManager.start(for: userId, viewModel: viewModel)
            }
        }
        .onDisappear {
            realtimeManager.stop()
        }
        .onReceive(NotificationCenter.default.publisher(for: .didTapWatchNotification)) { notification in
            if let watchId = notification.userInfo?["watch_id"] as? UUID {
                // Switch to home tab first
                viewModel.selectedTab = .home

                // Find the watch by ID and navigate to its detail
                if let watch = viewModel.watches.first(where: { $0.id == watchId }) {
                    viewModel.openDetail(for: watch)
                } else {
                    // Watch not in local cache yet — sync from cloud, then navigate
                    Task {
                        await viewModel.syncFromCloud()
                        if let watch = viewModel.watches.first(where: { $0.id == watchId }) {
                            viewModel.openDetail(for: watch)
                        }
                    }
                }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .didOpenSharedWatch)) { notification in
            if let code = notification.userInfo?["share_code"] as? String {
                Task {
                    do {
                        let data = try await supabaseService.resolveShareCode(code)
                        sharedWatchData = data
                        showJoinSheet = true
                    } catch {
                        shareCodeError = error.localizedDescription
                        #if DEBUG
                        print("[ContentView] Failed to resolve share code: \(error)")
                        #endif
                    }
                }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .didReceiveSharedURL)) { notification in
            if let url = notification.userInfo?["url"] as? String {
                viewModel.selectedTab = .home
                viewModel.pendingChatURL = url
                withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                    viewModel.isChatOpen = true
                }
            }
        }
        .sheet(isPresented: $showJoinSheet) {
            if let data = sharedWatchData {
                JoinWatchSheet(sharedWatch: data) {
                    // Create a Watch from the shared data and add it
                    let watch = data.toWatch()
                    viewModel.addWatch(watch)
                    viewModel.selectedTab = .home
                }
            }
        }
    }
}

#Preview {
    ContentView()
        .modelContainer(for: [Watch.self, ActivityItem.self], inMemory: true)
        .environment(AuthManager())
        .environment(SupabaseService())
        .environment(NotificationManager())
        .environment(SubscriptionManager())
}
