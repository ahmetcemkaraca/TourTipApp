import Foundation
import Combine
import shared

/**
 * Tours ViewModel (iOS)
 * Manages tours list state using Combine
 */
class ToursViewModel: ObservableObject {
    @Published var state: ToursState = .loading

    private let apiClient = ApiClient(baseUrl: "https://tourtrip.app/api")
    private var tourRepository: TourRepository?

    init() {
        tourRepository = TourRepository(apiClient: apiClient)
    }

    func loadTours() {
        state = .loading

        // Using KMM shared repository
        Task {
            do {
                if let repository = tourRepository {
                    let result = try await repository.getTours(
                        category: nil,
                        city: nil,
                        minPrice: nil,
                        maxPrice: nil
                    )

                    await MainActor.run {
                        if let tours = result as? [Tour] {
                            state = .success(tours)
                        } else {
                            state = .error("Failed to load tours")
                        }
                    }
                }
            } catch {
                await MainActor.run {
                    state = .error(error.localizedDescription)
                }
            }
        }
    }

    func searchTours(query: String) {
        state = .loading

        Task {
            do {
                if let repository = tourRepository {
                    let result = try await repository.searchTours(query: query)

                    await MainActor.run {
                        if let tours = result as? [Tour] {
                            state = .success(tours)
                        } else {
                            state = .error("Search failed")
                        }
                    }
                }
            } catch {
                await MainActor.run {
                    state = .error(error.localizedDescription)
                }
            }
        }
    }

    deinit {
        apiClient.close()
    }
}

/**
 * UI State for Tours
 */
enum ToursState {
    case loading
    case success([Tour])
    case error(String)
}
