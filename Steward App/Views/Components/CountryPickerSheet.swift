import SwiftUI

/// Modal country picker for the auth screen.
///
/// Presented as a `.sheet(isPresented:)` from `AuthScreen`. The user
/// taps the country chip next to the phone field, this sheet opens
/// with a searchable list of every country in `Country.all`. Selecting
/// a row writes back to the bound `selected` and dismisses the sheet.
///
/// The sheet uses iOS 16+'s native `.searchable` modifier so it gets
/// keyboard navigation, screen-reader semantics, and the system search
/// field treatment without us hand-rolling any of it.
struct CountryPickerSheet: View {
    @Binding var selected: Country
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""

    /// Countries filtered by the current search query. Matches against
    /// name (most common search), dial code (e.g., "+34" or "34"), and
    /// ISO code (e.g., "ES"). Case-insensitive.
    private var filtered: [Country] {
        if query.isEmpty { return Country.all }
        let q = query.lowercased()
        // Strip a leading "+" so a user typing "+34" still matches "+34"
        // (NSString contains is literal, not regex).
        let qDigits = q.replacingOccurrences(of: "+", with: "")
        return Country.all.filter { country in
            country.name.lowercased().contains(q) ||
            country.dial.contains(qDigits) ||
            country.code.lowercased().contains(q)
        }
    }

    var body: some View {
        NavigationStack {
            List(filtered) { country in
                Button {
                    selected = country
                    dismiss()
                } label: {
                    HStack(spacing: 14) {
                        Text(country.flag).font(.system(size: 26))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(country.name)
                                .font(.system(size: 15))
                                .foregroundStyle(.primary)
                            Text(country.dial)
                                .font(.system(size: 12))
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if country.id == selected.id {
                            Image(systemName: "checkmark")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.tint)
                        }
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
            .listStyle(.plain)
            .searchable(
                text: $query,
                placement: .navigationBarDrawer(displayMode: .always),
                prompt: "Search countries"
            )
            .autocorrectionDisabled()
            .navigationTitle("Country")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(.system(size: 15, weight: .medium))
                }
            }
        }
        .presentationDetents([.large])
    }
}

#Preview {
    StatefulPreviewWrapper(Country.default) { binding in
        CountryPickerSheet(selected: binding)
    }
}

/// Tiny helper so #Preview can drive a Binding.
private struct StatefulPreviewWrapper<Value, Content: View>: View {
    @State private var value: Value
    let content: (Binding<Value>) -> Content

    init(_ initial: Value, @ViewBuilder content: @escaping (Binding<Value>) -> Content) {
        self._value = State(initialValue: initial)
        self.content = content
    }

    var body: some View { content($value) }
}
