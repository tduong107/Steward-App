import Foundation
import Supabase

enum SupabaseConfig {
    static let url = URL(string: "https://lwtzutbaqcafqkpaaaib.supabase.co")!
    static let anonKey = "sb_publishable_p1md1ejTmoPsoJnhrBm9nA_HfVPRd4q"

    static let client = SupabaseClient(
        supabaseURL: url,
        supabaseKey: anonKey
    )
}
