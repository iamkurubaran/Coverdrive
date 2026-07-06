import SwiftUI

// The shield card — same smooth bezier outline as the web client,
// drawn natively: metallic tier trim, dark face, tilt + sheen, count-up.

struct ShieldShape: InsettableShape {
    var insetAmount: CGFloat = 0

    func inset(by amount: CGFloat) -> ShieldShape {
        var shape = self
        shape.insetAmount += amount
        return shape
    }

    func path(in rect: CGRect) -> Path {
        let rect = rect.insetBy(dx: insetAmount, dy: insetAmount)
        let w = rect.width, h = rect.height
        let x = rect.minX, y = rect.minY
        func p(_ fx: CGFloat, _ fy: CGFloat) -> CGPoint {
            CGPoint(x: x + fx * w, y: y + fy * h)
        }
        var path = Path()
        path.move(to: p(0.075, 0.03))
        path.addLine(to: p(0.925, 0.03))
        path.addCurve(to: p(0.968, 0.078), control1: p(0.955, 0.03), control2: p(0.968, 0.048))
        path.addLine(to: p(0.968, 0.52))
        path.addCurve(to: p(0.752, 0.876), control1: p(0.968, 0.67), control2: p(0.905, 0.782))
        path.addCurve(to: p(0.5, 0.978), control1: p(0.664, 0.93), control2: p(0.577, 0.962))
        path.addCurve(to: p(0.248, 0.876), control1: p(0.423, 0.962), control2: p(0.336, 0.93))
        path.addCurve(to: p(0.032, 0.52), control1: p(0.095, 0.782), control2: p(0.032, 0.67))
        path.addLine(to: p(0.032, 0.078))
        path.addCurve(to: p(0.075, 0.03), control1: p(0.032, 0.048), control2: p(0.045, 0.03))
        path.closeSubpath()
        return path
    }
}

struct CardView: View {
    let card: Card
    var interactive = true

    @State private var shownOverall = 0
    @State private var tilt: CGSize = .zero
    @State private var sheen: UnitPoint = .init(x: 0.5, y: 0.18)

    private var accent: Color { Color(hex: card.tier.accent) }
    private var glow: Color { Color(hex: card.tier.glow) }

    private let leftKeys = ["BAT", "BWL", "FLD"]
    private let rightKeys = ["TEC", "EXP", "STA"]

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            ZStack {
                // Metallic tier trim
                ShieldShape()
                    .fill(
                        LinearGradient(
                            colors: [
                                glow.opacity(0.95),
                                accent,
                                accent.opacity(0.55),
                                glow.opacity(0.7),
                            ],
                            startPoint: .top, endPoint: .bottom
                        )
                    )

                // Dark face
                ShieldShape()
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: "#1d2028"), Color(hex: "#13151b"), Color(hex: "#0a0b0f")],
                            startPoint: .top, endPoint: .bottom
                        )
                    )
                    .padding(w * 0.009)

                // Accent tint bleeding from the top
                ShieldShape()
                    .fill(
                        RadialGradient(
                            colors: [accent.opacity(0.26), .clear],
                            center: .top, startRadius: 0, endRadius: geo.size.height * 0.75
                        )
                    )
                    .padding(w * 0.009)

                content(width: w)
                    .clipShape(ShieldShape().inset(by: w * 0.009))

                // Holographic sheen following the tilt
                ShieldShape()
                    .fill(
                        RadialGradient(
                            colors: [glow.opacity(0.28), glow.opacity(0.06), .clear],
                            center: sheen, startRadius: 0, endRadius: w * 0.7
                        )
                    )
                    .padding(w * 0.009)
                    .blendMode(.screen)
                    .allowsHitTesting(false)
            }
            .compositingGroup()
            .shadow(color: .black.opacity(0.6), radius: 22, y: 16)
            .shadow(color: glow.opacity(0.14), radius: 22)
            .rotation3DEffect(.degrees(tilt.height), axis: (x: 1, y: 0, z: 0))
            .rotation3DEffect(.degrees(tilt.width), axis: (x: 0, y: 1, z: 0))
            .gesture(interactive ? tiltGesture(size: geo.size) : nil)
        }
        .aspectRatio(5 / 7, contentMode: .fit)
        .task { await countUp() }
    }

    private func tiltGesture(size: CGSize) -> some Gesture {
        DragGesture(minimumDistance: 0)
            .onChanged { value in
                let px = min(max(value.location.x / size.width, 0), 1)
                let py = min(max(value.location.y / size.height, 0), 1)
                withAnimation(.interactiveSpring) {
                    tilt = CGSize(width: (px - 0.5) * 11, height: (0.5 - py) * -9)
                    sheen = UnitPoint(x: px, y: py)
                }
            }
            .onEnded { _ in
                withAnimation(.spring(duration: 0.5)) {
                    tilt = .zero
                    sheen = .init(x: 0.5, y: 0.18)
                }
            }
    }

    @MainActor
    private func countUp() async {
        guard interactive, !UIAccessibility.isReduceMotionEnabled else {
            shownOverall = card.overall
            return
        }
        let start = Date()
        let duration = 0.9
        while true {
            let k = min(1, Date().timeIntervalSince(start) / duration)
            let eased = 1 - pow(1 - k, 3)
            shownOverall = Int((Double(card.overall) * eased).rounded())
            if k >= 1 { break }
            try? await Task.sleep(nanoseconds: 16_000_000)
        }
    }

    // MARK: face content

    @ViewBuilder
    private func content(width w: CGFloat) -> some View {
        VStack(spacing: 0) {
            Text("★ ★ ★")
                .font(.system(size: w * 0.028))
                .kerning(4)
                .foregroundStyle(accent)
                .shadow(color: glow.opacity(0.5), radius: 5)
                .padding(.top, w * 0.115)

            HStack(alignment: .top, spacing: w * 0.04) {
                VStack(alignment: .leading, spacing: w * 0.016) {
                    Text("\(shownOverall)")
                        .font(display(w * 0.165, .heavy))
                        .foregroundStyle(accent)
                        .shadow(color: glow.opacity(0.38), radius: 10)
                    Text(card.role.abbr)
                        .font(display(w * 0.055, .bold))
                        .kerning(1.5)
                        .foregroundStyle(Color.cvInk)
                        .padding(.bottom, 3)
                        .overlay(alignment: .bottom) {
                            Rectangle().fill(accent.opacity(0.55)).frame(height: 1)
                        }
                    Text(card.country?.flag ?? "🌍")
                        .font(.system(size: w * 0.055))
                    Text(card.topLanguage.uppercased())
                        .font(display(w * 0.032, .semibold))
                        .kerning(1.5)
                        .foregroundStyle(Color.cvSoft)
                        .lineLimit(1)
                }
                .frame(minWidth: w * 0.26, alignment: .leading)

                AsyncImage(url: API.avatarURL(card.avatar)) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFill()
                    } else {
                        Color(hex: "#20242c")
                    }
                }
                .frame(width: w * 0.4, height: w * 0.4)
                .clipShape(Circle())
                .overlay(Circle().strokeBorder(accent, lineWidth: 2))
                .overlay(Circle().strokeBorder(.white.opacity(0.1), lineWidth: 1).padding(-w * 0.014))
                .shadow(color: .black.opacity(0.55), radius: 12, y: 8)
                .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, w * 0.1)
            .padding(.top, w * 0.03)

            Text(card.surname.uppercased())
                .font(display(w * 0.095, .heavy))
                .kerning(2)
                .foregroundStyle(Color.cvInk)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                .padding(.horizontal, w * 0.1)
                .padding(.top, w * 0.06)

            LinearGradient(
                colors: [.clear, accent.opacity(0.65), .clear],
                startPoint: .leading, endPoint: .trailing
            )
            .frame(width: w * 0.6, height: 1)
            .padding(.vertical, w * 0.035)

            HStack(alignment: .top, spacing: w * 0.06) {
                attrColumn(leftKeys, w: w)
                Rectangle().fill(accent.opacity(0.35)).frame(width: 1, height: w * 0.22)
                attrColumn(rightKeys, w: w)
            }

            Spacer(minLength: 0)

            HStack(spacing: 8) {
                Text(card.tier.name)
                Circle().fill(accent).frame(width: 4, height: 4)
                Text(card.format)
            }
            .font(display(w * 0.027, .semibold))
            .kerning(2.5)
            .foregroundStyle(Color.cvSoft)
            .padding(.bottom, w * 0.135)
        }
    }

    private func attrColumn(_ keys: [String], w: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: w * 0.02) {
            ForEach(keys, id: \.self) { key in
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text("\(card.attributes[key] ?? 0)")
                        .font(display(w * 0.058, .heavy))
                        .foregroundStyle(Color.cvInk)
                        .frame(minWidth: w * 0.085, alignment: .trailing)
                    Text(key)
                        .font(display(w * 0.04, .semibold))
                        .kerning(1.5)
                        .foregroundStyle(Color.cvSoft)
                }
            }
        }
    }
}
