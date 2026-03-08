import SwiftUI
import UniformTypeIdentifiers

/// Compact SwiftUI view shown inside the iOS Share Sheet.
/// Displays the shared URL and a "Watch This" button.
struct ShareExtensionView: View {
    let attachments: [NSItemProvider]
    let onComplete: (String) -> Void
    let onCancel: () -> Void

    @State private var sharedURL: String = ""
    @State private var isLoading = true
    @State private var didSave = false

    // Steward accent green
    private let accentGreen = Color(red: 0.165, green: 0.361, blue: 0.271)

    var body: some View {
        VStack(spacing: 0) {
            // ── Header ──
            HStack {
                Button("Cancel") { onCancel() }
                    .font(.system(size: 15))
                    .foregroundStyle(.secondary)
                Spacer()
                Text("Steward")
                    .font(.system(size: 17, weight: .semibold, design: .serif))
                Spacer()
                // Balance spacer
                Color.clear.frame(width: 60)
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 12)

            Divider()

            if isLoading {
                Spacer()
                ProgressView()
                    .tint(accentGreen)
                Spacer()
            } else if didSave {
                // ── Success state ──
                Spacer()
                VStack(spacing: 12) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(accentGreen)
                    Text("Saved!")
                        .font(.system(size: 18, weight: .semibold))
                    Text("Open Steward to set up your watch")
                        .font(.system(size: 14))
                        .foregroundStyle(.secondary)
                }
                Spacer()
            } else {
                // ── URL Preview Card ──
                VStack(spacing: 12) {
                    HStack(spacing: 10) {
                        Image(systemName: "link")
                            .font(.system(size: 14))
                            .foregroundStyle(.white)
                            .frame(width: 32, height: 32)
                            .background(accentGreen)
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        VStack(alignment: .leading, spacing: 2) {
                            Text(displayHost)
                                .font(.system(size: 14, weight: .medium))
                                .lineLimit(1)
                            Text(sharedURL)
                                .font(.system(size: 12))
                                .foregroundStyle(.secondary)
                                .lineLimit(2)
                        }
                        Spacer()
                    }
                    .padding(14)
                    .background(Color(.secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)

                Spacer()

                // ── Watch This Button ──
                Button(action: {
                    withAnimation(.spring(response: 0.3)) {
                        didSave = true
                    }
                    // Brief delay to show checkmark, then dismiss
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                        onComplete(sharedURL)
                    }
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: "eye")
                            .font(.system(size: 15, weight: .semibold))
                        Text("Watch This")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(accentGreen)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
        }
        .task {
            await extractURL()
        }
    }

    // MARK: - Helpers

    private var displayHost: String {
        URL(string: sharedURL)?.host ?? sharedURL
    }

    private func extractURL() async {
        for provider in attachments {
            // Try URL type first
            if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                do {
                    if let url = try await provider.loadItem(
                        forTypeIdentifier: UTType.url.identifier
                    ) as? URL {
                        sharedURL = url.absoluteString
                        isLoading = false
                        return
                    }
                } catch {
                    // Fall through to next provider
                }
            }

            // Fallback: plain text that looks like a URL
            if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                do {
                    if let text = try await provider.loadItem(
                        forTypeIdentifier: UTType.plainText.identifier
                    ) as? String {
                        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
                        if let url = URL(string: trimmed),
                           let scheme = url.scheme,
                           scheme.hasPrefix("http") {
                            sharedURL = trimmed
                            isLoading = false
                            return
                        }
                    }
                } catch {
                    // Fall through
                }
            }
        }

        // No valid URL found — dismiss
        onCancel()
    }
}
