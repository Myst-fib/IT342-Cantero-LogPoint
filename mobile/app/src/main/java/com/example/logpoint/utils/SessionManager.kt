package com.example.logpoint.utils

import android.content.Context
import android.content.SharedPreferences
import com.example.logpoint.models.UserResponse

class SessionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("logpoint_prefs", Context.MODE_PRIVATE)

    companion object {
        const val KEY_IS_LOGGED_IN = "is_logged_in"
        const val KEY_USER_ID      = "user_id"
        const val KEY_EMAIL        = "email"
        const val KEY_FIRST_NAME   = "first_name"
        const val KEY_LAST_NAME    = "last_name"
        const val KEY_ROLE         = "role"

        // ── Sync persistence keys ─────────────────────────────────────────
        const val KEY_SYNC_GUARD_ID   = "sync_guard_id"
        const val KEY_SYNC_GUARD_NAME = "sync_guard_name"
        const val KEY_SYNC_LOGS_JSON  = "sync_logs_json"
        const val KEY_SYNC_ACTIVE     = "sync_active"
    }

    fun saveLoginSession(user: UserResponse) {
        prefs.edit().apply {
            putBoolean(KEY_IS_LOGGED_IN, true)
            putLong(KEY_USER_ID,   user.id ?: -1L)
            putString(KEY_EMAIL,      user.email)
            putString(KEY_FIRST_NAME, user.firstName)
            putString(KEY_LAST_NAME,  user.lastName)
            putString(KEY_ROLE,       user.role)
            apply()
        }
    }

    fun isLoggedIn(): Boolean   = prefs.getBoolean(KEY_IS_LOGGED_IN, false)
    fun getUserId(): Long       = prefs.getLong(KEY_USER_ID, -1L)
    fun getEmail(): String?     = prefs.getString(KEY_EMAIL,      null)
    fun getFirstName(): String? = prefs.getString(KEY_FIRST_NAME, null)
    fun getLastName(): String?  = prefs.getString(KEY_LAST_NAME,  null)
    fun getRole(): String?      = prefs.getString(KEY_ROLE,       null)

    fun getUsername(): String? {
        val fn = getFirstName() ?: return getEmail()
        val ln = getLastName()  ?: ""
        return "$fn $ln".trim()
    }

    // ── Sync helpers ──────────────────────────────────────────────────────
    fun saveSyncState(guardId: Long, guardName: String, logsJson: String) {
        prefs.edit().apply {
            putLong(KEY_SYNC_GUARD_ID,     guardId)
            putString(KEY_SYNC_GUARD_NAME, guardName)
            putString(KEY_SYNC_LOGS_JSON,  logsJson)
            putBoolean(KEY_SYNC_ACTIVE,    true)
            apply()
        }
    }

    fun updateSyncLogs(logsJson: String) {
        prefs.edit().putString(KEY_SYNC_LOGS_JSON, logsJson).apply()
    }

    fun clearSyncState() {
        prefs.edit().apply {
            remove(KEY_SYNC_GUARD_ID)
            remove(KEY_SYNC_GUARD_NAME)
            remove(KEY_SYNC_LOGS_JSON)
            remove(KEY_SYNC_ACTIVE)
            apply()
        }
    }

    fun getSyncGuardId(): Long      = prefs.getLong(KEY_SYNC_GUARD_ID, -1L)
    fun getSyncGuardName(): String  = prefs.getString(KEY_SYNC_GUARD_NAME, "") ?: ""
    fun getSyncLogsJson(): String?  = prefs.getString(KEY_SYNC_LOGS_JSON, null)
    fun isSyncActive(): Boolean     = prefs.getBoolean(KEY_SYNC_ACTIVE, false)

    fun logout() {
        // Preserve sync state across logout/login
        val guardId   = getSyncGuardId()
        val guardName = getSyncGuardName()
        val logsJson  = getSyncLogsJson()
        val syncOk    = isSyncActive()
        prefs.edit().clear().apply()
        if (syncOk && guardId != -1L) saveSyncState(guardId, guardName, logsJson ?: "[]")
    }
}