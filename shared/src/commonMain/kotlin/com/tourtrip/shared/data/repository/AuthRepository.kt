package com.tourtrip.shared.data.repository

import com.tourtrip.shared.data.remote.ApiClient
import com.tourtrip.shared.data.remote.ApiResponse
import com.tourtrip.shared.domain.models.User
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*

/**
 * Authentication Repository (Phase 2)
 * Handles all authentication operations
 */
class AuthRepository(private val apiClient: ApiClient) {

    /**
     * Sign in with email and password
     */
    suspend fun signIn(email: String, password: String): Result<User> {
        return try {
            val response: ApiResponse<User> = apiClient.httpClient.post("${apiClient.getBaseUrl()}/auth/signin") {
                contentType(ContentType.Application.Json)
                setBody(mapOf(
                    "email" to email,
                    "password" to password
                ))
            }.body()

            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Sign in failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Sign up with email and password
     */
    suspend fun signUp(
        email: String,
        password: String,
        displayName: String
    ): Result<User> {
        return try {
            val response: ApiResponse<User> = apiClient.httpClient.post("${apiClient.getBaseUrl()}/auth/signup") {
                contentType(ContentType.Application.Json)
                setBody(mapOf(
                    "email" to email,
                    "password" to password,
                    "displayName" to displayName
                ))
            }.body()

            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Sign up failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Sign out
     */
    suspend fun signOut(): Result<Unit> {
        return try {
            val response: ApiResponse<Unit> = apiClient.httpClient.post("${apiClient.getBaseUrl()}/auth/signout").body()

            if (response.success) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.error ?: "Sign out failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Reset password
     */
    suspend fun resetPassword(email: String): Result<Unit> {
        return try {
            val response: ApiResponse<Unit> = apiClient.httpClient.post("${apiClient.getBaseUrl()}/auth/reset-password") {
                contentType(ContentType.Application.Json)
                setBody(mapOf("email" to email))
            }.body()

            if (response.success) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.error ?: "Password reset failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Get current user
     */
    suspend fun getCurrentUser(): Result<User> {
        return try {
            val response: ApiResponse<User> = apiClient.httpClient.get("${apiClient.getBaseUrl()}/auth/me").body()

            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Failed to get user"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Update user profile
     */
    suspend fun updateProfile(
        displayName: String?,
        phoneNumber: String?
    ): Result<User> {
        return try {
            val response: ApiResponse<User> = apiClient.httpClient.put("${apiClient.getBaseUrl()}/auth/profile") {
                contentType(ContentType.Application.Json)
                setBody(mapOf(
                    "displayName" to displayName,
                    "phoneNumber" to phoneNumber
                ))
            }.body()

            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.error ?: "Profile update failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
