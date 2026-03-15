import SwiftUI

struct CustomTabBar: View {
    @Binding var selectedTab: WatchViewModel.Tab
    let onChatTap: () -> Void
    var onHomeReselect: (() -> Void)? = nil

    var body: some View {
        HStack(spacing: 0) {
            // Home tab
            tabButton(for: .home)

            // Savings tab
            tabButton(for: .savings)

            // AI Chat center button
            Button(action: onChatTap) {
                Image(systemName: "sparkle")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 50, height: 50)
                    .background(Theme.accent)
                    .clipShape(Circle())
                    .shadow(color: Theme.accent.opacity(0.35), radius: 12, y: 4)
            }
            .offset(y: -12)
            .accessibilityLabel("Open Steward AI chat")

            // Activity tab
            tabButton(for: .activity)

            // Settings tab
            tabButton(for: .settings)
        }
        .padding(.horizontal, 24)
        .padding(.top, 10)
        .padding(.bottom, 4)
        .background(
            Theme.bgCard
                .shadow(color: .black.opacity(0.05), radius: 8, y: -4)
        )
        .overlay(alignment: .top) {
            Divider().foregroundStyle(Theme.border)
        }
    }

    private func tabButton(for tab: WatchViewModel.Tab) -> some View {
        Button {
            if selectedTab == tab && tab == .home {
                onHomeReselect?()
            }
            withAnimation(.spring(response: 0.3)) {
                selectedTab = tab
            }
        } label: {
            VStack(spacing: 3) {
                Image(systemName: tab.icon)
                    .font(.system(size: 20))
                    .foregroundStyle(selectedTab == tab ? Theme.accent : Theme.inkLight)

                Text(tab.rawValue)
                    .font(Theme.body(10, weight: .semibold))
                    .foregroundStyle(selectedTab == tab ? Theme.accent : Theme.inkLight)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(tab.rawValue)
    }
}
