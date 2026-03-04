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

                // Timeline
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
        }
        .background(Theme.bg)
    }

    private func activityIcon(for activity: ActivityItem) -> some View {
        let bgColor: Color = {
            if activity.iconColor == Theme.accent { return Theme.accentLight }
            if activity.iconColor == Theme.blue { return Theme.blueLight }
            return Theme.bgDeep
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
