package com.example.logpoint.models

data class UpdateVisitLogRequest(
    val visitorName: String,
    val purpose: String,
    val host: String,
    val contactNo: String
)