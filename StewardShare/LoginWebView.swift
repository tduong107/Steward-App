import SwiftUI
import WebKit

// MARK: - Serialized Cookie Model

/// A Codable representation of an HTTP cookie for storage and server-side use.
struct SerializedCookie: Codable, Equatable {
    let name: String
    let value: String
    let domain: String
    let path: String
    let expiresDate: Double?   // timeIntervalSince1970, nil if session-only
    let isSecure: Bool
    let isHTTPOnly: Bool
}

// MARK: - Login WebView

/// An in-extension WebView that lets the user log in to an auth-walled site,
/// then captures session cookies for server-side content checking.
struct LoginWebView: View {
    let url: URL
    let targetDomain: String
    let onCookiesCaptured: ([SerializedCookie]) -> Void
    let onDismiss: () -> Void

    @State private var currentHost: String = ""
    @State private var isLoading = true
    @State private var webViewStore = LoginWebViewStore()

    // Steward colors (local — no Theme dependency in share extension)
    private let accentGreen = Color(red: 0.165, green: 0.361, blue: 0.271)
    private let mintGreen = Color(red: 0.431, green: 0.906, blue: 0.718)
    private let darkBg = Color(red: 0.07, green: 0.08, blue: 0.07)
    private let cardBg = Color(red: 0.12, green: 0.13, blue: 0.12)

    var body: some View {
        VStack(spacing: 0) {
            // -- Top bar --
            HStack(spacing: 10) {
                Button {
                    onDismiss()
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.gray)
                }

                // URL bar
                HStack(spacing: 6) {
                    if isLoading {
                        ProgressView()
                            .controlSize(.small)
                            .tint(mintGreen)
                    } else {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 9))
                            .foregroundStyle(.gray)
                    }
                    Text(currentHost.isEmpty ? targetDomain : currentHost)
                        .font(.system(size: 12))
                        .foregroundStyle(.white.opacity(0.8))
                        .lineLimit(1)
                        .truncationMode(.middle)
                    Spacer()
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(cardBg)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)

            if isLoading {
                ProgressView()
                    .progressViewStyle(.linear)
                    .tint(mintGreen)
            }

            // -- WebView --
            LoginWebViewRepresentable(
                url: url,
                store: webViewStore,
                onHostChange: { host in
                    currentHost = host
                },
                onLoadingChange: { loading in
                    isLoading = loading
                }
            )

            // -- Bottom: "Done logging in" button --
            VStack(spacing: 0) {
                Divider()
                    .overlay(Color.white.opacity(0.08))

                Button {
                    captureAndDismiss()
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 16))
                        Text("Done logging in")
                            .font(.system(size: 15, weight: .semibold))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                    .background(accentGreen)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)

                Text("Your login session will be used to check this page")
                    .font(.system(size: 11))
                    .foregroundStyle(.gray)
                    .padding(.bottom, 8)
            }
            .background(darkBg)
        }
        .background(darkBg)
    }

    /// Extracts cookies from the WebView and passes them back
    private func captureAndDismiss() {
        guard let webView = webViewStore.webView else {
            onDismiss()
            return
        }

        webView.configuration.websiteDataStore.httpCookieStore.getAllCookies { httpCookies in
            // Filter to cookies matching the target domain
            let domainSuffix = targetDomain.lowercased()
                .replacingOccurrences(of: "www.", with: "")

            let relevantCookies = httpCookies.filter { cookie in
                let cookieDomain = cookie.domain.lowercased()
                    .trimmingCharacters(in: CharacterSet(charactersIn: "."))
                return cookieDomain.hasSuffix(domainSuffix) || domainSuffix.hasSuffix(cookieDomain)
            }

            let serialized = relevantCookies.map { cookie in
                SerializedCookie(
                    name: cookie.name,
                    value: cookie.value,
                    domain: cookie.domain,
                    path: cookie.path,
                    expiresDate: cookie.expiresDate?.timeIntervalSince1970,
                    isSecure: cookie.isSecure,
                    isHTTPOnly: cookie.isHTTPOnly
                )
            }

            DispatchQueue.main.async {
                if serialized.isEmpty {
                    // No cookies found — still dismiss, user might not have logged in
                    onDismiss()
                } else {
                    onCookiesCaptured(serialized)
                }
            }
        }
    }
}

// MARK: - WebView Store

@Observable
class LoginWebViewStore {
    var webView: WKWebView?
}

// MARK: - WKWebView UIViewRepresentable

struct LoginWebViewRepresentable: UIViewRepresentable {
    let url: URL
    let store: LoginWebViewStore
    let onHostChange: (String) -> Void
    let onLoadingChange: (Bool) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onHostChange: onHostChange, onLoadingChange: onLoadingChange)
    }

    func makeUIView(context: Context) -> WKWebView {
        // Use a NON-persistent data store so cookies are isolated to this session
        let dataStore = WKWebsiteDataStore.nonPersistent()
        let config = WKWebViewConfiguration()
        config.websiteDataStore = dataStore
        config.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true

        // Mobile user agent for better login form compatibility
        webView.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"

        DispatchQueue.main.async {
            store.webView = webView
        }

        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    class Coordinator: NSObject, WKNavigationDelegate {
        let onHostChange: (String) -> Void
        let onLoadingChange: (Bool) -> Void

        init(onHostChange: @escaping (String) -> Void, onLoadingChange: @escaping (Bool) -> Void) {
            self.onHostChange = onHostChange
            self.onLoadingChange = onLoadingChange
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            onLoadingChange(true)
            if let host = webView.url?.host {
                onHostChange(host)
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            onLoadingChange(false)
            if let host = webView.url?.host {
                onHostChange(host)
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            onLoadingChange(false)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            onLoadingChange(false)
        }
    }
}
