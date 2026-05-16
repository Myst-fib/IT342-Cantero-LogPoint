package com.example.logpoint.models

data class UserResponse(
    val id: Long?,          // Long to match backend UserDTO (Java Long)
    val firstName: String?,
    val lastName: String?,
    val email: String?,
    val role: String?,
    val status: String?,
    val authProvider: String?,
    val pictureUrl: String?,
    val token: String?      // kept for future JWT use
)