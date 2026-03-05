import SwiftUI

struct ShareWatchSheet: View {
    let watch: Watch
    @Environment(\.dismiss) private var dismiss
    @State private var copied = false

    /// A mock shareable link
    private var shareURL: String {
        "https://steward.app/watch/\(watch.id.uuidString.prefix(8).lowercased())"
    }

    /// Shareable text message
    private var shareText: String {
        "\(watch.emoji) I'm using Steward to watch \(watch.name) for \(watch.condition.lowercased()). Join me!\n\n\(shareURL)"
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Hero
                VStack(spacing: 16) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 28))
                        .foregroundStyle(Theme.accent)
                        .frame(width: 64, height: 64)
                        .background(Theme.accentLight)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Theme.accentMid, lineWidth: 1)
                        )

                    VStack(spacing: 6) {
                        Text("Share this watch")
                            .font(Theme.serif(19, weight: .bold))
                            .foregroundStyle(Theme.ink)

                        Text("Invite friends to watch the same page.\nThey'll get the same alerts you do.")
                            .font(Theme.body(13))
                            .foregroundStyle(Theme.inkMid)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.top, 28)
                .padding(.bottom, 24)

                // Watch preview card
                HStack(spacing: 12) {
                    Text(watch.emoji)
                        .font(.system(size: 20))
                        .frame(width: 44, height: 44)
                        .background(Theme.bgDeep)
                        .clipShape(RoundedRectangle(cornerRadius: 12))

                    VStack(alignment: .leading, spacing: 2) {
                        Text(watch.name)
                            .font(Theme.body(14, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                            .lineLimit(1)

                        Text(watch.condition)
                            .font(Theme.body(12))
                            .foregroundStyle(Theme.inkLight)
                            .lineLimit(1)
                    }

                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(Theme.bgCard)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Theme.border, lineWidth: 1)
                )
                .padding(.horizontal, 24)

                // Copy link
                VStack(spacing: 10) {
                    HStack {
                        Text(shareURL)
                            .font(Theme.body(12))
                            .foregroundStyle(Theme.inkMid)
                            .lineLimit(1)
                            .truncationMode(.middle)

                        Spacer()

                        Button {
                            UIPasteboard.general.string = shareURL
                            withAnimation(.spring(response: 0.3)) {
                                copied = true
                            }
                            Task {
                                try? await Task.sleep(for: .seconds(2))
                                withAnimation { copied = false }
                            }
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: copied ? "checkmark" : "doc.on.doc")
                                    .font(.system(size: 12, weight: .semibold))
                                Text(copied ? "Copied!" : "Copy")
                                    .font(Theme.body(12, weight: .semibold))
                            }
                            .foregroundStyle(copied ? Theme.accent : Theme.ink)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(copied ? Theme.accentLight : Theme.bgDeep)
                            .clipShape(Capsule())
                        }
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
                .padding(.horizontal, 24)
                .padding(.top, 20)

                Spacer()

                // Share buttons
                VStack(spacing: 10) {
                    ShareLink(item: shareText) {
                        HStack(spacing: 6) {
                            Image(systemName: "square.and.arrow.up")
                                .font(.system(size: 14))
                            Text("Share via...")
                                .font(Theme.body(14, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Theme.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .shadow(color: Theme.accent.opacity(0.25), radius: 12, y: 4)
                    }

                    Button {
                        dismiss()
                    } label: {
                        Text("Cancel")
                            .font(Theme.body(14, weight: .semibold))
                            .foregroundStyle(Theme.inkMid)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 34)
            }
            .background(Theme.bgCard)
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}
