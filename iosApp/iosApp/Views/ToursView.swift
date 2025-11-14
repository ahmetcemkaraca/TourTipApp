import SwiftUI
import shared

/**
 * Tours List View (SwiftUI)
 * Displays a list of available tours
 */
struct ToursView: View {
    @StateObject private var viewModel = ToursViewModel()

    var body: some View {
        NavigationView {
            ZStack {
                switch viewModel.state {
                case .loading:
                    ProgressView()
                        .scaleEffect(1.5)

                case .success(let tours):
                    List(tours, id: \.id) { tour in
                        NavigationLink(destination: TourDetailView(tour: tour)) {
                            TourRow(tour: tour)
                        }
                    }
                    .listStyle(.plain)

                case .error(let message):
                    VStack(spacing: 16) {
                        Text("Error")
                            .font(.headline)
                            .foregroundColor(.red)

                        Text(message)
                            .font(.body)
                            .multilineTextAlignment(.center)
                            .foregroundColor(.secondary)

                        Button("Retry") {
                            viewModel.loadTours()
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                }
            }
            .navigationTitle("TourTipApp")
        }
        .onAppear {
            viewModel.loadTours()
        }
    }
}

/**
 * Tour Row Component
 */
struct TourRow: View {
    let tour: Tour

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(tour.title)
                .font(.headline)

            Text(tour.description_)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(2)

            HStack {
                Text("\(tour.price, specifier: "%.2f") \(tour.currency)")
                    .font(.callout)
                    .fontWeight(.semibold)
                    .foregroundColor(.blue)

                Spacer()

                Text("\(tour.duration) min")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

/**
 * Tour Detail View Placeholder
 */
struct TourDetailView: View {
    let tour: Tour

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(tour.title)
                    .font(.title)
                    .fontWeight(.bold)

                Text(tour.description_)
                    .font(.body)

                HStack {
                    VStack(alignment: .leading) {
                        Text("Price")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("\(tour.price, specifier: "%.2f") \(tour.currency)")
                            .font(.title2)
                            .fontWeight(.semibold)
                    }

                    Spacer()

                    VStack(alignment: .trailing) {
                        Text("Duration")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("\(tour.duration) min")
                            .font(.title3)
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(12)

                Button("Book Now") {
                    // TODO: Implement booking
                }
                .buttonStyle(.borderedProminent)
                .frame(maxWidth: .infinity)

                Spacer()
            }
            .padding()
        }
        .navigationTitle("Tour Details")
    }
}

#Preview {
    ToursView()
}
