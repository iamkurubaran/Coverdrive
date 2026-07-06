import Foundation

struct Card: Codable, Hashable {
    let username: String
    let name: String
    let avatar: String
    let bio: String?
    let location: String?
    let country: Country?
    let company: String?
    let followers: Int
    let publicRepos: Int
    let profileUrl: String
    let totalStars: Int
    let languages: [String]
    let topLanguage: String
    let attributes: [String: Int]
    let overall: Int
    let tier: Tier
    let role: Role
    let format: String
    let trait: Trait
    let metrics: [Metric]
    let shotRange: Int
    let reverseSweep: Int
    let workRate: String
    let style: String
    let playstyles: [Playstyle]
    let career: Career
    let heatmap: Heatmap?

    var surname: String {
        name.split(separator: " ").last.map(String.init) ?? name
    }
}

struct Country: Codable, Hashable {
    let code: String
    let flag: String
}

struct Tier: Codable, Hashable {
    let name: String
    let accent: String
    let glow: String
}

struct Role: Codable, Hashable {
    let abbr: String
    let name: String
}

struct Trait: Codable, Hashable {
    let tag: String
    let note: String
}

struct Metric: Codable, Hashable, Identifiable {
    let label: String
    let detail: String
    let score: Int
    var id: String { label }
}

struct Playstyle: Codable, Hashable, Identifiable {
    let key: String
    let icon: String
    let earned: Bool
    var id: String { key }

    var symbol: String {
        switch icon {
        case "users": "person.2"
        case "star": "star"
        case "flame": "flame"
        case "infinity": "infinity"
        case "forward": "forward"
        case "clock": "clock"
        case "bolt": "bolt"
        case "globe": "globe"
        default: "sparkles"
        }
    }
}

struct Career: Codable, Hashable {
    let columns: [String]
    let rows: [CareerRow]
    let legend: String
}

struct CareerRow: Codable, Hashable, Identifiable {
    let format: String
    let mat: Int
    let runs: String
    let hs: String
    let ave: String
    let sr: String
    let hundreds: Int
    let fifties: Int
    let sixes: Int
    let ct: String
    var id: String { format }
}

struct Heatmap: Codable, Hashable {
    let total: Int
    let weeks: [[HeatDay?]]
}

struct HeatDay: Codable, Hashable {
    let date: String
    let count: Int
    let level: Int
}

struct Stats: Codable {
    let cardsRated: Int
}
