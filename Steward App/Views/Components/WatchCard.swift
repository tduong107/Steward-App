import SwiftUI

struct WatchCard: View {
    let watch: Watch
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Product image or emoji fallback
                ZStack(alignment: .topTrailing) {
                    if let imageURL = watch.imageURL, let url = URL(string: imageURL) {
                        AsyncImage(url: url) { phase in
                            switch phase {
                            case .success(let image):
                                image
                                    .resizable()
                                    .scaledToFill()
                            case .failure:
                                Text(watch.emoji)
                                    .font(.system(size: 20))
                            default:
                                ProgressView()
                                    .controlSize(.small)
                            }
                        }
                        .frame(width: 44, height: 44)
                        .background(Theme.bgDeep)
                        .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd))
                    } else {
                        Text(watch.emoji)
                            .font(.system(size: 20))
                            .frame(width: 44, height: 44)
                            .background(Theme.bgDeep)
                            .clipShape(RoundedRectangle(cornerRadius: Theme.radiusMd))
                    }

                    if watch.triggered {
                        Circle()
                            .fill(Theme.accent)
                            .frame(width: 10, height: 10)
                            .overlay(
                                Circle().stroke(Theme.bgCard, lineWidth: 2)
                            )
                            .offset(x: 3, y: -3)
                            .modifier(PulseModifier(enabled: true))
                    } else if watch.needsAttention {
                        Circle()
                            .fill(Theme.gold)
                            .frame(width: 10, height: 10)
                            .overlay(
                                Circle().stroke(Theme.bgCard, lineWidth: 2)
                            )
                            .offset(x: 3, y: -3)
                    } else if watch.hasExpiredDate {
                        Circle()
                            .fill(.orange)
                            .frame(width: 10, height: 10)
                            .overlay(
                                Circle().stroke(Theme.bgCard, lineWidth: 2)
                            )
                            .offset(x: 3, y: -3)
                    }
                }

                // Text content
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(watch.name)
                            .font(Theme.body(14, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                            .lineLimit(1)

                        Spacer()

                        // Next check countdown
                        HStack(spacing: 3) {
                            Image(systemName: "clock")
                                .font(.system(size: 9))
                            Text(watch.nextCheckCountdown)
                                .font(Theme.body(10))
                        }
                        .foregroundStyle(Theme.inkLight)
                    }

                    if watch.watchMode == "search" {
                        HStack(spacing: 4) {
                            Image(systemName: "magnifyingglass")
                                .font(.system(size: 9))
                            Text(L10n.t("watch.tracking_stores"))
                                .lineLimit(1)
                        }
                        .font(Theme.body(11))
                        .foregroundStyle(Theme.accentMid)
                    } else {
                        Text(watch.url)
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.inkLight)
                            .lineLimit(1)
                            .truncationMode(.tail)
                    }

                    HStack(spacing: 5) {
                        Circle()
                            .fill(watch.triggered ? Theme.accent : watch.needsAttention ? Theme.gold : Theme.borderMid)
                            .frame(width: 5, height: 5)
                            .modifier(PulseModifier(enabled: watch.triggered))

                        if watch.triggered {
                            Image(systemName: "sparkle")
                                .font(.system(size: 9))
                                .foregroundStyle(Theme.accent)

                            Text(watch.changeNote ?? "Change detected!")
                                .font(Theme.body(11, weight: .semibold))
                                .foregroundStyle(Theme.accent)
                                .lineLimit(1)
                        } else if watch.needsAttention {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.system(size: 9))
                                .foregroundStyle(Theme.gold)

                            Text(watch.lastError ?? "Needs attention")
                                .font(Theme.body(11, weight: .medium))
                                .foregroundStyle(Theme.gold)
                                .lineLimit(1)
                        } else {
                            Text(watch.condition)
                                .font(Theme.body(11))
                                .foregroundStyle(Theme.inkLight)
                                .lineLimit(1)
                        }
                    }
                    .padding(.top, 4)
                }

                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Theme.borderMid)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: Theme.radiusLg))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.radiusLg)
                    .stroke(watch.triggered ? Theme.accentMid : watch.needsAttention ? Theme.gold.opacity(0.5) : Theme.border, lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Pulse Animation Modifier
struct PulseModifier: ViewModifier {
    var enabled: Bool = true
    @State private var isPulsing = false

    func body(content: Content) -> some View {
        content
            .opacity(enabled && isPulsing ? 0.4 : 1.0)
            .animation(
                enabled ? .easeInOut(duration: 1.2).repeatForever(autoreverses: true) : .default,
                value: isPulsing
            )
            .onAppear {
                if enabled { isPulsing = true }
            }
            .onDisappear {
                isPulsing = false
            }
    }
}
