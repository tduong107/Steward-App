import SwiftUI

/// Flow B — First Sign-In (post-auth)
/// 6 slides: Welcome → Watches → AI Chat → Savings → Share Extension → All Set
struct OnboardingFlowB: View {
    @Environment(AuthManager.self) private var authManager
    @State private var currentPage = 0
    var onFinish: () -> Void

    // Brand colours
    private let deepForest = Color(hex: "0F2018")
    private let forestMid  = Color(hex: "1C3D2E")
    private let stewardGreen = Color(hex: "2A5C45")
    private let mint = Color(hex: "6EE7B7")
    private let cream = Color(hex: "F7F6F3")
    private let gold = Color(hex: "F59E0B")

    private let totalPages = 6

    var body: some View {
        ZStack {
            deepForest.ignoresSafeArea()

            TabView(selection: $currentPage) {
                welcomeSlide.tag(0)
                watchesSlide.tag(1)
                aiChatSlide.tag(2)
                savingsSlide.tag(3)
                shareExtensionSlide.tag(4)
                allSetSlide.tag(5)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut(duration: 0.35), value: currentPage)

            // Dots + buttons overlay
            VStack {
                Spacer()

                pageDots
                    .padding(.bottom, 20)

                if currentPage < totalPages - 1 {
                    primaryButton(currentPage == 0 ? "Let's go →" : "Continue →") {
                        withAnimation { currentPage += 1 }
                    }
                    .padding(.horizontal, 28)

                    if currentPage == 0 {
                        Button("Skip tour") {
                            onFinish()
                        }
                        .font(.system(size: 13))
                        .foregroundStyle(.white.opacity(0.35))
                        .padding(.top, 8)
                    }
                } else {
                    primaryButton("Start watching →") {
                        onFinish()
                    }
                    .padding(.horizontal, 28)
                }
            }
            .padding(.bottom, 50)
        }
    }

    // MARK: - Slide B1: Welcome

    private var welcomeSlide: some View {
        ZStack {
            RadialGradient(
                colors: [stewardGreen.opacity(0.55), .clear],
                center: .init(x: 0.5, y: 0.3),
                startRadius: 0,
                endRadius: 220
            )
            .ignoresSafeArea()

            // Linear gradient overlay
            LinearGradient(
                colors: [.clear, deepForest.opacity(0.8)],
                startPoint: .init(x: 0.5, y: 0.4),
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer().frame(height: 80)

                // Avatar with initial — uses actual user name from auth
                let displayName = authManager.displayName ?? "S"
                let initial = String(displayName.prefix(1)).uppercased()
                let firstName = displayName.components(separatedBy: " ").first ?? "there"

                Text(initial)
                    .font(Theme.serif(28, weight: .bold))
                    .foregroundStyle(mint)
                    .frame(width: 72, height: 72)
                    .background(
                        LinearGradient(colors: [stewardGreen, forestMid], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .clipShape(Circle())
                    .overlay(
                        Circle().stroke(mint.opacity(0.3), lineWidth: 2)
                    )
                    .shadow(color: mint.opacity(0.05), radius: 8)

                Spacer().frame(height: 8)

                Text("Welcome to Steward")
                    .font(.system(size: 12))
                    .foregroundStyle(mint.opacity(0.7))
                    .tracking(0.5)

                Spacer().frame(height: 6)

                Text("You're all set, \(firstName)")
                    .font(Theme.serif(30, weight: .bold))
                    .foregroundStyle(cream)
                    .tracking(-0.3)

                Spacer().frame(height: 10)

                Text("Let's take 60 seconds to show you around.")
                    .font(.system(size: 14, weight: .light))
                    .lineSpacing(3)
                    .foregroundStyle(cream.opacity(0.6))
                    .multilineTextAlignment(.center)

                Spacer().frame(height: 28)

                // Checklist
                VStack(spacing: 8) {
                    checklistItem(done: true, title: "Account created", subtitle: "You're signed in and ready")
                    checklistItem(done: false, title: "Create your first watch", subtitle: "Tell Steward what to monitor")
                    checklistItem(done: false, title: "Enable notifications", subtitle: "Get alerted when things change")
                }
                .padding(.horizontal, 24)

                Spacer()
            }
        }
    }

    // MARK: - Slide B2: Watches Feature

    private var watchesSlide: some View {
        ZStack {
            RadialGradient(
                colors: [stewardGreen.opacity(0.3), .clear],
                center: .init(x: 1.0, y: 0.2),
                startRadius: 0,
                endRadius: 200
            )
            .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 0) {
                Spacer().frame(height: 68)

                // Feature label
                featureLabel(emoji: "👁", text: "Watches")
                    .padding(.horizontal, 32)

                Spacer().frame(height: 14)

                Text("Your deals,\nall in one place")
                    .font(Theme.serif(26, weight: .bold))
                    .foregroundStyle(cream)
                    .lineSpacing(4)
                    .padding(.horizontal, 32)

                Spacer().frame(height: 10)

                Text("Each watch keeps an eye on one thing. Price, stock, any change. Steward does the checking so you do not have to.")
                    .font(.system(size: 13.5, weight: .light))
                    .lineSpacing(3)
                    .foregroundStyle(cream.opacity(0.6))
                    .padding(.horizontal, 32)

                Spacer().frame(height: 24)

                // Sample watch cards
                VStack(spacing: 10) {
                    watchCard(emoji: "👟", name: "Nike Dunk Low Panda", condition: "Price drops below $90", badge: "↓ $89", badgeStyle: .alert)
                    watchCard(emoji: "✈️", name: "NYC → LAX Flights", condition: "Any price change", badge: "Watching", badgeStyle: .watching)
                    watchCard(emoji: "🧹", name: "Dyson V15 Detect", condition: "Back in stock", badge: "In stock", badgeStyle: .inStock)
                }
                .padding(.horizontal, 20)

                Spacer()
            }
        }
    }

    // MARK: - Slide B3: AI Chat Feature

    private var aiChatSlide: some View {
        ZStack {
            RadialGradient(
                colors: [stewardGreen.opacity(0.28), .clear],
                center: .init(x: 0.1, y: 0.6),
                startRadius: 0,
                endRadius: 220
            )
            .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 0) {
                Spacer().frame(height: 68)

                featureLabel(emoji: "✦", text: "AI Chat")
                    .padding(.horizontal, 32)

                Spacer().frame(height: 14)

                Text("Just say what\nyou want")
                    .font(Theme.serif(26, weight: .bold))
                    .foregroundStyle(cream)
                    .lineSpacing(4)
                    .padding(.horizontal, 32)

                Spacer().frame(height: 10)

                Text("Talk to Steward like a friend. It finds the item, reads the price, and sets the watch. No menus, no forms.")
                    .font(.system(size: 13.5, weight: .light))
                    .lineSpacing(3)
                    .foregroundStyle(cream.opacity(0.6))
                    .padding(.horizontal, 32)

                Spacer().frame(height: 22)

                // Chat mockup
                VStack(alignment: .leading, spacing: 10) {
                    // User bubble
                    Text("Find me the Dyson V15 and alert me if it goes under $500")
                        .font(.system(size: 13))
                        .lineSpacing(2)
                        .foregroundStyle(cream)
                        .padding(.horizontal, 15)
                        .padding(.vertical, 11)
                        .background(stewardGreen)
                        .clipShape(ChatBubbleShape(isUser: true))
                        .frame(maxWidth: .infinity, alignment: .trailing)

                    // Product card
                    HStack(spacing: 12) {
                        Text("🧹")
                            .font(.system(size: 20))
                            .frame(width: 40, height: 40)
                            .background(
                                LinearGradient(colors: [mint.opacity(0.2), stewardGreen.opacity(0.3)], startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Dyson V15 Detect Absolute")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundStyle(cream)
                            Text("$549 at dyson.com")
                                .font(.system(size: 11))
                                .foregroundStyle(mint)
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
                    .background(.white.opacity(0.04))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(.white.opacity(0.07), lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 14))

                    // AI bubble
                    HStack(spacing: 0) {
                        Text("Found it. ")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(mint)
                        + Text("It is $549 right now. I will ping you the moment it dips below $500. Sound good?")
                            .font(.system(size: 13))
                            .foregroundStyle(cream.opacity(0.6))
                    }
                    .lineSpacing(2)
                    .padding(.horizontal, 15)
                    .padding(.vertical, 11)
                    .background(.white.opacity(0.06))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(.white.opacity(0.08), lineWidth: 1)
                    )
                    .clipShape(ChatBubbleShape(isUser: false))

                    // Suggestion chips
                    HStack(spacing: 7) {
                        suggestionChip("✓ Yes, create watch")
                        suggestionChip("Change price")
                        suggestionChip("See more options")
                    }
                }
                .padding(.horizontal, 20)

                Spacer()
            }
        }
    }

    // MARK: - Slide B4: Savings & Notifications

    private var savingsSlide: some View {
        ZStack {
            RadialGradient(
                colors: [stewardGreen.opacity(0.3), .clear],
                center: .init(x: 0.5, y: 0.5),
                startRadius: 0,
                endRadius: 200
            )
            .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 0) {
                Spacer().frame(height: 68)

                featureLabel(emoji: "💸", text: "Savings")
                    .padding(.horizontal, 32)

                Spacer().frame(height: 14)

                Text("Watch your\nsavings grow")
                    .font(Theme.serif(26, weight: .bold))
                    .foregroundStyle(cream)
                    .lineSpacing(4)
                    .padding(.horizontal, 32)

                Spacer().frame(height: 10)

                Text("Every deal Steward catches gets logged here. Stack up savings and unlock fun milestones along the way.")
                    .font(.system(size: 13.5, weight: .light))
                    .lineSpacing(3)
                    .foregroundStyle(cream.opacity(0.6))
                    .padding(.horizontal, 32)

                Spacer().frame(height: 24)

                // Savings card
                VStack(alignment: .leading, spacing: 0) {
                    Text("TOTAL SAVINGS")
                        .font(.system(size: 11, weight: .medium))
                        .tracking(1.5)
                        .foregroundStyle(mint.opacity(0.6))

                    Spacer().frame(height: 6)

                    Text("$0.00")
                        .font(Theme.serif(40, weight: .bold))
                        .foregroundStyle(mint)

                    Spacer().frame(height: 4)

                    Text("Your first deal is waiting")
                        .font(.system(size: 12, weight: .light))
                        .foregroundStyle(cream.opacity(0.6))

                    Spacer().frame(height: 16)

                    Divider().overlay(.white.opacity(0.06))

                    Spacer().frame(height: 16)

                    // Milestones
                    HStack {
                        ForEach(Array(["🌱", "🌿", "🌳", "💰", "👑"].enumerated()), id: \.offset) { i, emoji in
                            Text(emoji)
                                .font(.system(size: 18))
                                .frame(maxWidth: .infinity)
                                .opacity(i == 0 ? 0.6 : 0.3)
                        }
                    }
                }
                .padding(20)
                .background(
                    LinearGradient(
                        colors: [stewardGreen.opacity(0.6), deepForest.opacity(0.4)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(mint.opacity(0.2), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .padding(.horizontal, 20)

                Spacer().frame(height: 14)

                // Sample notifications
                VStack(spacing: 8) {
                    notificationItem(
                        dotColor: mint,
                        text: "**Nike Dunk Low** dropped to $89. Your target was $90.",
                        time: "just now"
                    )
                    notificationItem(
                        dotColor: gold,
                        text: "**Dyson V15** is back in stock at dyson.com",
                        time: "2m ago"
                    )
                }
                .padding(.horizontal, 20)

                Spacer()
            }
        }
    }

    // MARK: - Slide B5: Share Extension (NEW)

    private var shareExtensionSlide: some View {
        ZStack {
            RadialGradient(
                colors: [stewardGreen.opacity(0.3), .clear],
                center: .init(x: 1.0, y: 0.2),
                startRadius: 0,
                endRadius: 200
            )
            .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 0) {
                Spacer().frame(height: 68)

                featureLabel(emoji: "↗", text: "Share Extension")
                    .padding(.horizontal, 32)

                Spacer().frame(height: 14)

                Text("Watch anything,\nfrom any app")
                    .font(Theme.serif(26, weight: .bold))
                    .foregroundStyle(cream)
                    .lineSpacing(4)
                    .padding(.horizontal, 32)

                Spacer().frame(height: 10)

                Text("Spot something you want while browsing? Send it straight to Steward without ever opening the app.")
                    .font(.system(size: 13.5, weight: .light))
                    .lineSpacing(3)
                    .foregroundStyle(cream.opacity(0.6))
                    .padding(.horizontal, 32)

                Spacer().frame(height: 24)

                // Steps illustration
                VStack(spacing: 0) {
                    shareStep(number: 1, title: "Find anything in Safari or Chrome", subtitle: "A product page, a flight, a rental listing.")

                    // Arrow connector
                    Text("↓")
                        .font(.system(size: 14))
                        .foregroundStyle(mint.opacity(0.3))
                        .padding(.vertical, 2)
                        .padding(.leading, 27)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    shareStep(number: 2, title: "Tap Share, then Steward", subtitle: "It lives right in your iOS Share Sheet.")

                    // Arrow connector
                    Text("↓")
                        .font(.system(size: 14))
                        .foregroundStyle(mint.opacity(0.3))
                        .padding(.vertical, 2)
                        .padding(.leading, 27)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    shareStep(number: 3, title: "Steward opens ready to watch it", subtitle: "The link is already loaded. Just tell it what to look for.")
                }
                .padding(.horizontal, 20)

                Spacer().frame(height: 18)

                // Share sheet mockup
                VStack(spacing: 0) {
                    // Browser bar
                    HStack(spacing: 8) {
                        Text("🌐")
                            .font(.system(size: 14))
                        Text("amazon.com/dp/B09WX3...")
                            .font(.system(size: 11, weight: .light))
                            .foregroundStyle(cream.opacity(0.6))
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .overlay(alignment: .bottom) {
                        Rectangle()
                            .fill(.white.opacity(0.06))
                            .frame(height: 1)
                    }

                    // App row
                    HStack(spacing: 4) {
                        shareAppIcon(
                            icon: "S",
                            name: "Steward",
                            bgGradient: [forestMid, deepForest],
                            borderColor: mint.opacity(0.3),
                            isSteward: true
                        )
                        shareAppIcon(
                            icon: "📘",
                            name: "Facebook",
                            bgGradient: [Color(hex: "1877F2"), Color(hex: "1877F2")],
                            borderColor: .clear,
                            isSteward: false
                        )
                        shareAppIcon(
                            icon: "✉️",
                            name: "Messages",
                            bgGradient: [.black, .black],
                            borderColor: .clear,
                            isSteward: false
                        )
                        shareAppIcon(
                            icon: "📋",
                            name: "Copy",
                            bgGradient: [Color(hex: "34C759"), Color(hex: "34C759")],
                            borderColor: .clear,
                            isSteward: false
                        )
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
                }
                .background(.white.opacity(0.04))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(.white.opacity(0.08), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .padding(.horizontal, 20)

                Spacer()
            }
        }
    }

    // MARK: - Slide B6: All Set

    private var allSetSlide: some View {
        ZStack {
            RadialGradient(
                colors: [stewardGreen.opacity(0.55), .clear],
                center: .init(x: 0.5, y: 0.45),
                startRadius: 0,
                endRadius: 250
            )
            .ignoresSafeArea()

            RadialGradient(
                colors: [mint.opacity(0.06), .clear],
                center: .init(x: 0.75, y: 0.2),
                startRadius: 0,
                endRadius: 180
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Checkmark
                Text("✦")
                    .font(.system(size: 30))
                    .frame(width: 72, height: 72)
                    .background(mint.opacity(0.12))
                    .overlay(
                        Circle().stroke(mint.opacity(0.35), lineWidth: 2)
                    )
                    .clipShape(Circle())
                    .scaleEffect(currentPage == 5 ? 1.0 : 0.5)
                    .opacity(currentPage == 5 ? 1.0 : 0)
                    .animation(.spring(response: 0.6, dampingFraction: 0.6), value: currentPage)

                Spacer().frame(height: 24)

                VStack(spacing: 4) {
                    Text("You're ready to")
                        .font(Theme.serif(32, weight: .bold))
                        .foregroundStyle(cream)

                    HStack(spacing: 6) {
                        Text("start ")
                            .font(Theme.serif(32, weight: .bold))
                            .foregroundStyle(cream)
                        + Text("saving")
                            .font(Font.custom("Georgia-BoldItalic", size: 32))
                            .foregroundStyle(mint)
                    }
                }
                .multilineTextAlignment(.center)

                Spacer().frame(height: 14)

                Text("Tap the sparkle button to chat, or add a watch from the home screen. Your first deal is out there waiting.")
                    .font(.system(size: 14, weight: .light))
                    .lineSpacing(4)
                    .foregroundStyle(cream.opacity(0.6))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

                Spacer()
                Spacer().frame(height: 100) // room for button
            }
        }
    }

    // MARK: - Reusable Components

    private var pageDots: some View {
        HStack(spacing: 6) {
            ForEach(0..<totalPages, id: \.self) { i in
                Capsule()
                    .fill(i == currentPage ? mint : .white.opacity(0.2))
                    .frame(width: i == currentPage ? 20 : 6, height: 6)
                    .animation(.easeOut(duration: 0.3), value: currentPage)
            }
        }
    }

    private func primaryButton(_ label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 15, weight: .semibold))
                .tracking(0.3)
                .foregroundStyle(deepForest)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(mint)
                .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }

    private func featureLabel(emoji: String, text: String) -> some View {
        HStack(spacing: 6) {
            Text(emoji)
                .font(.system(size: 12))
            Text(text.uppercased())
                .font(.system(size: 10, weight: .semibold))
                .tracking(1.2)
                .foregroundStyle(mint)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(mint.opacity(0.08))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(mint.opacity(0.15), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private func checklistItem(done: Bool, title: String, subtitle: String) -> some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .stroke(mint.opacity(done ? 1.0 : 0.4), lineWidth: 2)
                    .frame(width: 24, height: 24)

                if done {
                    Circle()
                        .fill(mint.opacity(0.15))
                        .frame(width: 24, height: 24)
                    Text("✓")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(mint)
                }
            }

            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.system(size: 14))
                    .foregroundStyle(cream)
                Text(subtitle)
                    .font(.system(size: 11.5, weight: .light))
                    .foregroundStyle(cream.opacity(0.6))
            }

            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(.white.opacity(0.03))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private enum BadgeStyle { case alert, watching, inStock }

    private func watchCard(emoji: String, name: String, condition: String, badge: String, badgeStyle: BadgeStyle) -> some View {
        HStack(spacing: 12) {
            Text(emoji)
                .font(.system(size: 22))

            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(cream)
                    .lineLimit(1)
                Text(condition)
                    .font(.system(size: 11, weight: .light))
                    .foregroundStyle(cream.opacity(0.6))
            }

            Spacer()

            Text(badge)
                .font(.system(size: 10, weight: .semibold))
                .tracking(0.3)
                .foregroundStyle(badgeColor(badgeStyle))
                .padding(.horizontal, 9)
                .padding(.vertical, 3)
                .background(badgeColor(badgeStyle).opacity(0.12))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(badgeColor(badgeStyle).opacity(0.25), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 20))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(.white.opacity(0.04))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(.white.opacity(0.07), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func badgeColor(_ style: BadgeStyle) -> Color {
        switch style {
        case .alert: return gold
        case .watching: return mint
        case .inStock: return Color(hex: "34D399")
        }
    }

    private func suggestionChip(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11.5))
            .foregroundStyle(mint)
            .padding(.horizontal, 11)
            .padding(.vertical, 5)
            .background(mint.opacity(0.08))
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(mint.opacity(0.18), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 20))
    }

    private func notificationItem(dotColor: Color, text: LocalizedStringKey, time: String) -> some View {
        HStack(spacing: 12) {
            Circle()
                .fill(dotColor)
                .frame(width: 8, height: 8)
                .shadow(color: dotColor.opacity(0.6), radius: 3)

            Text(text)
                .font(.system(size: 12.5, weight: .light))
                .lineSpacing(2)
                .foregroundStyle(cream.opacity(0.6))

            Spacer()

            Text(time)
                .font(.system(size: 10.5))
                .foregroundStyle(.white.opacity(0.25))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(.white.opacity(0.04))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(.white.opacity(0.07), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    // MARK: - Share Extension Helpers

    private func shareStep(number: Int, title: String, subtitle: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Text("\(number)")
                .font(Theme.serif(12, weight: .semibold))
                .foregroundStyle(mint)
                .frame(width: 26, height: 26)
                .background(stewardGreen)
                .overlay(
                    Circle().stroke(mint.opacity(0.3), lineWidth: 1)
                )
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(cream)
                Text(subtitle)
                    .font(.system(size: 11.5, weight: .light))
                    .lineSpacing(2)
                    .foregroundStyle(cream.opacity(0.6))
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(.white.opacity(0.03))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func shareAppIcon(icon: String, name: String, bgGradient: [Color], borderColor: Color, isSteward: Bool) -> some View {
        VStack(spacing: 5) {
            if isSteward {
                // Steward uses the S logo
                StewardLogo(size: 44)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(borderColor, lineWidth: 1)
                    )
            } else {
                Text(icon)
                    .font(.system(size: 20))
                    .frame(width: 44, height: 44)
                    .background(
                        LinearGradient(colors: bgGradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }

            Text(name)
                .font(.system(size: 10, weight: .light))
                .foregroundStyle(cream.opacity(0.6))
        }
        .frame(width: 60)
    }
}

// ChatBubbleShape is defined in ChatDrawer.swift and shared project-wide
