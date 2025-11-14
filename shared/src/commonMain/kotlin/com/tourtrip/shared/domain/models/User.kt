package com.tourtrip.shared.domain.models

import kotlinx.serialization.Serializable

/**
 * User Domain Model
 * Represents a user in the TourTipApp platform
 */
@Serializable
data class User(
    val id: String,
    val email: String,
    val displayName: String,
    val profilePicture: String? = null,
    val phoneNumber: String? = null,
    val role: UserRole = UserRole.USER,
    val emailVerified: Boolean = false,
    val createdAt: Long, // Timestamp in milliseconds
    val updatedAt: Long  // Timestamp in milliseconds
)

@Serializable
enum class UserRole {
    USER,
    PROVIDER,
    ADMIN
}
