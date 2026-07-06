import SwiftUI

// Night-test-match palette, matching the web client.
extension Color {
    init(hex: String) {
        var h = hex.trimmingCharacters(in: .whitespaces)
        if h.hasPrefix("#") { h.removeFirst() }
        var v: UInt64 = 0
        Scanner(string: h).scanHexInt64(&v)
        self.init(
            .sRGB,
            red: Double((v >> 16) & 0xFF) / 255,
            green: Double((v >> 8) & 0xFF) / 255,
            blue: Double(v & 0xFF) / 255,
            opacity: 1
        )
    }

    static let cvBg = Color(hex: "#08090b")
    static let cvGold = Color(hex: "#e8c766")
    static let cvGreen = Color(hex: "#1e7a46")
    static let cvRed = Color(hex: "#c8102e")
    static let cvInk = Color(hex: "#f5f0e3")
    static let cvSoft = Color(hex: "#f5f0e3").opacity(0.6)
    static let cvMuted = Color.white.opacity(0.55)
    static let cvLine = Color.white.opacity(0.1)
}

// Condensed uppercase display type (stand-in for Saira Condensed).
func display(_ size: CGFloat, _ weight: Font.Weight = .bold) -> Font {
    .system(size: size, weight: weight).width(.condensed)
}

// The signature tricolor stripe: pitch green → gold → ball red.
struct TricolorStripe: View {
    var height: CGFloat = 4
    var body: some View {
        HStack(spacing: 0) {
            Color.cvGreen
            Color.cvGold
            Color.cvRed
        }
        .frame(height: height)
    }
}

// Floodlit stadium background used behind every screen.
struct StadiumBackground: View {
    var body: some View {
        ZStack {
            Color.cvBg
            RadialGradient(
                colors: [Color.cvGold.opacity(0.10), .clear],
                center: .init(x: 0.2, y: 0.05), startRadius: 0, endRadius: 420
            )
            RadialGradient(
                colors: [Color.cvGreen.opacity(0.10), .clear],
                center: .init(x: 0.9, y: 0.15), startRadius: 0, endRadius: 380
            )
        }
        .ignoresSafeArea()
    }
}

// MARK: - Liquid Glass helpers
// On iOS 26+ these adopt the system Liquid Glass material; earlier
// releases fall back to a matching ultra-thin material treatment.

extension View {
    @ViewBuilder
    func glassPanel(corner: CGFloat = 24) -> some View {
        if #available(iOS 26.0, *) {
            self.glassEffect(.regular, in: .rect(cornerRadius: corner))
        } else {
            self
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: corner, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: corner, style: .continuous)
                        .strokeBorder(Color.cvLine, lineWidth: 1)
                )
        }
    }

    @ViewBuilder
    func glassCapsule(tint: Color = .clear, interactive: Bool = false) -> some View {
        if #available(iOS 26.0, *) {
            self.glassEffect(
                interactive
                    ? .regular.tint(tint.opacity(0.35)).interactive()
                    : .regular.tint(tint.opacity(0.35)),
                in: .capsule
            )
        } else {
            self
                .background(.ultraThinMaterial, in: Capsule())
                .background(tint.opacity(0.22), in: Capsule())
                .overlay(Capsule().strokeBorder(Color.cvLine, lineWidth: 1))
        }
    }
}

// Panel with the web client's ticked uppercase title.
struct Panel<Content: View>: View {
    let title: String
    var note: String? = nil
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 10) {
                Rectangle().fill(Color.cvGold).frame(width: 14, height: 2)
                Text(title.uppercased())
                    .font(display(13, .semibold))
                    .kerning(3)
                    .foregroundStyle(Color.cvMuted)
                if let note {
                    Spacer()
                    Text(note)
                        .font(.system(size: 11))
                        .foregroundStyle(Color.cvMuted)
                }
            }
            content
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassPanel()
    }
}
