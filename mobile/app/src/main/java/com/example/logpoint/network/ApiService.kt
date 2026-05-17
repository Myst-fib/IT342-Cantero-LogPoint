package com.example.logpoint.network

import com.example.logpoint.models.LoginRequest
import com.example.logpoint.models.RegisterRequest
import com.example.logpoint.models.UpdateVisitLogRequest
import com.example.logpoint.models.UserResponse
import com.example.logpoint.models.VisitLogResponse
import com.example.logpoint.models.VisitorRequest
import com.example.logpoint.models.VisitorResponse
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // ── Auth ──
    @POST("api/auth/login")
    suspend fun login(@Body loginRequest: LoginRequest): Response<UserResponse>

    @POST("api/auth/register")
    suspend fun register(@Body registerRequest: RegisterRequest): Response<UserResponse>

    @POST("api/auth/logout")
    suspend fun logout(): Response<Unit>

    // ── Visitors ──
    @POST("api/visitors")
    suspend fun createVisitor(@Body visitorRequest: VisitorRequest): Response<VisitorResponse>

    @GET("api/visitors")
    suspend fun getAllVisitors(): Response<List<VisitorResponse>>

    @PUT("api/visitors/{id}")
    suspend fun updateVisitor(
        @Path("id") id: Long,
        @Body visitorRequest: VisitorRequest
    ): Response<VisitorResponse>

    @DELETE("api/visitors/{id}")
    suspend fun deleteVisitor(@Path("id") id: Long): Response<Unit>

    // ── Visit Logs ──
    @GET("api/visit-logs")
    suspend fun getVisitLogs(): Response<List<VisitLogResponse>>

    @POST("api/visit-logs/check-out/{id}")
    suspend fun checkOut(@Path("id") id: Long): Response<VisitLogResponse>

    @PUT("api/visit-logs/{id}")
    suspend fun updateVisitLog(
        @Path("id") id: Long,
        @Body updateRequest: UpdateVisitLogRequest
    ): Response<VisitLogResponse>

    @DELETE("api/visit-logs/{id}")
    suspend fun deleteVisitLog(@Path("id") id: Long): Response<Unit>
}