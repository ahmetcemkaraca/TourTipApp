package com.tourtrip.shared.data.repository

import com.tourtrip.shared.data.remote.ApiClient
import com.tourtrip.shared.data.remote.ApiResponse
import com.tourtrip.shared.domain.models.Booking
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*

/**
 * Booking Repository
 * Handles booking-related API calls
 */
class BookingRepository(private val apiClient: ApiClient) {

    /**
     * Create new booking
     */
    suspend fun createBooking(
        tourId: String,
        date: Long,
        numberOfPeople: Int
    ): Result<Booking> {
        return try {
            val response: ApiResponse<Booking> = apiClient.httpClient.post("${apiClient.getBaseUrl()}/bookings") {
                contentType(ContentType.Application.Json)
                setBody(mapOf(
                    "tourId" to tourId,
                    "date" to date,
                    "numberOfPeople" to numberOfPeople
                ))
            }.body()

            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Booking failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Get user's bookings
     */
    suspend fun getUserBookings(userId: String): Result<List<Booking>> {
        return try {
            val response: ApiResponse<List<Booking>> = apiClient.httpClient.get("${apiClient.getBaseUrl()}/users/$userId/bookings").body()

            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Failed to fetch bookings"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Cancel booking
     */
    suspend fun cancelBooking(bookingId: String, reason: String? = null): Result<Booking> {
        return try {
            val response: ApiResponse<Booking> = apiClient.httpClient.post("${apiClient.getBaseUrl()}/bookings/$bookingId/cancel") {
                contentType(ContentType.Application.Json)
                setBody(mapOf("reason" to reason))
            }.body()

            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Cancellation failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
