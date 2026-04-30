/**
 * Friendly error mapping for Supabase phone-auth flows.
 *
 * Mirrors the same mapping shipped on iOS in `Steward App/Views/AuthScreen.swift`.
 * Until this commit, the web auth pages just rendered the raw Supabase
 * error string straight to the user — including misleading "OTP" and
 * "token" wording from Twilio's send-failure responses, which made an
 * "invalid country code" bug look like a "wrong verification code" bug.
 *
 * The split:
 *   - send-failure branch (BEFORE the OTP/token check) — fires when
 *     Twilio rejects the SMS for an unsupported region, malformed
 *     number, missing country code, etc. User is still on the phone-
 *     entry step at this point, so the message has to direct them
 *     back to the country-code picker, not to a non-existent code.
 *   - verify-failure branch — only fires when the user has actually
 *     submitted a code that doesn't match.
 */

export function friendlyAuthError(rawMessage: string): string {
  const m = rawMessage.toLowerCase()

  if (m.includes('invalid login credentials') || m.includes('invalid_credentials')) {
    return 'Incorrect phone number or password.'
  }
  if (m.includes('phone') && m.includes('already')) {
    return 'An account with this phone number already exists. Try signing in.'
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  // SMS-send / phone-format failures (BEFORE any code is generated).
  // Twilio + Supabase wrap these in a variety of messages that all
  // contain one of the substrings below.
  const isSendFailure =
    m.includes('sending') ||                    // "error sending sms otp"
    m.includes('send sms') ||                   // "failed to send sms"
    m.includes('sms_send') ||                   // "sms_send_failed"
    m.includes('send_otp') ||                   // "send_otp_failed"
    m.includes('phone_provider') ||             // "phone_provider_disabled"
    m.includes('phone provider') ||
    (m.includes('phone') && m.includes('invalid')) ||
    (m.includes('phone') && m.includes('not supported')) ||
    (m.includes('phone') && m.includes('not configured')) ||
    (m.includes("'to'") && m.includes('phone')) || // Twilio: "Invalid 'To' Phone Number"
    m.includes('validation_failed')

  if (isSendFailure) {
    return "Couldn't send a code to that number. Double-check the country and your local number, then try again."
  }

  // OTP-verify failures (user submitted a code that's wrong/expired).
  if ((m.includes('otp') || m.includes('token')) && (m.includes('invalid') || m.includes('expired'))) {
    return 'Invalid verification code. Please check and try again.'
  }

  if (m.includes('password') && (m.includes('short') || m.includes('weak'))) {
    return 'Password must be at least 6 characters.'
  }

  return rawMessage
}
