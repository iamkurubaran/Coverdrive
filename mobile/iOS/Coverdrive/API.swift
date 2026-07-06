import Foundation

// Thin client for the deployed Coverdrive server. All GitHub calls and
// the rating engine run server-side, so the app never touches GitHub.
enum API {
    static let base = URL(string: "https://gitcoverdrive.onrender.com")!

    struct ServerError: LocalizedError, Decodable {
        let error: String
        var errorDescription: String? { error }
    }

    private static func get<T: Decodable>(_ path: String, as type: T.Type) async throws -> T {
        var req = URLRequest(url: base.appending(path: path))
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.timeoutInterval = 30 // Render free tier can cold-start
        let (data, response) = try await URLSession.shared.data(for: req)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            if let server = try? JSONDecoder().decode(ServerError.self, from: data) {
                throw server
            }
            throw ServerError(error: "Couldn't reach the scoreboard. Try again.")
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    static func card(for username: String) async throws -> Card {
        let clean = username
            .trimmingCharacters(in: .whitespaces)
            .replacingOccurrences(of: "@", with: "")
        guard !clean.isEmpty else { throw ServerError(error: "Enter a GitHub username.") }
        let encoded = clean.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? clean
        return try await get("/api/card/\(encoded)", as: Card.self)
    }

    static func stats() async throws -> Stats {
        try await get("/api/stats", as: Stats.self)
    }

    // CORS-free avatar proxy on the server; used directly by AsyncImage.
    static func avatarURL(_ raw: String) -> URL {
        var comps = URLComponents(url: base.appending(path: "/api/avatar"), resolvingAgainstBaseURL: false)!
        comps.queryItems = [URLQueryItem(name: "url", value: raw)]
        return comps.url ?? base
    }

    static func shareURL(for username: String) -> URL {
        base.appending(path: "/player/\(username)")
    }
}
