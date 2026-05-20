package com.example.logpoint.network

import com.example.logpoint.models.LoginRequest
import com.example.logpoint.models.RegisterRequest
import com.example.logpoint.models.UpdateVisitLogRequest
import com.example.logpoint.models.UserResponse
import com.example.logpoint.models.VisitLogResponse
import com.example.logpoint.models.VisitorRequest
import com.example.logpoint.models.VisitorResponse
import com.example.logpoint.models.SyncRespondRequest
import com.google.gson.JsonObject
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

    // ── Sync ──
    @GET("api/sync/guards")
    suspend fun getSyncGuards(): Response<List<JsonObject>>

    @POST("api/sync/request/{guardId}")
    suspend fun requestSync(@Path("guardId") guardId: Long): Response<JsonObject>

    @GET("api/sync/status/{guardId}")
    suspend fun getSyncStatus(@Path("guardId") guardId: Long): Response<JsonObject>

    @GET("api/sync/logs/{guardId}")
    suspend fun getSyncLogs(@Path("guardId") guardId: Long): Response<List<VisitLogResponse>>

    @POST("api/sync/activate/{guardId}")
    suspend fun activateSync(@Path("guardId") guardId: Long): Response<JsonObject>

    @GET("api/sync/live/{guardId}")
    suspend fun getLiveLogs(@Path("guardId") guardId: Long): Response<List<VisitLogResponse>>

    @POST("api/sync/cancel/{guardId}")
    suspend fun cancelSync(@Path("guardId") guardId: Long): Response<JsonObject>

    @GET("api/sync/my-request")
    suspend fun getMyRequest(): Response<JsonObject>

    @POST("api/sync/respond")
    suspend fun respondToSync(@Body request: SyncRespondRequest): Response<JsonObject>
}