import SwiftUI

struct ActivityScreen: View {
    @Environment(WatchViewModel.self) private var viewModel
    @State private var selectedFilter: ActivityFilter = .all

    enum ActivityFilter: String, CaseIterable {
        case all = "All"
        case triggered = "Triggered"
        case actions = "Actions"
        case errors = "Errors"

        func matches(_ activity: ActivityItem) -> Bool {
            switch self {
            case .all: return true
            case .triggered: return activity.icon == "bell.fill" || activity.label.contains("triggered")
            case .actions: return activity.icon == "checkmark" || activity.label.contains("Action")
            case .errors: return activity.iconColorName == "gold" || activity.label.contains("attention")
            }
        }
    }

    private var filteredActivities: [ActivityItem] {
        let filtered = viewModel.activities.filter { selectedFilter.matches($0) }
        return filtered
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Activity")
                            .font(Theme.serif(22, weight: .bold))
                            .foregroundStyle(Theme.ink)

                        Text("Everything Steward has handled for you")
                            .font(Theme.body(13))
                            .foregroundStyle(Theme.inkLight)
                    }

                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.top, 20)
                .padding(.bottom, 16)

                // Filter chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(ActivityFilter.allCases, id: \.self) { filter in
                            Button {
                                withAnimation(.spring(response: 0.3)) { selectedFilter = filter }
                            } label: {
                                Text(filter.rawValue)
                                    .font(Theme.body(12, weight: .semibold))
                                    .foregroundStyle(selectedFilter == filter ? .white : Theme.inkMid)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 7)
                                    .background(selectedFilter == filter ? Theme.accent : Theme.bgCard)
                                    .clipShape(Capsule())
                                    .overlay(
                                        Capsule()
                                            .stroke(selectedFilter == filter ? Color.clear : Theme.border, lineWidth: 1)
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 24)
                }
                .padding(.bottom, 16)

                // Summary stats
                if !viewModel.activities.isEmpty {
                    activitySummaryCard
                }

                if filteredActivities.isEmpty {
                    emptyState
                } else {
                    timeline
                }
            }
        }
        .background(Theme.bg)
    }

    // MARK: - Summary Card

    /// Formats minutes into a readable time string
    private func formatTimeSaved(_ minutes: Int) -> String {
        if minutes < 60 {
            return "\(minutes) min"
        } else {
            let hours: Int = minutes / 60
            let mins: Int = minutes % 60
            return mins > 0 ? "\(hours)h \(mins)m" : "\(hours)h"
        }
    }

    private var activitySummaryCard: some View {
        let triggered = viewModel.activities.filter { $0.icon == "bell.fill" || $0.label.contains("triggered") }.count
        let actionsCompleted = viewModel.activities.filter { $0.icon == "checkmark" }.count
        let checks: Int = viewModel.weeklyCheckCount
        let potentialSavings: Double = viewModel.savingsCalculation.totalSavings
        // 1 min per check: open site (~15s) + load (~10s) + find info (~20s) + note (~15s)
        let minutesSaved: Int = checks

        return VStack(spacing: 14) {
            // Headline
            HStack(spacing: 8) {
                Image(systemName: "sparkles")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.accent)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Steward's Work (Last 7 Days)")
                        .font(Theme.body(14, weight: .bold))
                        .foregroundStyle(Theme.ink)

                    if checks > 0 {
                        Text("\(checks) follow-up checks · ~\(formatTimeSaved(minutesSaved)) of browsing saved")
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                    }
                }

                Spacer()
            }

            // Stats grid
            HStack(spacing: 0) {
                statItem(value: "\(checks)", label: "Checks", icon: "arrow.clockwise", color: Theme.accent)
                statDivider
                if minutesSaved > 0 {
                    statItem(value: "~\(formatTimeSaved(minutesSaved))", label: "Time saved", icon: "clock", color: Theme.accent)
                    statDivider
                }
                statItem(value: "\(triggered)", label: "Triggers", icon: "bell.fill", color: Theme.gold)
                statDivider
                statItem(value: "\(actionsCompleted)", label: "Actions", icon: "checkmark", color: Theme.green)
            }

            // Potential savings callout
            if potentialSavings > 0 {
                HStack(spacing: 8) {
                    Image(systemName: "tag.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.green)

                    Text("Potential savings found: \(Theme.formatPrice(potentialSavings))")
                        .font(Theme.body(12, weight: .semibold))
                        .foregroundStyle(Theme.green)

                    Spacer()
                }
                .padding(10)
                .background(Theme.greenLight)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }

            // Contextual summary
            if triggered > 0 || actionsCompleted > 0 {
                HStack(spacing: 6) {
                    Image(systemName: "info.circle")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.inkLight)

                    let summaryParts: [String] = [
                        triggered > 0 ? "\(triggered) watch\(triggered == 1 ? "" : "es") triggered" : nil,
                        actionsCompleted > 0 ? "\(actionsCompleted) action\(actionsCompleted == 1 ? "" : "s") completed" : nil,
                    ].compactMap { $0 }

                    Text(summaryParts.joined(separator: " · "))
                        .font(Theme.body(11))
                        .foregroundStyle(Theme.inkLight)

                    Spacer()
                }
            }
        }
        .padding(16)
        .background(Theme.bgCard)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Theme.border, lineWidth: 1)
        )
        .padding(.horizontal, 24)
        .padding(.bottom, 16)
    }

    private func statItem(value: String, label: String, icon: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 12))
                .foregroundStyle(color)

            Text(value)
                .font(Theme.body(16, weight: .bold))
                .foregroundStyle(Theme.ink)

            Text(label)
                .font(Theme.body(10))
                .foregroundStyle(Theme.inkLight)
        }
        .frame(maxWidth: .infinity)
    }

    private var statDivider: some View {
        Rectangle()
            .fill(Theme.border)
            .frame(width: 1, height: 36)
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
            ForEach(Array(filteredActivities.enumerated()), id: \.element.id) { index, activity in
                HStack(alignment: .top, spacing: 14) {
                    // Icon + line
                    VStack(spacing: 0) {
                        activityIcon(for: activity)

                        if index < filteredActivities.count - 1 {
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
