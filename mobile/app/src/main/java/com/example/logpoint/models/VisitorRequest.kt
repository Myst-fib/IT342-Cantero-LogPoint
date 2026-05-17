package com.example.logpoint.models

data class VisitorRequest(
    val visitorName: String,
    val contactNo: String,
    val host: String,
    val purpose: String
    // timeIn is set by the backend via @PrePersist createdAt
)