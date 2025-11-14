package com.tourtrip.shared.domain.models

import kotlinx.serialization.Serializable

/**
 * Booking Domain Model
 * Represents a booking/reservation
 */
@Serializable
data class Booking(
    val id: String,
    val userId: String,
    val tourId: String,
    val providerId: String,
    val date: Long, // Timestamp
    val numberOfPeople: Int,
    val totalPrice: Double,
    val currency: String = "TRY",
    val status: BookingStatus = BookingStatus.PENDING,
    val paymentIntentId: String? = null,
    val paymentStatus: PaymentStatus = PaymentStatus.PENDING,
    val cancellationReason: String? = null,
    val createdAt: Long,
    val updatedAt: Long
)

@Serializable
enum class BookingStatus {
    PENDING,
    CONFIRMED,
    CANCELLED,
    COMPLETED
}

@Serializable
enum class PaymentStatus {
    PENDING,
    PAID,
    REFUNDED
}
