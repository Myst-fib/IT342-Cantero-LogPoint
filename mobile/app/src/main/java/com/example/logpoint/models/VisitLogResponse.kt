package com.example.logpoint.models

data class VisitLogResponse(
    val id: Long?,
    val visitorId: Long?,
    val visitorName: String?,
    val purposeId: Long?,
    val purposeName: String?,
    val timeIn: String?,
    val timeOut: String?,
    val status: String?,       // "ACTIVE" or "COMPLETED"
    val hostName: String?,
    val contactNo: String?,
    val createdById: Long?,
    val createdByName: String?
)