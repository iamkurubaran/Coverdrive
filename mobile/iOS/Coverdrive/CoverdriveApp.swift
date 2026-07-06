import SwiftUI

@main
struct CoverdriveApp: App {
    var body: some Scene {
        WindowGroup {
            HomeView()
                .preferredColorScheme(.dark)
                .tint(.cvGold)
        }
    }
}
