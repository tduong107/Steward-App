import SwiftUI

struct HomeScreen: View {
    @Environment(WatchViewModel.self) private var viewModel
    @Environment(SubscriptionManager.self) private var subscriptionManager

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                headerSection
                chatPromptBar
                triggeredAlerts
                priceInsightsCard

                if viewModel.watches.isEmpty {
                    emptyState
                } else {
                    watchList
                }

                addWatchCard
            }
            .padding(.bottom, 24)
        }
        .background(Theme.bg)
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    StewardLogo(size: 30)

                    Text("Steward")
                        .font(Theme.serif(22, weight: .bold))
                        .foregroundStyle(Theme.ink)
                }

                Text("Your personal AI concierge")
                    .font(Theme.body(12))
                    .foregroundStyle(Theme.inkLight)
            }

            Spacer()

            Button(action: { viewModel.selectedTab = .activity }) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: "bell")
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.ink)
                        .frame(width: 38, height: 38)
                        .background(Theme.bgCard)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Theme.border, lineWidth: 1)
                        )
                        .shadow(color: .black.opacity(0.04), radius: 8, y: 4)

                    // Badge for triggered watches
                    if !viewModel.triggeredWatches.isEmpty {
                        Text("\(viewModel.triggeredWatches.count)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(width: 18, height: 18)
                            .background(Theme.red)
                            .clipShape(Circle())
                            .offset(x: 4, y: -4)
                    }
                }
            }
            .accessibilityLabel("Notifications")
        }
        .padding(.horizontal, 24)
        .padding(.top, 20)
    }

    // MARK: - Chat Prompt Bar

    private var chatPromptBar: some View {
        Button {
            viewModel.isChatOpen = true
        } label: {
            HStack(spacing: 10) {
                StewardLogo(size: 30)

                Text("Ask Steward to watch something…")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkMid)

                Spacer()

                Image(systemName: "arrow.up.right")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.accentMid)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Theme.accentMid, lineWidth: 1.5)
            )
            .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 24)
        .padding(.top, 16)
        .padding(.bottom, 20)
    }

    // MARK: - Triggered Alerts

    @ViewBuilder
    private var triggeredAlerts: some View {
        if !viewModel.triggeredWatches.isEmpty {
            VStack(spacing: 10) {
                ForEach(viewModel.triggeredWatches) { watch in
                    TriggeredAlertCard(watch: watch) {
                        viewModel.openDetail(for: watch)
                    }
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
        }
    }

    // MARK: - Price Insights Card

    /// Price-related watches for the insights card
    private var priceWatches: [Watch] {
        viewModel.watches.filter { watch in
            watch.actionType == .price ||
            watch.condition.lowercased().contains("price") ||
            watch.actionLabel.lowercased().contains("price")
        }
    }

    @ViewBuilder
    private var priceInsightsCard: some View {
        if !priceWatches.isEmpty {
            if subscriptionManager.currentTier.hasPriceInsights {
                // Unlocked — full access
                Button {
                    viewModel.showPriceInsights = true
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "chart.line.downtrend.xyaxis")
                            .font(.system(size: 16))
                            .foregroundStyle(Theme.accent)
                            .frame(width: 36, height: 36)
                            .background(Theme.accentLight)
                            .clipShape(RoundedRectangle(cornerRadius: 10))

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Price Insights")
                                .font(Theme.body(13, weight: .semibold))
                                .foregroundStyle(Theme.ink)

                            Text("Tracking \(priceWatches.count) price\(priceWatches.count == 1 ? "" : "s") · Tap to see deals")
                                .font(Theme.body(11))
                                .foregroundStyle(Theme.inkLight)
                        }

                        Spacer()

                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Theme.accentMid)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(Theme.bgCard)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Theme.accentMid, lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 24)
                .padding(.bottom, 16)
            } else {
                // Locked — teaser card
                Button {
                    subscriptionManager.presentPaywall(highlighting: .pro)
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "chart.line.downtrend.xyaxis")
                            .font(.system(size: 16))
                            .foregroundStyle(Theme.inkLight)
                            .frame(width: 36, height: 36)
                            .background(Theme.bgDeep)
                            .clipShape(RoundedRectangle(cornerRadius: 10))

                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Text("Price Insights")
                                    .font(Theme.body(13, weight: .semibold))
                                    .foregroundStyle(Theme.inkMid)

                                Image(systemName: "lock.fill")
                                    .font(.system(size: 10))
                                    .foregroundStyle(Theme.inkLight)
                            }

                            Text("Upgrade to Pro to see deals & price trends")
                                .font(Theme.body(11))
                                .foregroundStyle(Theme.inkLight)
                        }

                        Spacer()

                        Text("PRO")
                            .font(Theme.body(10, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Theme.accent)
                            .clipShape(Capsule())
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(Theme.bgCard)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Theme.border, lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 24)
                .padding(.bottom, 16)
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "eye.slash")
                .font(.system(size: 36))
                .foregroundStyle(Theme.inkLight)

            VStack(spacing: 6) {
                Text("No watches yet")
                    .font(Theme.serif(17, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Text("Tell Steward what to monitor and it'll\nwatch the web for you around the clock.")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkLight)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .padding(.horizontal, 24)
    }

    // MARK: - Watch List

    private var watchList: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Active Watches")
                    .font(Theme.serif(16, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Spacer()

                if subscriptionManager.currentTier.maxWatches < Int.max {
                    Text("\(viewModel.watches.count)/\(subscriptionManager.currentTier.maxWatches) watches")
                        .font(Theme.body(12))
                        .foregroundStyle(Theme.inkLight)
                } else {
                    Text("\(viewModel.watches.count) watching")
                        .font(Theme.body(12))
                        .foregroundStyle(Theme.inkLight)
                }
            }

            VStack(spacing: 10) {
                ForEach(viewModel.watches) { watch in
                    SwipeToDelete {
                        withAnimation(.spring(response: 0.3)) {
                            viewModel.removeWatch(watch)
                        }
                    } content: {
                        WatchCard(watch: watch) {
                            viewModel.openDetail(for: watch)
                        }
                        .contextMenu {
                            Button(role: .destructive) {
                                viewModel.removeWatch(watch)
                            } label: {
                                Label("Delete Watch", systemImage: "trash")
                            }
                        }
                    }
                    .transition(.asymmetric(
                        insertion: .move(edge: .bottom).combined(with: .opacity),
                        removal: .opacity
                    ))
                }
            }
        }
        .padding(.horizontal, 24)
    }

    // MARK: - Add Watch Card

    private var addWatchCard: some View {
        Button {
            viewModel.isChatOpen = true
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "plus")
                    .font(.system(size: 18))
                    .foregroundStyle(Theme.inkLight)
                    .frame(width: 40, height: 40)
                    .background(Theme.bgDeep)
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                Text("Add a new watch via Steward AI")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkLight)

                Spacer()
            }
            .padding(16)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.radiusLg)
                    .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [8, 6]))
                    .foregroundStyle(Theme.borderMid)
            )
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 24)
        .padding(.top, 10)
        .accessibilityLabel("Add a new watch")
    }
}

// MARK: - Triggered Alert Card

private struct TriggeredAlertCard: View {
    let watch: Watch
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 10) {
                // Badge
                HStack(spacing: 6) {
                    Circle()
                        .fill(.white)
                        .frame(width: 5, height: 5)
                        .modifier(PulseModifier())

                    Text("STEWARD READY TO ACT")
                        .font(Theme.body(11, weight: .semibold))
                        .foregroundStyle(.white)
                        .tracking(0.3)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 3)
                .background(Theme.accent)
                .clipShape(RoundedRectangle(cornerRadius: 6))

                // Content row
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(watch.emoji) \(watch.name)")
                            .font(Theme.body(14, weight: .semibold))
                            .foregroundStyle(Theme.ink)

                        Text(watch.changeNote ?? "")
                            .font(Theme.body(12))
                            .foregroundStyle(Theme.accent)
                    }

                    Spacer()

                    Text("Review →")
                        .font(Theme.body(12, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(Theme.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Theme.accentLight)
            .clipShape(RoundedRectangle(cornerRadius: Theme.radiusLg))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.radiusLg)
                    .stroke(Theme.accentMid, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Review triggered watch: \(watch.name)")
    }
}
