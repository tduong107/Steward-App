import SwiftUI
import Supabase

struct AccountDetailSheet: View {
    @Environment(AuthManager.self) private var authManager
    @Environment(SubscriptionManager.self) private var subscriptionManager
    @Environment(\.dismiss) private var dismiss

    @State private var showDeleteConfirmation = false
    @State private var isDeleting = false
    @State private var deleteError: String?
    @State private var isEditingName = false
    @State private var editedName = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    // Avatar
                    VStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(Theme.accentLight)
                                .frame(width: 72, height: 72)

                            Text(initials)
                                .font(Theme.serif(26, weight: .bold))
                                .foregroundStyle(Theme.accent)
                        }

                        if isEditingName {
                            HStack(spacing: 8) {
                                TextField("Your name", text: $editedName)
                                    .font(Theme.serif(20, weight: .bold))
                                    .foregroundStyle(Theme.ink)
                                    .multilineTextAlignment(.center)
                                    .textFieldStyle(.plain)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(Theme.bgDeep)
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                    .onSubmit { saveName() }

                                Button {
                                    saveName()
                                } label: {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 24))
                                        .foregroundStyle(Theme.accent)
                                }
                            }
                            .padding(.horizontal, 24)
                        } else {
                            Button {
                                editedName = authManager.displayName ?? ""
                                isEditingName = true
                            } label: {
                                HStack(spacing: 6) {
                                    Text(authManager.displayName ?? "Steward User")
                                        .font(Theme.serif(20, weight: .bold))
                                        .foregroundStyle(Theme.ink)

                                    Image(systemName: "pencil")
                                        .font(.system(size: 12))
                                        .foregroundStyle(Theme.inkLight)
                                }
                            }
                            .buttonStyle(.plain)
                        }

                        // Tier badge
                        let tier = subscriptionManager.currentTier
                        Text("Steward \(tier.displayName)")
                            .font(Theme.body(12, weight: .semibold))
                            .foregroundStyle(tier == .free ? Theme.inkMid : .white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 5)
                            .background(tier == .premium ? Theme.gold : (tier == .pro ? Theme.accent : Theme.bgDeep))
                            .clipShape(Capsule())
                    }
                    .padding(.top, 28)
                    .padding(.bottom, 28)

                    // Info rows
                    VStack(spacing: 0) {
                        if let phone = authManager.effectivePhone, !phone.isEmpty {
                            infoRow(icon: "phone.fill", label: "Phone", value: phone)
                            Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                        }

                        if let email = authManager.effectiveEmail, !email.isEmpty {
                            infoRow(icon: "envelope.fill", label: "Email", value: email)
                            Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                        }

                        infoRow(icon: "person.fill", label: "Sign-in method", value: signInMethod)

                        if let userId = authManager.currentUserId {
                            Divider().foregroundStyle(Theme.border).padding(.leading, 52)
                            infoRow(icon: "number", label: "Account ID", value: String(userId.uuidString.prefix(8)))
                        }
                    }
                    .background(Theme.bgCard)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Theme.border, lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 20)

                    // Manage subscription
                    if subscriptionManager.currentTier != .free {
                        if subscriptionManager.isManagedViaWeb {
                            // Stripe subscriber — link to web settings
                            Link(destination: URL(string: "https://www.joinsteward.app/home/settings")!) {
                                HStack(spacing: 10) {
                                    Image(systemName: "globe")
                                        .font(.system(size: 14))
                                    Text("Manage plan on web")
                                        .font(Theme.body(13, weight: .medium))
                                    Spacer()
                                    Image(systemName: "arrow.up.right")
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundStyle(Theme.borderMid)
                                }
                                .foregroundStyle(Theme.ink)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 14)
                                .background(Theme.bgCard)
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(Theme.border, lineWidth: 1)
                                )
                                .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
                            }
                            .padding(.horizontal, 24)
                            .padding(.bottom, 20)
                        } else {
                            // Apple subscriber — link to App Store subscription management
                            Button {
                                if let url = URL(string: "https://apps.apple.com/account/subscriptions") {
                                    UIApplication.shared.open(url)
                                }
                            } label: {
                                HStack(spacing: 10) {
                                    Image(systemName: "creditcard")
                                        .font(.system(size: 14))
                                    Text("Manage subscription")
                                        .font(Theme.body(13, weight: .medium))
                                    Spacer()
                                    Image(systemName: "arrow.up.right")
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundStyle(Theme.borderMid)
                                }
                                .foregroundStyle(Theme.ink)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 14)
                                .background(Theme.bgCard)
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(Theme.border, lineWidth: 1)
                                )
                                .shadow(color: .black.opacity(0.04), radius: 8, y: 4)
                            }
                            .buttonStyle(.plain)
                            .padding(.horizontal, 24)
                            .padding(.bottom, 20)
                        }
                    }

                    // Sign out
                    Button {
                        Task {
                            await authManager.signOut()
                            dismiss()
                        }
                    } label: {
                        HStack {
                            Spacer()
                            Text("Sign out")
                                .font(Theme.body(14, weight: .semibold))
                                .foregroundStyle(Theme.red)
                            Spacer()
                        }
                        .padding(.vertical, 14)
                        .background(Theme.red.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(Theme.red.opacity(0.2), lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 12)

                    // Delete account
                    Button {
                        showDeleteConfirmation = true
                    } label: {
                        HStack {
                            Spacer()
                            if isDeleting {
                                ProgressView()
                                    .controlSize(.small)
                                    .tint(Theme.red)
                            } else {
                                Text("Delete account")
                                    .font(Theme.body(13, weight: .medium))
                                    .foregroundStyle(Theme.red.opacity(0.7))
                            }
                            Spacer()
                        }
                        .padding(.vertical, 12)
                    }
                    .buttonStyle(.plain)
                    .disabled(isDeleting)
                    .padding(.horizontal, 24)
                    .padding(.bottom, 32)

                    if let deleteError {
                        Text(deleteError)
                            .font(Theme.body(11))
                            .foregroundStyle(Theme.red)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 24)
                            .padding(.bottom, 16)
                    }
                }
            }
            .background(Theme.bg)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                        .font(Theme.body(14, weight: .medium))
                        .foregroundStyle(Theme.accent)
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .alert("Delete Account?", isPresented: $showDeleteConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Delete permanently", role: .destructive) {
                isDeleting = true
                deleteError = nil
                Task {
                    do {
                        try await authManager.deleteAccount()
                        dismiss()
                    } catch {
                        deleteError = "Could not delete account. Please try again."
                        isDeleting = false
                    }
                }
            }
        } message: {
            Text("This will permanently delete your account, all your watches, and associated data. This action cannot be undone.")
        }
    }

    // MARK: - Helpers

    private func saveName() {
        let trimmed = editedName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            isEditingName = false
            return
        }
        authManager.displayName = trimmed
        isEditingName = false
        Task {
            guard let userId = authManager.currentUserId else { return }
            _ = try? await SupabaseConfig.client
                .from("profiles")
                .update(["display_name": trimmed])
                .eq("id", value: userId.uuidString)
                .execute()
        }
    }

    private var initials: String {
        let name = authManager.displayName ?? "S"
        let parts = name.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return String(name.prefix(2)).uppercased()
    }

    private var signInMethod: String {
        if let phone = authManager.authPhone, !phone.isEmpty {
            return "Phone number"
        }
        if let email = authManager.authEmail, !email.isEmpty {
            return "Email"
        }
        return "Apple ID"
    }

    private func infoRow(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(Theme.inkLight)
                .frame(width: 24)

            Text(label)
                .font(Theme.body(13))
                .foregroundStyle(Theme.inkMid)

            Spacer()

            Text(value)
                .font(Theme.body(13, weight: .medium))
                .foregroundStyle(Theme.ink)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 13)
    }
}
