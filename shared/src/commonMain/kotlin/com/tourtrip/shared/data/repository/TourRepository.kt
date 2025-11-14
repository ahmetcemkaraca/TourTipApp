package com.tourtrip.shared.data.repository

import com.tourtrip.shared.data.remote.ApiClient
import com.tourtrip.shared.data.remote.ApiResponse
import com.tourtrip.shared.domain.models.Tour
import io.ktor.client.call.*
import io.ktor.client.request.*

/**
 * Tour Repository
 * Handles tour-related API calls
 */
class TourRepository(private val apiClient: ApiClient) {

    /**
     * Get all tours
     */
    suspend fun getTours(
        category: String? = null,
        city: String? = null,
        minPrice: Double? = null,
        maxPrice: Double? = null
    ): Result<List<Tour>> {
        return try {
            val response: ApiResponse<List<Tour>> = apiClient.httpClient.get("${apiClient.getBaseUrl()}/tours") {
                parameter("category", category)
                parameter("city", city)
                parameter("minPrice", minPrice)
                parameter("maxPrice", maxPrice)
            }.body()

            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Unknown error"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Get tour by ID
     */
    suspend fun getTourById(id: String): Result<Tour> {
        return try {
            val response: ApiResponse<Tour> = apiClient.httpClient.get("${apiClient.getBaseUrl()}/tours/$id").body()

            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Tour not found"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Search tours
     */
    suspend fun searchTours(query: String): Result<List<Tour>> {
        return try {
            val response: ApiResponse<List<Tour>> = apiClient.httpClient.get("${apiClient.getBaseUrl()}/tours/search") {
                parameter("q", query)
            }.body()

            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Search failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
