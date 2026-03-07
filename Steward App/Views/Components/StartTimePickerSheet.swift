import SwiftUI

struct StartTimePickerSheet: View {
    @Binding var preferredTime: String?
    @Environment(\.dismiss) private var dismiss
    @State private var selectedTime = Date()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Check Start Time")
                            .font(Theme.serif(20, weight: .bold))
                            .foregroundStyle(Theme.ink)

                        Text("Set when Steward should start checking. All future checks will align to this time based on your check frequency.")
                            .font(Theme.body(13))
                            .foregroundStyle(Theme.inkLight)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 24)
                    .padding(.top, 16)

                    DatePicker("", selection: $selectedTime, displayedComponents: .hourAndMinute)
                        .datePickerStyle(.wheel)
                        .labelsHidden()

                    VStack(spacing: 12) {
                        Button {
                            let formatter = DateFormatter()
                            formatter.dateFormat = "HH:mm"
                            preferredTime = formatter.string(from: selectedTime)
                            dismiss()
                        } label: {
                            Text("Set Time")
                                .font(Theme.body(14, weight: .semibold))
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Theme.accent)
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                        }

                        Button {
                            // Reset to current time
                            let formatter = DateFormatter()
                            formatter.dateFormat = "HH:mm"
                            preferredTime = formatter.string(from: Date())
                            dismiss()
                        } label: {
                            Text("Reset to Current Time")
                                .font(Theme.body(13))
                                .foregroundStyle(Theme.inkLight)
                        }
                    }
                    .padding(.horizontal, 24)
                }
                .padding(.bottom, 24)
            }
            .background(Theme.bg)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .font(Theme.body(14))
                        .foregroundStyle(Theme.inkMid)
                }
            }
        }
        .onAppear {
            // Initialize picker with existing time
            if let timeStr = preferredTime {
                let parts = timeStr.split(separator: ":")
                if parts.count == 2,
                   let h = Int(parts[0]), let m = Int(parts[1]) {
                    var comps = Calendar.current.dateComponents([.year, .month, .day], from: Date())
                    comps.hour = h
                    comps.minute = m
                    if let date = Calendar.current.date(from: comps) {
                        selectedTime = date
                    }
                }
            }
        }
    }
}
