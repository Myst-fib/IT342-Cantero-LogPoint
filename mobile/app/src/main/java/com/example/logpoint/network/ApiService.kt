package com.example.logpoint.network

import com.example.logpoint.models.LoginRequest
import com.example.logpoint.models.RegisterRequest
import com.example.logpoint.models.UserResponse
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(
        @Body loginRequest: LoginRequest
    ): Response<UserResponse>

    @POST("api/auth/register")
    suspend fun register(
        @Body registerRequest: RegisterRequest
    ): Response<UserResponse>
}