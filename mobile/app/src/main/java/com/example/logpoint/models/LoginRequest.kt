package com.example.logpoint.models

// The backend UserService.login() accepts the email as the "username" field.
// So users type their email into the "Username / Email" input.
data class LoginRequest(
    val username: String,   // This is actually the email – matches LoginRequest.java field name
    val password: String
)