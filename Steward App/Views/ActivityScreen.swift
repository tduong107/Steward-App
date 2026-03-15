import SwiftUI

struct ActivityScreen: View {
    @Environment(WatchViewModel.self) private var viewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text("Activity")
                        .font(Theme.serif(22, weight: .bold))
                        .foregroundStyle(Theme.ink)

                    Text("Everything Steward has handled for you")
                        .font(Theme.body(13))
                        .foregroundStyle(Theme.inkLight)
                }
                .padding(.horizontal, 24)
                .padding(.top, 20)
                .padding(.bottom, 24)

                if viewModel.activities.isEmpty {
                    emptyState
                } else {
                    timeline
                }
            }
        }
        .background(Theme.bg)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "bolt.slash")
                .font(.system(size: 36))
                .foregroundStyle(Theme.inkLight)

            VStack(spacing: 6) {
                Text("No activity yet")
                    .font(Theme.serif(17, weight: .semibold))
                    .foregroundStyle(Theme.ink)

                Text("When Steward acts on your behalf,\nyou'll see a timeline of everything here.")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkLight)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }

    // MARK: - Timeline

    private var timeline: some View {
        VStack(spacing: 0) {
            ForEach(Array(viewModel.activities.enumerated()), id: \.element.id) { index, activity in
                HStack(alignment: .top, spacing: 14) {
                    // Icon + line
                    VStack(spacing: 0) {
                        activityIcon(for: activity)

                        if index < viewModel.activities.count - 1 {
                            Rectangle()
                                .fill(Theme.border)
                                .frame(width: 1)
                                .frame(maxHeight: .infinity)
                                .padding(.top, 8)
                        }
                    }
                    .frame(width: 34)

                    // Content
                    VStack(alignment: .leading, spacing: 2) {
                        Text(activity.label)
                            .font(Theme.body(13, weight: .semibold))
                            .foregroundStyle(Theme.ink)

                        Text(activity.subtitle)
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)

                        Text(activity.time)
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                            .padding(.top, 2)
                    }
                    .padding(.top, 6)
                    .padding(.bottom, 20)

                    Spacer()
                }
            }
        }
        .padding(.horizontal, 24)
    }

    private func activityIcon(for activity: ActivityItem) -> some View {
        let bgColor: Color = {
            switch activity.iconColorName {
            case "accent": return Theme.accentLight
            case "blue": return Theme.blueLight
            default: return Theme.bgDeep
            }
        }()

        return Image(systemName: activity.icon)
            .font(.system(size: 14))
            .foregroundStyle(activity.iconColor)
            .frame(width: 34, height: 34)
            .background(bgColor)
            .clipShape(Circle())
            .overlay(
                Circle()
                    .stroke(activity.iconColor.opacity(0.2), lineWidth: 1)
            )
    }
}
