package com.example.logpoint.models

data class SyncStatusResponse(
    val status: String   // "NONE" | "PENDING" | "ACCEPTED" | "DECLINED"
)