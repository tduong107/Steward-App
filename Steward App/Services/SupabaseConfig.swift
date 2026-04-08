import Foundation
import Supabase

enum SupabaseConfig {
    nonisolated(unsafe) static let url = URL(string: "https://lwtzutbaqcafqkpaaaib.supabase.co")!
    nonisolated(unsafe) static let anonKey = "sb_publishable_p1md1ejTmoPsoJnhrBm9nA_HfVPRd4q"

    static let client = SupabaseClient(
        supabaseURL: url,
        supabaseKey: anonKey
    )
}
