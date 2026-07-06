import SwiftUI

// The full scouting report — mirrors the web /player/:username route.
struct PlayerView: View {
    let card: Card

    @State private var renderedImage: UIImage?
    @State private var savedFlash = false

    private var accent: Color { Color(hex: card.tier.accent) }

    var body: some View {
        ZStack {
            StadiumBackground()
            ScrollView {
                VStack(spacing: 20) {
                    scoutHead
                    CardView(card: card)
                        .frame(maxWidth: 360)
                        .padding(.vertical, 6)
                    shareBar
                    attributesPanel
                    playstylesPanel
                    if let heatmap = card.heatmap {
                        HeatmapView(heatmap: heatmap)
                    }
                    CareerTableView(career: card.career, name: card.name)
                    metricsPanel
                    profileLink
                }
                .padding(.horizontal, 18)
                .padding(.top, 8)
                .padding(.bottom, 56)
            }
        }
        .navigationTitle("/player/\(card.username)")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.hidden, for: .navigationBar)
    }

    // MARK: header

    private var scoutHead: some View {
        VStack(alignment: .leading, spacing: 10) {
            VStack(alignment: .leading, spacing: 6) {
                Text("SCOUT REPORT")
                    .font(display(11, .semibold))
                    .kerning(3)
                    .foregroundStyle(Color.cvMuted)
                TricolorStripe(height: 3).frame(width: 90)
            }
            Text(card.name)
                .font(display(34, .heavy))
                .kerning(1)
                .foregroundStyle(Color.cvInk)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            HStack(spacing: 10) {
                Text(card.role.abbr)
                    .font(display(12, .bold))
                    .kerning(1)
                    .foregroundStyle(.black)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(accent)
                Text(card.tier.name.capitalized).foregroundStyle(accent)
                Text("|").foregroundStyle(Color.cvLine)
                Text("@\(card.username)").foregroundStyle(Color.cvMuted)
                Text("|").foregroundStyle(Color.cvLine)
                Text(card.topLanguage).foregroundStyle(Color.cvGreen)
            }
            .font(.system(size: 13, weight: .medium))
            (Text(card.trait.tag + "  ")
                .font(display(13, .bold))
                .foregroundStyle(Color.cvGold)
                + Text(card.trait.note)
                .font(.system(size: 13, weight: .light))
                .foregroundStyle(Color.cvMuted))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: share

    @ViewBuilder
    private var shareBar: some View {
        let buttons = HStack(spacing: 10) {
            ShareLink(item: API.shareURL(for: card.username)) {
                shareLabel("link", "Share")
            }
            .glassCapsule(interactive: true)

            if let renderedImage {
                ShareLink(
                    item: Image(uiImage: renderedImage),
                    preview: SharePreview("Coverdrive — \(card.name)", image: Image(uiImage: renderedImage))
                ) {
                    shareLabel("photo", "Card image")
                }
                .glassCapsule(interactive: true)
            }

            Button {
                saveImage()
            } label: {
                shareLabel(savedFlash ? "checkmark" : "square.and.arrow.down", savedFlash ? "Saved" : "Save")
            }
            .glassCapsule(tint: .cvGold, interactive: true)
        }
        if #available(iOS 26.0, *) {
            GlassEffectContainer { buttons }
        } else {
            buttons
        }
    }

    private func shareLabel(_ symbol: String, _ title: String) -> some View {
        HStack(spacing: 7) {
            Image(systemName: symbol).font(.system(size: 13, weight: .semibold))
            Text(title).font(display(13, .semibold)).kerning(1)
        }
        .foregroundStyle(Color.cvInk)
        .padding(.horizontal, 16)
        .padding(.vertical, 11)
    }

    @MainActor
    private func renderCard() -> UIImage? {
        let renderer = ImageRenderer(
            content: CardView(card: card, interactive: false)
                .frame(width: 380, height: 532)
                .padding(40)
                .background(Color.cvBg)
        )
        renderer.scale = 3
        return renderer.uiImage
    }

    private func saveImage() {
        guard let image = renderedImage ?? renderCard() else { return }
        renderedImage = image
        UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
        withAnimation { savedFlash = true }
        Task {
            try? await Task.sleep(for: .seconds(1.8))
            withAnimation { savedFlash = false }
        }
    }

    // MARK: panels

    private var attributesPanel: some View {
        Panel(title: "Attributes") {
            VStack(spacing: 0) {
                LabeledRow("Shot range") { StarsView(count: card.shotRange) }
                Divider().overlay(Color.cvLine)
                LabeledRow("Reverse sweep") { StarsView(count: card.reverseSweep) }
                Divider().overlay(Color.cvLine)
                LabeledRow("Work rate") { monoValue(card.workRate) }
                Divider().overlay(Color.cvLine)
                LabeledRow("Style") { monoValue(card.style) }
            }
        }
        .task {
            // Pre-render the shareable card image off the main touch path.
            if renderedImage == nil { renderedImage = renderCard() }
        }
    }

    private func monoValue(_ value: String) -> some View {
        Text(value).font(display(14, .bold)).kerning(1).foregroundStyle(Color.cvInk)
    }

    private var playstylesPanel: some View {
        Panel(title: "Playstyles") {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(card.playstyles) { style in
                    HStack(spacing: 10) {
                        Image(systemName: style.symbol)
                            .font(.system(size: 15))
                            .frame(width: 20)
                        Text(style.key)
                            .font(.system(size: 13, weight: .medium))
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                        Spacer()
                        if style.earned {
                            Text("+").font(display(15, .bold)).foregroundStyle(Color.cvGold)
                        }
                    }
                    .foregroundStyle(style.earned ? Color.cvInk : Color.cvMuted.opacity(0.55))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 11)
                    .background(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(style.earned ? Color.cvGold.opacity(0.08) : Color.white.opacity(0.02))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .strokeBorder(style.earned ? Color.cvGold.opacity(0.35) : Color.cvLine, lineWidth: 1)
                    )
                }
            }
        }
    }

    private var metricsPanel: some View {
        Panel(title: "Scouting Metrics") {
            VStack(spacing: 16) {
                ForEach(Array(card.metrics.enumerated()), id: \.element.id) { index, metric in
                    MetricBar(metric: metric, delay: Double(index) * 0.07)
                }
            }
        }
    }

    private var profileLink: some View {
        Link(destination: URL(string: card.profileUrl) ?? API.base) {
            HStack(spacing: 8) {
                Text("VIEW @\(card.username.uppercased()) ON GITHUB")
                    .font(display(13, .semibold))
                    .kerning(2)
                Image(systemName: "arrow.up.right").font(.system(size: 12, weight: .bold))
            }
            .foregroundStyle(Color.cvGold)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
        }
        .glassCapsule(tint: .cvGold, interactive: true)
    }
}

struct LabeledRow<Content: View>: View {
    let label: String
    @ViewBuilder var content: Content

    init(_ label: String, @ViewBuilder content: () -> Content) {
        self.label = label
        self.content = content()
    }

    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 14, weight: .light))
                .foregroundStyle(Color.cvMuted)
            Spacer()
            content
        }
        .padding(.vertical, 12)
    }
}

struct StarsView: View {
    let count: Int
    var body: some View {
        HStack(spacing: 3) {
            ForEach(1...5, id: \.self) { i in
                Image(systemName: i <= count ? "star.fill" : "star")
                    .font(.system(size: 11))
                    .foregroundStyle(i <= count ? Color.cvGold : Color.cvMuted.opacity(0.4))
            }
        }
        .accessibilityLabel("\(count) out of 5")
    }
}

struct MetricBar: View {
    let metric: Metric
    let delay: Double
    @State private var filled = false

    var body: some View {
        VStack(spacing: 7) {
            HStack {
                Text(metric.label)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.cvInk)
                Spacer()
                Text(metric.detail)
                    .font(.system(size: 12))
                    .foregroundStyle(Color.cvMuted)
                Text("\(metric.score)")
                    .font(display(16, .bold))
                    .foregroundStyle(Color.cvGold)
                    .frame(minWidth: 28, alignment: .trailing)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.07))
                    Capsule()
                        .fill(LinearGradient(colors: [Color.cvGold.opacity(0.65), Color.cvGold],
                                             startPoint: .leading, endPoint: .trailing))
                        .frame(width: filled ? geo.size.width * CGFloat(metric.score) / 100 : 0)
                }
            }
            .frame(height: 5)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.7).delay(delay)) { filled = true }
        }
    }
}

// Cricinfo-style batting & fielding scorecard.
struct CareerTableView: View {
    let career: Career
    let name: String

    var body: some View {
        Panel(title: "Career Statistics", note: "Batting & Fielding") {
            ScrollView(.horizontal, showsIndicators: false) {
                Grid(horizontalSpacing: 18, verticalSpacing: 12) {
                    GridRow {
                        ForEach(career.columns, id: \.self) { column in
                            Text(column.uppercased())
                                .font(display(11, .semibold))
                                .kerning(1.5)
                                .foregroundStyle(Color.cvMuted)
                                .gridColumnAlignment(column == "Format" ? .leading : .trailing)
                        }
                    }
                    Divider().gridCellColumns(career.columns.count).overlay(Color.cvLine)
                    ForEach(career.rows) { row in
                        GridRow {
                            Text(row.format)
                                .font(display(13, .bold))
                                .foregroundStyle(Color.cvGold)
                            cell("\(row.mat)")
                            cell(row.runs)
                            cell(row.hs)
                            cell(row.ave)
                            cell(row.sr)
                            cell("\(row.hundreds)")
                            cell("\(row.fifties)")
                            cell("\(row.sixes)")
                            cell(row.ct)
                        }
                    }
                }
                .padding(.vertical, 2)
            }
            Text(career.legend)
                .font(.system(size: 11, weight: .light))
                .foregroundStyle(Color.cvMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func cell(_ value: String) -> some View {
        Text(value)
            .font(.system(size: 13, weight: .medium).monospacedDigit())
            .foregroundStyle(Color.cvInk)
    }
}
