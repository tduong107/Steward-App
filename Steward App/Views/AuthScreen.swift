import SwiftUI
import AuthenticationServices

struct AuthScreen: View {
    @Environment(AuthManager.self) private var authManager

    // Colors matching the splash / icon
    private let bgTop = Color(red: 0.141, green: 0.239, blue: 0.188)
    private let bgBottom = Color(red: 0.059, green: 0.125, blue: 0.094)
    private let mint = Color(red: 0.431, green: 0.906, blue: 0.718)
    private let cardBg = Color(red: 0.10, green: 0.18, blue: 0.14)

    // Animation state
    @State private var logoScale: CGFloat = 0.8
    @State private var logoOpacity: Double = 0
    @State private var contentOpacity: Double = 0

    // Auth form state
    @State private var authMode: AuthMode = .signIn
    @State private var phoneNumber = ""
    @State private var password = ""
    @State private var fullName = ""
    @State private var otpCode = ""
    @State private var showOTPStep = false
    @State private var isSubmitting = false

    enum AuthMode: String {
        case signIn = "Sign In"
        case signUp = "Create Account"
    }

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [bgTop, bgBottom],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            // Concentric rings (decorative)
            Circle()
                .stroke(mint.opacity(0.04), lineWidth: 1)
                .frame(width: 376, height: 376)

            Circle()
                .stroke(mint.opacity(0.05), lineWidth: 1)
                .frame(width: 296, height: 296)

            ScrollView {
                VStack(spacing: 0) {
                    Spacer().frame(height: 60)

                    // Logo
                    StewardLogo(size: 80)
                        .scaleEffect(logoScale)
                        .opacity(logoOpacity)

                    Spacer().frame(height: 20)

                    // Title
                    Text("STEWARD")
                        .font(.custom("Georgia-Bold", size: 24))
                        .tracking(9)
                        .foregroundStyle(.white.opacity(0.95))
                        .opacity(contentOpacity)

                    Spacer().frame(height: 6)

                    Text("Your personal AI concierge")
                        .font(.custom("Georgia", size: 13))
                        .foregroundStyle(mint.opacity(0.5))
                        .opacity(contentOpacity)

                    Spacer().frame(height: 36)

                    // Auth form
                    VStack(spacing: 0) {
                        if showOTPStep {
                            otpVerificationForm
                        } else {
                            phonePasswordForm
                        }
                    }
                    .opacity(contentOpacity)

                    Spacer().frame(height: 20)

                    // Divider
                    if !showOTPStep {
                        orDivider
                            .opacity(contentOpacity)

                        Spacer().frame(height: 20)

                        // Apple Sign-In (secondary)
                        appleSignIn
                            .opacity(contentOpacity)
                    }

                    Spacer().frame(height: 24)

                    // Terms
                    Text("By signing in, you agree to our [\(Text("Terms of Service").underline())](https://steward.app/terms) and [\(Text("Privacy Policy").underline())](https://steward.app/privacy).")
                        .font(.system(size: 11, weight: .regular))
                        .foregroundStyle(mint.opacity(0.35))
                        .tint(mint.opacity(0.6))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 20)
                        .opacity(contentOpacity)

                    Spacer().frame(height: 40)
                }
                .padding(.horizontal, 32)
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.5)) {
                logoScale = 1.0
                logoOpacity = 1.0
            }
            withAnimation(.easeOut(duration: 0.5).delay(0.25)) {
                contentOpacity = 1.0
            }
        }
    }

    // MARK: - Phone + Password Form

    private var phonePasswordForm: some View {
        VStack(spacing: 16) {
            // Mode toggle
            HStack(spacing: 0) {
                ForEach([AuthMode.signIn, .signUp], id: \.rawValue) { mode in
                    Button {
                        withAnimation(.spring(response: 0.3)) {
                            authMode = mode
                            authManager.errorMessage = nil
                        }
                    } label: {
                        Text(mode.rawValue)
                            .font(.system(size: 13, weight: authMode == mode ? .semibold : .regular))
                            .foregroundStyle(authMode == mode ? .white : mint.opacity(0.5))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(authMode == mode ? mint.opacity(0.15) : .clear)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
            .padding(3)
            .background(cardBg)
            .clipShape(RoundedRectangle(cornerRadius: 12))

            // Name field (sign up only)
            if authMode == .signUp {
                authTextField(
                    icon: "person",
                    placeholder: "Full Name",
                    text: $fullName,
                    keyboardType: .default,
                    contentType: .name
                )
                .transition(.opacity.combined(with: .move(edge: .top)))
            }

            // Phone field
            authTextField(
                icon: "phone",
                placeholder: "Phone Number",
                text: $phoneNumber,
                keyboardType: .phonePad,
                contentType: .telephoneNumber
            )

            // Password field
            authSecureField(
                icon: "lock",
                placeholder: "Password",
                text: $password
            )

            // Error message
            if let error = authManager.errorMessage {
                Text(error)
                    .font(.system(size: 12))
                    .foregroundStyle(.red.opacity(0.8))
                    .multilineTextAlignment(.center)
                    .transition(.opacity)
            }

            // Submit button
            Button {
                Task { await handleSubmit() }
            } label: {
                HStack(spacing: 8) {
                    if isSubmitting {
                        ProgressView()
                            .controlSize(.small)
                            .tint(.white)
                    } else {
                        Image(systemName: authMode == .signIn ? "arrow.right" : "person.badge.plus")
                            .font(.system(size: 14, weight: .semibold))
                        Text(authMode.rawValue)
                            .font(.system(size: 15, weight: .semibold))
                    }
                }
                .foregroundStyle(bgBottom)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(mint)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .disabled(isSubmitting || !isFormValid)
            .opacity(isFormValid ? 1.0 : 0.5)
        }
    }

    // MARK: - OTP Verification Form

    private var otpVerificationForm: some View {
        VStack(spacing: 16) {
            // Back button
            HStack {
                Button {
                    withAnimation(.spring(response: 0.3)) {
                        showOTPStep = false
                        otpCode = ""
                        authManager.errorMessage = nil
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 12, weight: .semibold))
                        Text("Back")
                            .font(.system(size: 13, weight: .medium))
                    }
                    .foregroundStyle(mint)
                }
                Spacer()
            }

            VStack(spacing: 6) {
                Text("Verify Your Phone")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(.white)

                Text("We sent a 6-digit code to \(formatPhoneDisplay(phoneNumber))")
                    .font(.system(size: 13))
                    .foregroundStyle(mint.opacity(0.6))
                    .multilineTextAlignment(.center)
            }

            // OTP input
            authTextField(
                icon: "number",
                placeholder: "6-digit code",
                text: $otpCode,
                keyboardType: .numberPad,
                contentType: .oneTimeCode
            )

            // Error message
            if let error = authManager.errorMessage {
                Text(error)
                    .font(.system(size: 12))
                    .foregroundStyle(.red.opacity(0.8))
                    .multilineTextAlignment(.center)
            }

            // Verify button
            Button {
                Task { await handleVerifyOTP() }
            } label: {
                HStack(spacing: 8) {
                    if isSubmitting {
                        ProgressView()
                            .controlSize(.small)
                            .tint(.white)
                    } else {
                        Image(systemName: "checkmark.shield")
                            .font(.system(size: 14, weight: .semibold))
                        Text("Verify & Continue")
                            .font(.system(size: 15, weight: .semibold))
                    }
                }
                .foregroundStyle(bgBottom)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(mint)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .disabled(isSubmitting || otpCode.count < 6)
            .opacity(otpCode.count >= 6 ? 1.0 : 0.5)

            // Resend code
            Button {
                Task { await handleResendOTP() }
            } label: {
                Text("Didn't receive a code? Resend")
                    .font(.system(size: 12))
                    .foregroundStyle(mint.opacity(0.5))
            }
            .disabled(isSubmitting)
        }
    }

    // MARK: - Apple Sign-In (secondary)

    private var appleSignIn: some View {
        SignInWithAppleButton(.signIn) { request in
            request.requestedScopes = [.fullName, .email]
        } onCompletion: { result in
            handleAppleSignIn(result)
        }
        .signInWithAppleButtonStyle(.white)
        .frame(height: 50)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var orDivider: some View {
        HStack(spacing: 12) {
            Rectangle()
                .fill(mint.opacity(0.15))
                .frame(height: 1)
            Text("or")
                .font(.system(size: 12))
                .foregroundStyle(mint.opacity(0.35))
            Rectangle()
                .fill(mint.opacity(0.15))
                .frame(height: 1)
        }
    }

    // MARK: - Form Components

    private func authTextField(
        icon: String,
        placeholder: String,
        text: Binding<String>,
        keyboardType: UIKeyboardType = .default,
        contentType: UITextContentType? = nil
    ) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 15))
                .foregroundStyle(mint.opacity(0.5))
                .frame(width: 20)

            TextField("", text: text, prompt: Text(placeholder).foregroundStyle(mint.opacity(0.3)))
                .font(.system(size: 15))
                .foregroundStyle(.white)
                .keyboardType(keyboardType)
                .textContentType(contentType)
                .autocorrectionDisabled()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(cardBg)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(mint.opacity(0.1), lineWidth: 1)
        )
    }

    private func authSecureField(icon: String, placeholder: String, text: Binding<String>) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 15))
                .foregroundStyle(mint.opacity(0.5))
                .frame(width: 20)

            SecureField("", text: text, prompt: Text(placeholder).foregroundStyle(mint.opacity(0.3)))
                .font(.system(size: 15))
                .foregroundStyle(.white)
                .textContentType(.password)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(cardBg)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(mint.opacity(0.1), lineWidth: 1)
        )
    }

    // MARK: - Validation

    private var isFormValid: Bool {
        let phoneValid = normalizedPhone.count >= 10
        let passwordValid = password.count >= 6
        if authMode == .signUp {
            return phoneValid && passwordValid && !fullName.trimmingCharacters(in: .whitespaces).isEmpty
        }
        return phoneValid && passwordValid
    }

    /// Normalizes phone to E.164 format (adds +1 for US if not prefixed)
    private var normalizedPhone: String {
        let digits = phoneNumber.filter { $0.isNumber }
        if phoneNumber.hasPrefix("+") {
            return "+\(digits)"
        } else if digits.count == 10 {
            return "+1\(digits)"
        } else if digits.count == 11 && digits.hasPrefix("1") {
            return "+\(digits)"
        }
        return "+\(digits)"
    }

    private func formatPhoneDisplay(_ phone: String) -> String {
        let digits = phone.filter { $0.isNumber }
        if digits.count == 10 {
            let area = digits.prefix(3)
            let mid = digits.dropFirst(3).prefix(3)
            let last = digits.suffix(4)
            return "(\(area)) \(mid)-\(last)"
        }
        return phone
    }

    // MARK: - Actions

    private func handleSubmit() async {
        isSubmitting = true
        authManager.errorMessage = nil

        do {
            if authMode == .signUp {
                try await authManager.signUp(
                    phone: normalizedPhone,
                    password: password,
                    name: fullName.trimmingCharacters(in: .whitespaces)
                )

                // If not authenticated yet, need OTP verification
                if !authManager.isAuthenticated {
                    withAnimation(.spring(response: 0.3)) {
                        showOTPStep = true
                    }
                }
            } else {
                try await authManager.signIn(phone: normalizedPhone, password: password)
            }
        } catch {
            authManager.errorMessage = friendlyError(error)
        }

        isSubmitting = false
    }

    private func handleVerifyOTP() async {
        isSubmitting = true
        authManager.errorMessage = nil

        do {
            try await authManager.verifyOTP(
                phone: normalizedPhone,
                code: otpCode,
                name: fullName.trimmingCharacters(in: .whitespaces)
            )
        } catch {
            authManager.errorMessage = friendlyError(error)
        }

        isSubmitting = false
    }

    private func handleResendOTP() async {
        isSubmitting = true
        authManager.errorMessage = nil

        do {
            // Re-trigger sign-up which resends OTP
            try await authManager.signUp(
                phone: normalizedPhone,
                password: password,
                name: fullName.trimmingCharacters(in: .whitespaces)
            )
            authManager.errorMessage = nil
        } catch {
            authManager.errorMessage = friendlyError(error)
        }

        isSubmitting = false
    }

    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
                authManager.errorMessage = "Unexpected credential type."
                return
            }
            Task {
                do {
                    try await authManager.signInWithApple(credential: credential)
                } catch {
                    authManager.errorMessage = error.localizedDescription
                }
            }

        case .failure(let error):
            // ASAuthorizationError.canceled means user dismissed the dialog — not an error
            if (error as? ASAuthorizationError)?.code == .canceled { return }
            authManager.errorMessage = error.localizedDescription
        }
    }

    /// Converts Supabase errors to user-friendly messages
    private func friendlyError(_ error: Error) -> String {
        let msg = error.localizedDescription.lowercased()
        if msg.contains("invalid login credentials") || msg.contains("invalid_credentials") {
            return "Incorrect phone number or password."
        }
        if msg.contains("phone") && msg.contains("already") {
            return "An account with this phone number already exists. Try signing in."
        }
        if msg.contains("rate limit") || msg.contains("too many") {
            return "Too many attempts. Please wait a moment and try again."
        }
        if msg.contains("otp") || msg.contains("token") {
            return "Invalid verification code. Please check and try again."
        }
        if msg.contains("password") && (msg.contains("short") || msg.contains("weak")) {
            return "Password must be at least 6 characters."
        }
        return error.localizedDescription
    }
}
