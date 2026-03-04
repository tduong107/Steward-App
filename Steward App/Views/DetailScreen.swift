import SwiftUI

struct DetailScreen: View {
    let watch: Watch
    @Environment(WatchViewModel.self) private var viewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                headerCard
                detailContent
            }
        }
        .background(Theme.bg)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button {
                    dismiss()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 14, weight: .medium))
                        Text("Back")
                            .font(Theme.body(13))
                    }
                    .foregroundStyle(Theme.inkMid)
                }
            }
        }
    }

    // MARK: - Header Card

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 14) {
                Text(watch.emoji)
                    .font(.system(size: 26))
                    .frame(width: 56, height: 56)
                    .background(Theme.bgDeep)
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                VStack(alignment: .leading, spacing: 2) {
                    Text(watch.name)
                        .font(Theme.serif(18, weight: .bold))
                        .foregroundStyle(Theme.ink)

                    Text(watch.url)
                        .font(Theme.body(12))
                        .foregroundStyle(Theme.inkLight)
                }
            }

            // Status pill
            HStack(spacing: 6) {
                Circle()
                    .fill(watch.triggered ? Theme.accent : Theme.inkLight)
                    .frame(width: 6, height: 6)
                    .modifier(PulseModifier(enabled: watch.triggered))

                Text(watch.triggered ? "Change detected · Ready to act" : "Watching · \(watch.lastSeen)")
                    .font(Theme.body(12, weight: .semibold))
                    .foregroundStyle(watch.triggered ? Theme.accent : Theme.inkMid)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 6)
            .background(watch.triggered ? Theme.accentLight : Theme.bgDeep)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(watch.triggered ? Theme.accentMid : Theme.border, lineWidth: 1)
            )
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 24)
        .padding(.vertical, 20)
        .background(Theme.bgCard)
        .overlay(alignment: .bottom) {
            Divider().foregroundStyle(Theme.border)
        }
    }

    // MARK: - Detail Content

    private var detailContent: some View {
        VStack(spacing: 8) {
            // Change banner
            if watch.triggered {
                changeBanner
            }

            DetailRow(icon: "🎯", label: "Watching for", value: watch.condition)
            DetailRow(icon: "⚡", label: "AI will", value: watch.actionLabel, highlight: watch.triggered)
            DetailRow(icon: "⏱", label: "Check frequency", value: watch.checkFrequency)
            DetailRow(icon: "🔔", label: "Notify via", value: "Push notification · Email")

            actionButton
            recentChecks
        }
        .padding(.horizontal, 24)
        .padding(.top, 16)
        .padding(.bottom, 24)
    }

    // MARK: - Change Banner

    private var changeBanner: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("DETECTED CHANGE")
                .font(Theme.body(11, weight: .bold))
                .foregroundStyle(Theme.accent)
                .tracking(0.5)

            Text("📉 \(watch.changeNote ?? "")")
                .font(Theme.body(15, weight: .semibold))
                .foregroundStyle(Theme.ink)

            Text("Your condition was met · Steward can act now")
                .font(Theme.body(12))
                .foregroundStyle(Theme.inkMid)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Theme.accentLight)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Theme.accentMid, lineWidth: 1)
        )
        .padding(.bottom, 6)
    }

    // MARK: - Action Button

    private var actionButton: some View {
        Button {
            if watch.triggered {
                viewModel.presentAction(for: watch)
            }
        } label: {
            HStack {
                if watch.triggered {
                    Image(systemName: "sparkle")
                        .font(.system(size: 14))
                }
                Text(watch.triggered ? "Let Steward Act Now" : "⏳ Waiting for trigger…")
                    .font(Theme.body(15, weight: .bold))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(watch.triggered ? Theme.accent : Theme.bgDeep)
            .foregroundStyle(watch.triggered ? .white : Theme.inkLight)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(watch.triggered ? Color.clear : Theme.border, lineWidth: 1)
            )
            .shadow(color: watch.triggered ? Theme.accent.opacity(0.25) : .clear, radius: 12, y: 4)
        }
        .disabled(!watch.triggered)
        .padding(.top, 8)
        .accessibilityLabel(watch.triggered ? "Let Steward act now" : "Waiting for trigger")
    }

    // MARK: - Recent Checks

    private var recentChecks: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Checks")
                .font(Theme.serif(15, weight: .semibold))
                .foregroundStyle(Theme.ink)
                .padding(.top, 8)

            VStack(spacing: 0) {
                ForEach(checkHistory.indices, id: \.self) { i in
                    let check = checkHistory[i]
                    HStack {
                        Text(check.time)
                            .font(Theme.body(12))
                            .foregroundStyle(Theme.inkMid)

                        Spacer()

                        Text(check.note)
                            .font(Theme.body(12, weight: check.changed ? .semibold : .regular))
                            .foregroundStyle(check.changed ? Theme.accent : Theme.inkLight)
                    }
                    .padding(.vertical, 11)

                    if i < checkHistory.count - 1 {
                        Divider().foregroundStyle(Theme.border)
                    }
                }
            }
        }
    }

    private var checkHistory: [(time: String, note: String, changed: Bool)] {
        [
            (time: "Just now", note: watch.triggered ? (watch.changeNote ?? "Change detected") : "No change", changed: watch.triggered),
            (time: "5 min ago", note: "No change", changed: false),
            (time: "10 min ago", note: "No change", changed: false),
            (time: "15 min ago", note: "No change", changed: false),
        ]
    }
}
