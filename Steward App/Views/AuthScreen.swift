import SwiftUI
import AuthenticationServices
import GoogleSignIn

struct AuthScreen: View {
    @Environment(AuthManager.self) private var authManager

    private let bgTop = Color(red: 0.141, green: 0.239, blue: 0.188)
    private let bgBottom = Color(red: 0.059, green: 0.125, blue: 0.094)
    private let mint = Color(red: 0.431, green: 0.906, blue: 0.718)
    private let cardBg = Color(red: 0.10, green: 0.18, blue: 0.14)

    @State private var logoScale: CGFloat = 0.8
    @State private var logoOpacity: Double = 0
    @State private var contentOpacity: Double = 0

    var initialMode: AuthMode = .signUp
    @State private var authMode: AuthMode = .signIn
    @State private var phoneNumber = ""
    @State private var password = ""
    @State private var fullName = ""
    @State private var otpCode = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var showOTPStep = false
    @State private var showForgotPassword = false
    @State private var forgotPasswordStep: ForgotStep = .enterPhone
    @State private var isSubmitting = false

    enum AuthMode: String {
        case signIn = "Sign In"
        case signUp = "Create Account"
    }

    enum ForgotStep {
        case enterPhone, enterOTP, enterNewPassword
    }

    var body: some View {
        ZStack {
            LinearGradient(colors: [bgTop, bgBottom], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()

            Circle().stroke(mint.opacity(0.04), lineWidth: 1).frame(width: 376, height: 376)
            Circle().stroke(mint.opacity(0.05), lineWidth: 1).frame(width: 296, height: 296)

            ScrollView {
                VStack(spacing: 0) {
                    Spacer().frame(height: 60)

                    StewardLogo(size: 72)
                        .scaleEffect(logoScale).opacity(logoOpacity)

                    Spacer().frame(height: 16)

                    Text("Steward")
                        .font(.custom("Georgia-Bold", size: 22))
                        .foregroundStyle(.white.opacity(0.95))
                        .opacity(contentOpacity)

                    Text("Your personal AI concierge")
                        .font(.system(size: 13)).foregroundStyle(mint.opacity(0.5))
                        .opacity(contentOpacity)

                    Spacer().frame(height: 28)

                    // Main content
                    Group {
                        if showForgotPassword {
                            forgotPasswordForm
                        } else if showOTPStep {
                            otpVerificationForm
                        } else {
                            mainAuthForm
                        }
                    }
                    .opacity(contentOpacity)

                    // Social auth
                    if !showOTPStep && !showForgotPassword {
                        orDivider.padding(.vertical, 20).opacity(contentOpacity)
                        socialButtons.opacity(contentOpacity)
                    }

                    Spacer().frame(height: 24)
                    termsView.opacity(contentOpacity)
                    Spacer().frame(height: 40)
                }
                .padding(.horizontal, 32)
            }
        }
        .onAppear {
            authMode = initialMode
            withAnimation(.easeOut(duration: 0.5)) { logoScale = 1.0; logoOpacity = 1.0 }
            withAnimation(.easeOut(duration: 0.5).delay(0.25)) { contentOpacity = 1.0 }
        }
    }

    // MARK: - Main Auth Form

    private var mainAuthForm: some View {
        VStack(spacing: 16) {
            // Mode toggle
            HStack(spacing: 0) {
                ForEach([AuthMode.signIn, .signUp], id: \.rawValue) { mode in
                    Button {
                        withAnimation(.spring(response: 0.3)) { authMode = mode; authManager.errorMessage = nil }
                    } label: {
                        Text(mode.rawValue)
                            .font(.system(size: 13, weight: authMode == mode ? .semibold : .regular))
                            .foregroundStyle(authMode == mode ? .white : mint.opacity(0.5))
                            .frame(maxWidth: .infinity).padding(.vertical, 10)
                            .background(authMode == mode ? mint.opacity(0.15) : .clear)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
            .padding(3).background(cardBg).clipShape(RoundedRectangle(cornerRadius: 12))

            // Name (signup only)
            if authMode == .signUp {
                authTextField(icon: "person", placeholder: "Full Name", text: $fullName, contentType: .name)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }

            // Phone
            authTextField(icon: "phone", placeholder: "Phone Number", text: $phoneNumber, keyboardType: .phonePad, contentType: .telephoneNumber)

            if authMode == .signUp {
                Text("We'll text a code to verify your number")
                    .font(.system(size: 11)).foregroundStyle(mint.opacity(0.4))
                    .frame(maxWidth: .infinity, alignment: .leading).padding(.top, -8)
            }

            // Password
            authSecureField(icon: "lock", placeholder: authMode == .signUp ? "Password (min 6 characters)" : "Password", text: $password)

            if authMode == .signIn {
                Button {
                    withAnimation { showForgotPassword = true; forgotPasswordStep = .enterPhone; authManager.errorMessage = nil }
                } label: {
                    Text("Forgot password?")
                        .font(.system(size: 12, weight: .medium)).foregroundStyle(mint.opacity(0.6))
                }
                .frame(maxWidth: .infinity, alignment: .trailing).padding(.top, -8)
            }

            // Error
            if let error = authManager.errorMessage {
                Text(error).font(.system(size: 12)).foregroundStyle(.red.opacity(0.8))
                    .multilineTextAlignment(.center).transition(.opacity)
            }

            // Submit
            Button { Task { await handleSubmit() } } label: {
                HStack(spacing: 8) {
                    if isSubmitting { ProgressView().controlSize(.small).tint(.white) }
                    else { Text(authMode.rawValue).font(.system(size: 15, weight: .semibold)) }
                }
                .foregroundStyle(bgBottom).frame(maxWidth: .infinity).padding(.vertical, 14)
                .background(mint).clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .disabled(isSubmitting || !isFormValid).opacity(isFormValid ? 1.0 : 0.5)
        }
    }

    // MARK: - OTP Verification

    private var otpVerificationForm: some View {
        VStack(spacing: 16) {
            backButton { withAnimation { showOTPStep = false; otpCode = ""; authManager.errorMessage = nil } }

            VStack(spacing: 6) {
                Text("Verify Your Phone").font(.system(size: 17, weight: .semibold)).foregroundStyle(.white)
                Text("We sent a 6-digit code to \(formatPhoneDisplay(phoneNumber))")
                    .font(.system(size: 13)).foregroundStyle(mint.opacity(0.6)).multilineTextAlignment(.center)
            }

            authTextField(icon: "number", placeholder: "6-digit code", text: $otpCode, keyboardType: .numberPad, contentType: .oneTimeCode)

            if let error = authManager.errorMessage {
                Text(error).font(.system(size: 12)).foregroundStyle(.red.opacity(0.8)).multilineTextAlignment(.center)
            }

            Button { Task { await handleVerifyOTP() } } label: {
                submitLabel("Verify & Continue", icon: "checkmark.shield")
            }
            .disabled(isSubmitting || otpCode.count < 6).opacity(otpCode.count >= 6 ? 1.0 : 0.5)

            Button { Task { await handleResendOTP() } } label: {
                Text("Didn't receive a code? Resend").font(.system(size: 12)).foregroundStyle(mint.opacity(0.5))
            }.disabled(isSubmitting)
        }
    }

    // MARK: - Forgot Password

    private var forgotPasswordForm: some View {
        VStack(spacing: 16) {
            backButton { withAnimation { showForgotPassword = false; forgotPasswordStep = .enterPhone; authManager.errorMessage = nil } }

            VStack(spacing: 6) {
                Text("Reset Password").font(.system(size: 17, weight: .semibold)).foregroundStyle(.white)
                Text(forgotStepSubtitle).font(.system(size: 13)).foregroundStyle(mint.opacity(0.6)).multilineTextAlignment(.center)
            }

            switch forgotPasswordStep {
            case .enterPhone:
                authTextField(icon: "phone", placeholder: "Phone Number", text: $phoneNumber, keyboardType: .phonePad, contentType: .telephoneNumber)
                errorView

                Button { Task { await handleSendResetOTP() } } label: {
                    submitLabel("Send Reset Code", icon: nil)
                }
                .disabled(isSubmitting || normalizedPhone.count < 10).opacity(normalizedPhone.count >= 10 ? 1.0 : 0.5)

            case .enterOTP:
                authTextField(icon: "number", placeholder: "6-digit code", text: $otpCode, keyboardType: .numberPad, contentType: .oneTimeCode)
                errorView

                Button { withAnimation { forgotPasswordStep = .enterNewPassword; authManager.errorMessage = nil } } label: {
                    submitLabel("Next", icon: nil)
                }
                .disabled(otpCode.count < 6).opacity(otpCode.count >= 6 ? 1.0 : 0.5)

            case .enterNewPassword:
                authSecureField(icon: "lock", placeholder: "New Password", text: $newPassword)
                authSecureField(icon: "lock.fill", placeholder: "Confirm Password", text: $confirmPassword)

                if newPassword.count >= 6 && newPassword != confirmPassword {
                    Text("Passwords don't match").font(.system(size: 12)).foregroundStyle(.red.opacity(0.8))
                }
                errorView

                Button { Task { await handleResetPassword() } } label: {
                    submitLabel("Reset Password", icon: nil)
                }
                .disabled(isSubmitting || newPassword.count < 6 || newPassword != confirmPassword)
                .opacity(newPassword.count >= 6 && newPassword == confirmPassword ? 1.0 : 0.5)
            }
        }
    }

    private var forgotStepSubtitle: String {
        switch forgotPasswordStep {
        case .enterPhone: return "Enter your phone number to receive a reset code"
        case .enterOTP: return "Enter the 6-digit code sent to \(formatPhoneDisplay(phoneNumber))"
        case .enterNewPassword: return "Choose a new password (minimum 6 characters)"
        }
    }

    // MARK: - Social Auth

    private var socialButtons: some View {
        VStack(spacing: 12) {
            // Google
            Button {
                Task {
                    isSubmitting = true; authManager.errorMessage = nil
                    do { try await authManager.signInWithGoogle() }
                    catch { if !"\(error)".contains("canceled") { authManager.errorMessage = error.localizedDescription } }
                    isSubmitting = false
                }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "g.circle.fill").font(.system(size: 18))
                    Text("Continue with Google").font(.system(size: 14, weight: .semibold))
                }
                .foregroundStyle(.white).frame(maxWidth: .infinity).frame(height: 50)
                .background(Color.white.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.15), lineWidth: 1))
            }.disabled(isSubmitting)

            // Apple
            SignInWithAppleButton(.signIn) { request in
                request.requestedScopes = [.fullName, .email]
            } onCompletion: { result in handleAppleSignIn(result) }
            .signInWithAppleButtonStyle(.white)
            .frame(height: 50).clipShape(RoundedRectangle(cornerRadius: 14))
        }
    }

    // MARK: - Shared Components

    @ViewBuilder private var errorView: some View {
        if let error = authManager.errorMessage {
            Text(error).font(.system(size: 12)).foregroundStyle(.red.opacity(0.8)).multilineTextAlignment(.center)
        }
    }

    private func backButton(action: @escaping () -> Void) -> some View {
        HStack {
            Button(action: action) {
                HStack(spacing: 4) {
                    Image(systemName: "chevron.left").font(.system(size: 12, weight: .semibold))
                    Text("Back").font(.system(size: 13, weight: .medium))
                }.foregroundStyle(mint)
            }
            Spacer()
        }
    }

    private func submitLabel(_ text: String, icon: String?) -> some View {
        HStack(spacing: 8) {
            if isSubmitting { ProgressView().controlSize(.small).tint(.white) }
            else {
                if let icon { Image(systemName: icon).font(.system(size: 14, weight: .semibold)) }
                Text(text).font(.system(size: 15, weight: .semibold))
            }
        }
        .foregroundStyle(bgBottom).frame(maxWidth: .infinity).padding(.vertical, 14)
        .background(mint).clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var orDivider: some View {
        HStack(spacing: 12) {
            Rectangle().fill(mint.opacity(0.15)).frame(height: 1)
            Text("or continue with").font(.system(size: 12)).foregroundStyle(mint.opacity(0.35))
            Rectangle().fill(mint.opacity(0.15)).frame(height: 1)
        }
    }

    private var termsView: some View {
        VStack(spacing: 4) {
            Text(authMode == .signUp ? "By creating an account, you agree to our" : "By signing in, you agree to our")
                .font(.system(size: 11)).foregroundStyle(mint.opacity(0.35))
            HStack(spacing: 4) {
                Link("Terms", destination: URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")!)
                Text("and").foregroundStyle(mint.opacity(0.35))
                Link("Privacy Policy", destination: URL(string: "https://www.joinsteward.app/privacy")!)
            }
            .font(.system(size: 11, weight: .medium)).tint(mint.opacity(0.7))
        }.multilineTextAlignment(.center)
    }

    private func authTextField(icon: String, placeholder: String, text: Binding<String>, keyboardType: UIKeyboardType = .default, contentType: UITextContentType? = nil) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 15)).foregroundStyle(mint.opacity(0.5)).frame(width: 20)
            TextField("", text: text, prompt: Text(placeholder).foregroundStyle(mint.opacity(0.3)))
                .font(.system(size: 15)).foregroundStyle(.white)
                .keyboardType(keyboardType).textContentType(contentType).autocorrectionDisabled()
        }
        .padding(.horizontal, 16).padding(.vertical, 14)
        .background(cardBg).clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(mint.opacity(0.1), lineWidth: 1))
    }

    private func authSecureField(icon: String, placeholder: String, text: Binding<String>) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 15)).foregroundStyle(mint.opacity(0.5)).frame(width: 20)
            SecureField("", text: text, prompt: Text(placeholder).foregroundStyle(mint.opacity(0.3)))
                .font(.system(size: 15)).foregroundStyle(.white).textContentType(.password)
        }
        .padding(.horizontal, 16).padding(.vertical, 14)
        .background(cardBg).clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(mint.opacity(0.1), lineWidth: 1))
    }

    // MARK: - Validation

    private var isFormValid: Bool {
        let phoneValid = normalizedPhone.count >= 10
        if authMode == .signUp { return phoneValid && !fullName.trimmingCharacters(in: .whitespaces).isEmpty && password.count >= 6 }
        return phoneValid && password.count >= 6
    }

    private var normalizedPhone: String {
        let digits = phoneNumber.filter { $0.isNumber }
        if phoneNumber.hasPrefix("+") { return "+\(digits)" }
        else if digits.count == 10 { return "+1\(digits)" }
        else if digits.count == 11 && digits.hasPrefix("1") { return "+\(digits)" }
        return "+\(digits)"
    }

    private func formatPhoneDisplay(_ phone: String) -> String {
        let digits = phone.filter { $0.isNumber }
        if digits.count == 10 { return "(\(digits.prefix(3))) \(digits.dropFirst(3).prefix(3))-\(digits.suffix(4))" }
        return phone
    }

    // MARK: - Actions

    private func handleSubmit() async {
        isSubmitting = true; authManager.errorMessage = nil
        do {
            if authMode == .signUp {
                try await authManager.signUp(phone: normalizedPhone, password: password, name: fullName.trimmingCharacters(in: .whitespaces))
                if !authManager.isAuthenticated { withAnimation(.spring(response: 0.3)) { showOTPStep = true } }
            } else {
                try await authManager.signIn(phone: normalizedPhone, password: password)
            }
        } catch { authManager.errorMessage = friendlyError(error) }
        isSubmitting = false
    }

    private func handleVerifyOTP() async {
        isSubmitting = true; authManager.errorMessage = nil
        do { try await authManager.verifyOTP(phone: normalizedPhone, code: otpCode, name: fullName.trimmingCharacters(in: .whitespaces)) }
        catch { authManager.errorMessage = friendlyError(error) }
        isSubmitting = false
    }

    private func handleResendOTP() async {
        isSubmitting = true; authManager.errorMessage = nil
        do { try await authManager.signUp(phone: normalizedPhone, password: password, name: fullName.trimmingCharacters(in: .whitespaces)) }
        catch { authManager.errorMessage = friendlyError(error) }
        isSubmitting = false
    }

    private func handleSendResetOTP() async {
        isSubmitting = true; authManager.errorMessage = nil
        do {
            try await authManager.sendPasswordResetOTP(phone: normalizedPhone)
            withAnimation { forgotPasswordStep = .enterOTP }
        } catch { authManager.errorMessage = friendlyError(error) }
        isSubmitting = false
    }

    private func handleResetPassword() async {
        isSubmitting = true; authManager.errorMessage = nil
        do {
            try await authManager.resetPassword(phone: normalizedPhone, otp: otpCode, newPassword: newPassword)
            withAnimation {
                showForgotPassword = false; forgotPasswordStep = .enterPhone
                otpCode = ""; newPassword = ""; confirmPassword = ""; password = ""
                authMode = .signIn
            }
            authManager.errorMessage = "Password reset! Sign in with your new password."
        } catch { authManager.errorMessage = friendlyError(error) }
        isSubmitting = false
    }

    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            guard let credential = auth.credential as? ASAuthorizationAppleIDCredential else {
                authManager.errorMessage = "Unexpected credential type."; return
            }
            Task {
                do { try await authManager.signInWithApple(credential: credential) }
                catch { authManager.errorMessage = error.localizedDescription }
            }
        case .failure(let error):
            if (error as? ASAuthorizationError)?.code == .canceled { return }
            authManager.errorMessage = error.localizedDescription
        }
    }

    private func friendlyError(_ error: Error) -> String {
        let msg = error.localizedDescription.lowercased()
        if msg.contains("invalid login credentials") || msg.contains("invalid_credentials") { return "Incorrect phone number or password." }
        if msg.contains("phone") && msg.contains("already") { return "An account with this phone number already exists. Try signing in." }
        if msg.contains("rate limit") || msg.contains("too many") { return "Too many attempts. Please wait a moment and try again." }
        if msg.contains("otp") || msg.contains("token") { return "Invalid verification code. Please check and try again." }
        if msg.contains("password") && (msg.contains("short") || msg.contains("weak")) { return "Password must be at least 6 characters." }
        return error.localizedDescription
    }
}
