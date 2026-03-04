import SwiftUI

struct HomeScreen: View {
    @Environment(WatchViewModel.self) private var viewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                headerSection
                chatPromptBar
                triggeredAlerts
                watchList
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
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Theme.accent)
                        .frame(width: 26, height: 26)
                        .overlay(
                            Text("S")
                                .font(.system(size: 14, weight: .bold, design: .serif))
                                .italic()
                                .foregroundStyle(.white)
                        )

                    Text("Steward")
                        .font(Theme.serif(22, weight: .bold))
                        .foregroundStyle(Theme.ink)
                }

                Text("Your personal AI concierge")
                    .font(Theme.body(12))
                    .foregroundStyle(Theme.inkLight)
            }

            Spacer()

            Button(action: {}) {
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
                Image(systemName: "sparkle")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.accent)
                    .frame(width: 30, height: 30)
                    .background(Theme.accentLight)
                    .clipShape(RoundedRectangle(cornerRadius: 9))
                    .overlay(
                        RoundedRectangle(cornerRadius: 9)
                            .stroke(Theme.accentMid, lineWidth: 1)
                    )

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

    // MARK: - Watch List

    private var watchList: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Active Watches")
                    .font(Theme.serif(16, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Spacer()

                Text("\(viewModel.watches.count) watching")
                    .font(Theme.body(12))
                    .foregroundStyle(Theme.inkLight)
            }

            VStack(spacing: 10) {
                ForEach(viewModel.watches) { watch in
                    WatchCard(watch: watch) {
                        viewModel.openDetail(for: watch)
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
