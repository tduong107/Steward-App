import Foundation
import UIKit

enum ChatRole {
    case steward
    case user
}

struct ActionCard: Identifiable {
    let id = UUID()
    let icon: String
    let label: String
    let type: ActionType
}

struct ProductLink: Identifiable {
    let id = UUID()
    let title: String
    let url: String
    let source: String // e.g. "Amazon", "Google Shopping", "eBay"
    let price: String? // Optional price snippet
    let imageURL: String? // Product image from search results

    var displayURL: String {
        URL(string: url)?.host ?? url
    }
}

struct ChatMessage: Identifiable {
    let id: UUID
    let role: ChatRole
    let text: String
    var suggestions: [String]?
    var actionCards: [ActionCard]?
    var productLinks: [ProductLink]?
    var image: UIImage? // Thumbnail for display (compressed from original)

    init(
        id: UUID = UUID(),
        role: ChatRole,
        text: String,
        suggestions: [String]? = nil,
        actionCards: [ActionCard]? = nil,
        productLinks: [ProductLink]? = nil,
        image: UIImage? = nil
    ) {
        self.id = id
        self.role = role
        self.text = text
        self.suggestions = suggestions
        self.actionCards = actionCards
        self.productLinks = productLinks
        self.image = image
    }
}

extension ChatMessage {
    static let initial = ChatMessage(
        role: .steward,
        text: "Hello! I'm Steward, your personal web watcher. I keep an eye on websites and take action on your behalf.\n\nWhat are you looking to watch?",
        suggestions: ["Product", "Travel", "Reservation", "Events", "Camping", "Screenshot", "General (Beta)", "Need help?"]
    )

    /// Whether this suggestion text is a category chip (from the initial message)
    static let categoryChips: Set<String> = ["Product", "Travel", "Reservation", "Events", "Camping", "Screenshot", "General (Beta)", "Need help?"]

    // MARK: - Category Follow-Ups (synced with web app)

    /// Category-specific follow-up shown after user picks a top-level category.
    /// Returns nil to let the AI handle the response instead.
    static func categoryFollowUp(for category: String) -> ChatMessage? {
        switch category {
        case "Product":
            return ChatMessage(
                role: .steward,
                text: "Nice, what are you looking for?",
                suggestions: ["Track a price drop", "Best price anywhere", "Watch for a restock", "Any changes (Beta)"]
            )
        case "Travel":
            return ChatMessage(
                role: .steward,
                text: "Love a good deal \u{2708}\u{FE0F} What kind of travel are you planning?",
                suggestions: ["Track flight prices", "Watch hotel rates", "Track car rental prices (Beta)", "Any travel changes (Beta)"]
            )
        case "Reservation":
            return ChatMessage(
                role: .steward,
                text: "I'm great at snagging hard-to-get reservations \u{1F37D}\u{FE0F} What are you trying to book?",
                suggestions: ["Watch Resy tables", "Track other reservations (Beta)", "Any changes (Beta)"]
            )
        case "Events":
            return ChatMessage(
                role: .steward,
                text: "Let's find you those tickets \u{1F3AB} What event are you eyeing?",
                suggestions: ["Watch for event availability", "Track event prices", "Any changes (Beta)"]
            )
        case "Camping":
            return ChatMessage(
                role: .steward,
                text: "Campsites go fast, I'll keep checking for you \u{1F3D5}\u{FE0F}\n\nPaste a Recreation.gov link or just tell me the campground and your dates.",
                suggestions: ["Watch for open campsites", "Track campground availability"]
            )
        case "Screenshot":
            return ChatMessage(
                role: .steward,
                text: "Go ahead and share a screenshot \u{1F4F8}\n\nCould be a product page, a price you spotted, a reservation, anything really. I'll figure out what it is and help you set up a watch."
            )
        case "General (Beta)":
            return ChatMessage(
                role: .steward,
                text: "I can keep tabs on pretty much any webpage!\n\nHeads up, general watches are still in beta so results can vary depending on the site. For the most reliable tracking, try Product, Events, or Camping.",
                suggestions: ["Track price changes (Beta)", "Watch for any updates (Beta)", "Monitor availability (Beta)"]
            )
        case "Need help?":
            return ChatMessage(
                role: .steward,
                text: "I'm here to help! Here are some things I can do:\n\n\u{2022} Set up watches to monitor websites for price drops, restocks, and availability\n\u{2022} Track prices across multiple stores\n\u{2022} Alert you via push, email, or SMS when conditions are met\n\u{2022} Auto-add items to your cart when they drop in price\n\nWhat do you need help with?",
                suggestions: ["How do watches work?", "How do I change settings?", "Email support", "Set up a watch"]
            )
        default:
            return nil // Let the AI handle the response
        }
    }

    // MARK: - Special Sub-Chip Handlers (synced with web app)

    /// Handles sub-category chips that need specific local guidance
    /// instead of being sent to the AI. Returns nil if the chip should go to AI.
    static func specialChipFollowUp(for chip: String) -> ChatMessage? {
        switch chip.lowercased() {
        case "best price anywhere":
            return ChatMessage(
                role: .steward,
                text: "I'll hunt down the best deal across all stores for you \u{1F3F7}\u{FE0F}\n\nSend me a link or just tell me what you're looking for."
            )
        case "watch resy tables":
            return ChatMessage(
                role: .steward,
                text: "On it! Paste the Resy link for the restaurant and I'll keep checking for open tables \u{1F377}"
            )
        case "watch for open campsites", "track campground availability":
            return ChatMessage(
                role: .steward,
                text: "Campsites disappear fast, but I'm on it \u{1F3D5}\u{FE0F}\n\nPaste a Recreation.gov link, or just tell me the campground name and when you want to go."
            )
        case "watch for event availability", "track event prices":
            return ChatMessage(
                role: .steward,
                text: "I'll keep an eye out for tickets \u{1F3AB}\n\nPaste a link to the event page or tell me what event you're looking for."
            )
        default:
            return nil // Send to AI
        }
    }
}
