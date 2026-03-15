import SwiftUI
import UIKit

struct ActionModal: View {
    let watch: Watch
    @Environment(WatchViewModel.self) private var viewModel
    @State private var showActionBrowser = false
    @State private var couponCopied = false

    // MARK: - Type-Aware Text

    private var idleTitle: String {
        switch watch.actionType {
        case .price: return "Price target hit!"
        case .cart:  return "Item is available!"
        case .book:  return "Slot found!"
        case .form:  return "Ready to submit!"
        case .notify: return "Change detected!"
        }
    }

    private var doneMessage: String {
        switch watch.actionType {
        case .price: return "Deal page opened!"
        case .cart:  return "Product page opened!"
        case .book:  return "Booking page opened!"
        case .form:  return "Form page opened!"
        case .notify: return "Change acknowledged!"
        }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.black.opacity(0.45)
                .ignoresSafeArea()
                .onTapGesture {
                    if viewModel.actionState != .running {
                        viewModel.dismissAction()
                    }
                }

            VStack(spacing: 0) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(Theme.border)
                    .frame(width: 40, height: 4)
                    .padding(.top, 12)
                    .padding(.bottom, 24)

                switch viewModel.actionState {
                case .idle:
                    idleContent
                case .running:
                    runningContent
                case .done:
                    doneContent
                }
            }
            .background(Theme.bgCard)
            .clipShape(RoundedRectangle(cornerRadius: Theme.radiusXL))
            .shadow(color: .black.opacity(0.15), radius: 24, y: -4)
            .transition(.move(edge: .bottom))
        }
        .ignoresSafeArea(edges: .bottom)
        .sheet(isPresented: $showActionBrowser) {
            if let url = watch.actionFullURL {
                InAppBrowser(initialURL: url) { _ in }
            }
        }
        .onChange(of: showActionBrowser) { _, newValue in
            if !newValue {
                // User closed the browser — mark action as complete
                viewModel.runAction()
            }
        }
    }

    // MARK: - Idle State

    private var idleContent: some View {
        VStack(spacing: 20) {
            // Icon
            VStack(spacing: 14) {
                Image(systemName: watch.actionType.isActionable ? watch.actionType.actionButtonIcon : "sparkle")
                    .font(.system(size: 28))
                    .foregroundStyle(Theme.accent)
                    .frame(width: 64, height: 64)
                    .background(Theme.accentLight)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(Theme.accentMid, lineWidth: 1)
                    )

                Text(idleTitle)
                    .font(Theme.serif(19, weight: .bold))
                    .foregroundStyle(Theme.ink)

                Text(watch.actionType.isActionable
                    ? "Tap below to open the page and complete your action"
                    : "Your watched condition has been met")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkMid)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }

            // Info card
            VStack(spacing: 0) {
                infoRow(label: "Page", value: watch.name, isLast: false)
                infoRow(label: "Change detected", value: watch.changeNote ?? "", isLast: false, highlight: true)
                infoRow(label: "Action", value: watch.actionLabel, isLast: true)
            }
            .background(Theme.bg)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(Theme.border, lineWidth: 1)
            )
            .padding(.horizontal, 24)

            // Fare hold badge (if the change note contains fare hold / cancellation policy info)
            if let note = watch.changeNote, fareHoldNote(from: note) != nil {
                let holdText = fareHoldNote(from: note)!
                HStack(spacing: 8) {
                    Image(systemName: "clock.badge.checkmark")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.accent)

                    Text(holdText)
                        .font(Theme.body(12, weight: .medium))
                        .foregroundStyle(Theme.ink)

                    Spacer()
                }
                .padding(10)
                .background(Theme.accent.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Theme.accent.opacity(0.15), lineWidth: 1)
                )
                .padding(.horizontal, 24)
            }

            // Coupon code banner (if detected on the page)
            if let code = watch.couponCode, !code.isEmpty {
                HStack(spacing: 10) {
                    Image(systemName: "ticket.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.accent)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(couponCopied ? "Copied!" : "Promo code detected")
                            .font(Theme.body(11, weight: .medium))
                            .foregroundStyle(couponCopied ? Theme.accent : Theme.inkLight)

                        Text(code)
                            .font(.system(size: 15, weight: .bold, design: .monospaced))
                            .foregroundStyle(Theme.ink)
                    }

                    Spacer()

                    Button {
                        UIPasteboard.general.string = code
                        withAnimation(.spring(response: 0.3)) { couponCopied = true }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            withAnimation { couponCopied = false }
                        }
                    } label: {
                        Image(systemName: couponCopied ? "checkmark" : "doc.on.doc")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Theme.accent)
                            .frame(width: 32, height: 32)
                            .background(Theme.accentLight)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
                .padding(12)
                .background(Theme.accentLight.opacity(0.5))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Theme.accent.opacity(0.2), lineWidth: 1)
                )
                .padding(.horizontal, 24)
            }

            // Buttons
            HStack(spacing: 10) {
                Button {
                    viewModel.dismissAction()
                } label: {
                    Text("Not now")
                        .font(Theme.body(14, weight: .semibold))
                        .foregroundStyle(Theme.inkMid)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Theme.bg)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(Theme.border, lineWidth: 1)
                        )
                }

                Button {
                    if watch.actionType.isActionable {
                        // Auto-copy coupon to clipboard before opening the browser
                        if let code = watch.couponCode, !code.isEmpty {
                            UIPasteboard.general.string = code
                        }
                        showActionBrowser = true
                    } else {
                        viewModel.runAction()
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: watch.actionType.isActionable ? watch.actionType.actionButtonIcon : "checkmark")
                            .font(.system(size: 12))
                        Text(watch.actionType.isActionable ? watch.actionType.actionButtonLabel : "Got it")
                            .font(Theme.body(14, weight: .bold))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Theme.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .shadow(color: Theme.accent.opacity(0.25), radius: 12, y: 4)
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
    }

    // MARK: - Running State

    private var runningContent: some View {
        VStack(spacing: 20) {
            ProgressView()
                .controlSize(.large)
                .tint(Theme.accent)
                .scaleEffect(1.4)
                .padding(.top, 24)

            Text("Steward is working…")
                .font(Theme.serif(17, weight: .semibold))
                .foregroundStyle(Theme.ink)

            VStack(spacing: 4) {
                Text("Opening \(URL(string: watch.actionURL ?? watch.url)?.host ?? watch.url)…")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkLight)

                Text("Completing action on your behalf")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkLight)
            }
            .padding(.bottom, 40)
        }
    }

    // MARK: - Done State (with Smart Rewatch Suggestions)

    private var doneContent: some View {
        ScrollView {
            VStack(spacing: 16) {
                Image(systemName: "checkmark")
                    .font(.system(size: 26, weight: .semibold))
                    .foregroundStyle(Theme.accent)
                    .frame(width: 64, height: 64)
                    .background(Theme.accentLight)
                    .clipShape(Circle())
                    .overlay(
                        Circle()
                            .stroke(Theme.accentMid, lineWidth: 1.5)
                    )
                    .padding(.top, 20)

                Text(doneMessage)
                    .font(Theme.serif(18, weight: .bold))
                    .foregroundStyle(Theme.ink)

                Text(watch.actionType.isActionable
                    ? "Steward opened the page for \"\(watch.actionLabel)\""
                    : "Steward acknowledged \"\(watch.actionLabel)\"")
                    .font(Theme.body(13))
                    .foregroundStyle(Theme.inkMid)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)

                // Smart Rewatch Suggestions
                rewatchSuggestions

                Button {
                    viewModel.dismissAction()
                } label: {
                    Text("Back to home")
                        .font(Theme.body(14, weight: .bold))
                        .foregroundStyle(Theme.accent)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Theme.accentLight)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(Theme.accentMid, lineWidth: 1)
                        )
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 40)
            }
        }
    }

    // MARK: - Smart Rewatch Suggestions

    private var rewatchSuggestions: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "sparkles")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.gold)

                Text("Steward suggests")
                    .font(Theme.body(12, weight: .semibold))
                    .foregroundStyle(Theme.ink)
            }
            .padding(.top, 4)

            ForEach(suggestions, id: \.label) { suggestion in
                Button {
                    viewModel.addQuickWatch(
                        emoji: suggestion.emoji,
                        name: suggestion.name,
                        url: suggestion.url,
                        condition: suggestion.condition,
                        actionLabel: suggestion.label,
                        actionType: suggestion.actionType
                    )
                } label: {
                    HStack(spacing: 10) {
                        Text(suggestion.emoji)
                            .font(.system(size: 16))
                            .frame(width: 36, height: 36)
                            .background(Theme.bgDeep)
                            .clipShape(RoundedRectangle(cornerRadius: 10))

                        VStack(alignment: .leading, spacing: 2) {
                            Text(suggestion.label)
                                .font(Theme.body(12, weight: .semibold))
                                .foregroundStyle(Theme.ink)
                                .lineLimit(1)

                            Text(suggestion.subtitle)
                                .font(Theme.body(11))
                                .foregroundStyle(Theme.inkLight)
                                .lineLimit(1)
                        }

                        Spacer()

                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 20))
                            .foregroundStyle(Theme.accent)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(Theme.bg)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Theme.border, lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 24)
        .padding(.top, 4)
    }

    /// Context-aware suggestions based on the watch that was just acted upon
    private var suggestions: [RewatchSuggestion] {
        let urlLower = watch.url.lowercased()

        // Shopping: suggest restock watch + related items
        if watch.actionType == .cart || urlLower.contains("nike") || urlLower.contains("amazon") || urlLower.contains("shopify") {
            return [
                RewatchSuggestion(
                    emoji: "🔄",
                    name: "\(watch.name) Restocks",
                    url: watch.url,
                    condition: "Back in stock in your size",
                    label: "Watch for future restocks",
                    subtitle: "Get notified when \(watch.name) restocks",
                    actionType: .cart
                ),
                RewatchSuggestion(
                    emoji: "📉",
                    name: "\(watch.name) Price",
                    url: watch.url,
                    condition: "Price drops",
                    label: "Track price drops",
                    subtitle: "Know when the price goes down",
                    actionType: .price
                ),
            ]
        }

        // Price: suggest restock or deeper discount
        if watch.actionType == .price {
            return [
                RewatchSuggestion(
                    emoji: "🎯",
                    name: "\(watch.name)",
                    url: watch.url,
                    condition: "Price drops further",
                    label: "Keep watching for a bigger drop",
                    subtitle: "Alert me if it goes even lower",
                    actionType: .price
                ),
                RewatchSuggestion(
                    emoji: "🛒",
                    name: "\(watch.name)",
                    url: watch.url,
                    condition: "Back in stock",
                    label: "Watch for restocks too",
                    subtitle: "Auto-add to cart when available",
                    actionType: .cart
                ),
            ]
        }

        // Booking: suggest rebooking or similar
        if watch.actionType == .book {
            return [
                RewatchSuggestion(
                    emoji: "📅",
                    name: "\(watch.name)",
                    url: watch.url,
                    condition: "Earlier slot opens",
                    label: "Watch for an earlier slot",
                    subtitle: "I'll rebook if something better opens",
                    actionType: .book
                ),
            ]
        }

        // Default
        return [
            RewatchSuggestion(
                emoji: "🔔",
                name: "\(watch.name)",
                url: watch.url,
                condition: "Any future changes",
                label: "Keep watching for changes",
                subtitle: "Stay in the loop on updates",
                actionType: .notify
            ),
        ]
    }

    // MARK: - Info Row

    private func infoRow(label: String, value: String, isLast: Bool, highlight: Bool = false) -> some View {
        VStack(spacing: 0) {
            HStack {
                Text(label)
                    .font(Theme.body(12))
                    .foregroundStyle(Theme.inkLight)

                Spacer()

                Text(value)
                    .font(Theme.body(12, weight: .semibold))
                    .foregroundStyle(highlight ? Theme.accent : Theme.ink)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)

            if !isLast {
                Divider().foregroundStyle(Theme.border)
            }
        }
    }
}

// MARK: - Fare Hold Helper

/// Extracts a fare hold note from a change note string.
/// Returns nil if no fare hold info is present (avoids false positives like "household").
private func fareHoldNote(from changeNote: String) -> String? {
    // Fare hold notes are appended after " · " by the backend
    let parts = changeNote.components(separatedBy: " · ")
    guard parts.count >= 2, let holdPart = parts.last else { return nil }

    // Match specific fare hold keywords (not substrings like "household")
    let holdKeywords = [
        "fare hold", "fare lock", "24hr", "24-hour",
        "free cancellation", "risk-free cancellation",
        "cancel for free", "fully refundable",
    ]
    let lower = holdPart.lowercased()
    for keyword in holdKeywords {
        if lower.contains(keyword) {
            return holdPart
        }
    }
    return nil
}

// MARK: - Rewatch Suggestion Model

private struct RewatchSuggestion {
    let emoji: String
    let name: String
    let url: String
    let condition: String
    let label: String
    let subtitle: String
    let actionType: ActionType
}
