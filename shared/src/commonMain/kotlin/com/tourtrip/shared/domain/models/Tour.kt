package com.tourtrip.shared.domain.models

import kotlinx.serialization.Serializable

/**
 * Tour Domain Model
 * Represents a tour/activity listing
 */
@Serializable
data class Tour(
    val id: String,
    val providerId: String,
    val title: String,
    val description: String,
    val category: TourCategory,
    val imageUrl: String? = null,
    val price: Double,
    val currency: String = "TRY",
    val duration: Int, // in minutes
    val maxCapacity: Int? = null,
    val location: Location,
    val availability: List<Availability> = emptyList(),
    val isActive: Boolean = true,
    val createdAt: Long,
    val updatedAt: Long
)

@Serializable
enum class TourCategory {
    TOUR,
    ACTIVITY,
    EVENT
}

@Serializable
data class Location(
    val city: String,
    val address: String? = null,
    val coordinates: Coordinates? = null
)

@Serializable
data class Coordinates(
    val latitude: Double,
    val longitude: Double
)

@Serializable
data class Availability(
    val date: Long, // Timestamp
    val available: Boolean = true,
    val spotsLeft: Int? = null
)
