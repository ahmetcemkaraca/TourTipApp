package com.tourtrip.shared.data.remote

import io.ktor.client.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

/**
 * Base API Client for HTTP requests
 * Uses Ktor HTTP Client with JSON serialization
 */
class ApiClient(
    private val baseUrl: String = "https://tourtrip.app/api"
) {
    val httpClient = HttpClient {
        install(ContentNegotiation) {
            json(Json {
                prettyPrint = true
                isLenient = true
                ignoreUnknownKeys = true
            })
        }

        install(Logging) {
            logger = Logger.DEFAULT
            level = LogLevel.INFO
        }
    }

    fun getBaseUrl(): String = baseUrl

    fun close() {
        httpClient.close()
    }
}

/**
 * API Response wrapper
 */
@kotlinx.serialization.Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null,
    val message: String? = null
)

/**
 * API Error
 */
data class ApiError(
    val code: String,
    val message: String,
    val details: Map<String, Any>? = null
)
