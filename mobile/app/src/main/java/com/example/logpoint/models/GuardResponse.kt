package com.example.logpoint.models

data class GuardResponse(
    val id: Long?,
    val firstName: String?,
    val lastName: String?,
    val email: String?,
    val role: String?,
    val status: String?,
    val syncStatus: String?,   // "NONE" | "PENDING" | "ACCEPTED" | "DECLINED"
    val liveSync: Boolean?
)