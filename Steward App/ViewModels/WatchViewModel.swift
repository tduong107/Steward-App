import Foundation
import SwiftUI
import Observation

enum ActionState {
    case idle
    case running
    case done
}

@Observable
@MainActor
final class WatchViewModel {
    var watches: [Watch] = Watch.samples
    var activities: [ActivityItem] = ActivityItem.samples

    // Navigation
    var selectedTab: Tab = .home
    var selectedWatch: Watch?
    var showDetail = false

    // Chat
    var isChatOpen = false

    // Action modal
    var actionModalWatch: Watch?
    var actionState: ActionState = .idle

    enum Tab: String, CaseIterable {
        case home = "Watches"
        case activity = "Activity"
        case settings = "Settings"

        var icon: String {
            switch self {
            case .home: return "square.grid.2x2"
            case .activity: return "bolt"
            case .settings: return "gearshape"
            }
        }
    }

    // MARK: - Watch Management

    var triggeredWatches: [Watch] {
        watches.filter { $0.triggered }
    }

    func addWatch(_ watch: Watch) {
        withAnimation(.spring(response: 0.4)) {
            watches.append(watch)
        }
    }

    func removeWatch(_ watch: Watch) {
        withAnimation(.spring(response: 0.3)) {
            watches.removeAll { $0.id == watch.id }
        }
    }

    func openDetail(for watch: Watch) {
        selectedWatch = watch
        showDetail = true
    }

    // MARK: - Action

    func presentAction(for watch: Watch) {
        actionModalWatch = watch
        actionState = .idle
    }

    func runAction() {
        actionState = .running
        Task {
            try? await Task.sleep(for: .seconds(2.4))
            withAnimation(.spring(response: 0.4)) {
                actionState = .done
            }
            // Mark the watch as handled
            if let watch = actionModalWatch,
               let index = watches.firstIndex(where: { $0.id == watch.id }) {
                let activity = ActivityItem(
                    icon: "checkmark",
                    iconColor: Theme.accent,
                    label: watch.actionLabel,
                    subtitle: "\(watch.name) · AI acted",
                    time: "Just now"
                )
                watches[index].triggered = false
                watches[index].status = .watching
                activities.insert(activity, at: 0)
            }
        }
    }

    func dismissAction() {
        actionModalWatch = nil
        actionState = .idle
    }
}
