import SwiftUI

// The crease: hero, search, live counter — mirrors the web "/" route.
struct HomeView: View {
    @State private var username = ""
    @State private var loading = false
    @State private var error: String?
    @State private var cardsRated: Int?
    @State private var showHow = false
    @State private var path: [Card] = []
    @FocusState private var searchFocused: Bool

    private let suggested = ["torvalds", "sindresorhus", "gaearon"]

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                StadiumBackground()
                ScrollView {
                    VStack(spacing: 28) {
                        header
                        hero
                        searchArea
                        meta
                        if let error {
                            Text(error)
                                .font(.system(size: 14))
                                .foregroundStyle(Color.cvRed)
                                .multilineTextAlignment(.center)
                        }
                        if loading { umpire } else { emptyPitch }
                    }
                    .padding(.horizontal, 22)
                    .padding(.top, 18)
                    .padding(.bottom, 48)
                }
                .scrollDismissesKeyboard(.interactively)
            }
            .navigationDestination(for: Card.self) { PlayerView(card: $0) }
            .toolbarVisibility(.hidden, for: .navigationBar)
            .sheet(isPresented: $showHow) { HowItWorksSheet() }
            .task {
                cardsRated = try? await API.stats().cardsRated
            }
        }
    }

    // MARK: pieces

    private var header: some View {
        HStack {
            HStack(spacing: 10) {
                BallMark()
                (Text("COVER").foregroundStyle(Color.cvInk)
                    + Text("DRIVE").foregroundStyle(Color.cvGold))
                    .font(display(19, .bold))
                    .kerning(2)
            }
            Spacer()
            Link(destination: URL(string: "https://gitcoverdrive.onrender.com")!) {
                HStack(spacing: 6) {
                    Image(systemName: "safari")
                    Text("Web")
                }
                .font(display(12, .semibold))
                .kerning(1)
                .foregroundStyle(Color.cvInk)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
            }
            .glassCapsule(interactive: true)
        }
    }

    private var hero: some View {
        VStack(spacing: 14) {
            HStack(spacing: 8) {
                Text("GITHUB").foregroundStyle(Color.cvMuted)
                Text("×").foregroundStyle(Color.cvMuted.opacity(0.6))
                Text("WORLD XI ’26").foregroundStyle(Color.cvGold)
            }
            .font(display(11, .semibold))
            .kerning(2.5)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .glassCapsule()

            (Text("GET SELECTED").foregroundStyle(Color.cvInk)
                + Text(".").foregroundStyle(Color.cvGreen))
                .font(display(54, .heavy))
                .kerning(1)
                .minimumScaleFactor(0.7)
                .lineLimit(1)

            Text("Your GitHub stats, turned into a World-XI-style cricket card — rated out of 99.")
                .font(.system(size: 15, weight: .light))
                .foregroundStyle(Color.cvMuted)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 16)
    }

    private var searchArea: some View {
        VStack(spacing: 14) {
            HStack(spacing: 10) {
                HStack(spacing: 8) {
                    Text("@").foregroundStyle(Color.cvGold).font(display(17, .bold))
                    TextField("github username", text: $username)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .submitLabel(.search)
                        .focused($searchFocused)
                        .onSubmit { scout() }
                        .foregroundStyle(Color.cvInk)
                }
                .padding(.horizontal, 16)
                .frame(height: 52)
                .frame(maxWidth: .infinity)
                .glassCapsule(interactive: true)

                Button(action: { scout() }) {
                    HStack(spacing: 6) {
                        if loading {
                            ProgressView().tint(.black)
                        } else {
                            Text("SCOUT").font(display(15, .bold)).kerning(2)
                            Image(systemName: "arrow.right").font(.system(size: 13, weight: .bold))
                        }
                    }
                    .foregroundStyle(.black)
                    .padding(.horizontal, 20)
                    .frame(height: 52)
                    .background(Color.cvGold, in: Capsule())
                }
                .disabled(loading)
            }

            HStack(spacing: 8) {
                Text("try").font(.system(size: 12)).foregroundStyle(Color.cvMuted)
                ForEach(suggested, id: \.self) { name in
                    Button(name) { scout(name) }
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color.cvInk)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .glassCapsule(interactive: true)
                        .disabled(loading)
                }
            }
        }
    }

    private var meta: some View {
        HStack(spacing: 18) {
            if let cardsRated {
                HStack(spacing: 8) {
                    Circle().fill(Color.cvGreen).frame(width: 7, height: 7)
                    Text("\(cardsRated.formatted()) cards rated")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.cvMuted)
                }
            }
            Button("how it works ↗") { showHow = true }
                .font(.system(size: 13))
                .foregroundStyle(Color.cvGold)
        }
    }

    private var umpire: some View {
        VStack(spacing: 14) {
            ProgressView().tint(Color.cvGold).scaleEffect(1.2)
            Text("Third umpire reviewing…")
                .font(display(14, .semibold))
                .kerning(2)
                .foregroundStyle(Color.cvMuted)
        }
        .padding(.top, 40)
    }

    private var emptyPitch: some View {
        VStack(spacing: 18) {
            ZStack {
                RoundedRectangle(cornerRadius: 60)
                    .fill(Color.cvGreen.opacity(0.12))
                    .frame(width: 120, height: 190)
                VStack(spacing: 120) {
                    Rectangle().fill(Color.cvInk.opacity(0.25)).frame(width: 70, height: 1)
                    Rectangle().fill(Color.cvInk.opacity(0.25)).frame(width: 70, height: 1)
                }
                HStack(spacing: 5) {
                    ForEach(0..<3, id: \.self) { _ in
                        Capsule().fill(Color.cvGold.opacity(0.8)).frame(width: 3, height: 30)
                    }
                }
                .offset(y: -62)
            }
            Text("Step up to the crease — enter a username\nto generate a full scouting report.")
                .font(.system(size: 14, weight: .light))
                .foregroundStyle(Color.cvMuted)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 28)
    }

    // MARK: actions

    private func scout(_ name: String? = nil) {
        let target = name ?? username
        guard !target.trimmingCharacters(in: .whitespaces).isEmpty, !loading else { return }
        searchFocused = false
        loading = true
        error = nil
        Task {
            defer { loading = false }
            do {
                let card = try await API.card(for: target)
                username = card.username
                path.append(card)
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}

struct BallMark: View {
    var body: some View {
        ZStack {
            Circle().fill(Color.cvRed)
            Circle()
                .trim(from: 0.08, to: 0.42)
                .stroke(Color(hex: "#f6e7c8"), style: .init(lineWidth: 1.6, dash: [3, 2]))
                .rotationEffect(.degrees(90))
                .padding(4)
        }
        .frame(width: 24, height: 24)
    }
}

struct HowItWorksSheet: View {
    @Environment(\.dismiss) private var dismiss

    private let mappings: [(String, String)] = [
        ("BAT — Batting", "total stars earned"),
        ("BWL — Bowling", "original repos shipped"),
        ("FLD — Fielding", "total forks caught"),
        ("TEC — Technique", "range of languages"),
        ("EXP — Experience", "years in the game"),
        ("STA — Stamina", "contributions in the last year"),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text("Every score derives from a public GitHub signal, squashed into a 40–99 band with diminishing returns — mega-accounts don't peg everything at 99, and newcomers still land respectably.")
                    ForEach(mappings, id: \.0) { pair in
                        HStack(alignment: .firstTextBaseline) {
                            Text(pair.0).font(display(14, .semibold)).foregroundStyle(Color.cvGold)
                            Spacer()
                            Text(pair.1).foregroundStyle(Color.cvMuted)
                        }
                        .font(.system(size: 14))
                    }
                    Text("Overall is the mean of the six. Tiers: 90+ Legend · 82+ Platinum · 74+ Gold · 64+ Silver · below that, Bronze. Your role comes from your strongest attribute.")
                    Text("The career table reads like a scorecard: Tests are your all-time record, ODIs the last 12 months, T20s the last 90 days. The Innings Map is your commit heatmap — a year of deliveries, one square per day.")
                }
                .font(.system(size: 15, weight: .light))
                .foregroundStyle(Color.cvInk)
                .padding(22)
            }
            .navigationTitle("How it works")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationBackground(.thinMaterial)
        .preferredColorScheme(.dark)
    }
}
