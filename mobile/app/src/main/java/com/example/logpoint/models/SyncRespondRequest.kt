package com.example.logpoint.models

// Backend /api/sync/respond expects: { "decision": "ACCEPTED" } or { "decision": "DECLINED" }
data class SyncRespondRequest(
    val decision: String
)