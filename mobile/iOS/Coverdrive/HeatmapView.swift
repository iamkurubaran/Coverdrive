import SwiftUI

// "Innings Map" — the GitHub contribution calendar in pitch-green,
// one square per day, auto-scrolled to the most recent weeks.
struct HeatmapView: View {
    let heatmap: Heatmap

    private let cell: CGFloat = 12
    private let gap: CGFloat = 3
    private let months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                          "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

    var body: some View {
        Panel(title: "Innings Map",
              note: "\(heatmap.total.formatted()) contributions · last 12 months") {
            ScrollViewReader { proxy in
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(alignment: .top, spacing: gap) {
                        ForEach(Array(heatmap.weeks.enumerated()), id: \.offset) { index, week in
                            weekColumn(week, label: monthLabel(at: index))
                                .id(index)
                        }
                    }
                    .padding(.vertical, 2)
                }
                .onAppear {
                    proxy.scrollTo(heatmap.weeks.count - 1, anchor: .trailing)
                }
            }
            legend
        }
        .accessibilityLabel("Contribution heatmap: \(heatmap.total) contributions in the last year")
    }

    private func weekColumn(_ week: [HeatDay?], label: String?) -> some View {
        VStack(spacing: gap) {
            Text(label ?? " ")
                .font(display(9, .semibold))
                .kerning(1)
                .foregroundStyle(Color.cvMuted)
                .frame(height: 12)
                .fixedSize()
            ForEach(0..<7, id: \.self) { i in
                let day = i < week.count ? week[i] : nil
                Rectangle()
                    .fill(color(for: day?.level))
                    .frame(width: cell, height: cell)
            }
        }
    }

    private func monthLabel(at index: Int) -> String? {
        guard let day = heatmap.weeks[index].compactMap({ $0 }).first,
              let month = Int(day.date.dropFirst(5).prefix(2)) else { return nil }
        if index == 0 { return months[month - 1] }
        let prev = heatmap.weeks[index - 1].compactMap({ $0 }).first
        let prevMonth = prev.flatMap { Int($0.date.dropFirst(5).prefix(2)) }
        return month != prevMonth ? months[month - 1] : nil
    }

    private func color(for level: Int?) -> Color {
        switch level {
        case 1: Color(hex: "#123f27")
        case 2: Color(hex: "#1e7a46")
        case 3: Color(hex: "#2fa35f")
        case 4: Color(hex: "#57cd84")
        case 0: Color.white.opacity(0.055)
        default: .clear
        }
    }

    private var legend: some View {
        HStack(spacing: 4) {
            Spacer()
            Text("Quiet overs").font(.system(size: 11)).foregroundStyle(Color.cvMuted)
            ForEach(0..<5, id: \.self) { level in
                Rectangle().fill(color(for: level)).frame(width: 10, height: 10)
            }
            Text("Boundary rush").font(.system(size: 11)).foregroundStyle(Color.cvMuted)
        }
    }
}
