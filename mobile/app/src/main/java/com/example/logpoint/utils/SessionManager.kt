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

    fun isLoggedIn(): Boolean  = prefs.getBoolean(KEY_IS_LOGGED_IN, false)
    fun getEmail(): String?    = prefs.getString(KEY_EMAIL,      null)
    fun getFirstName(): String? = prefs.getString(KEY_FIRST_NAME, null)
    fun getLastName(): String?  = prefs.getString(KEY_LAST_NAME,  null)
    fun getRole(): String?      = prefs.getString(KEY_ROLE,       null)

    /** Legacy helper — returns "FirstName LastName" */
    fun getUsername(): String? {
        val fn = getFirstName() ?: return getEmail()
        val ln = getLastName()  ?: ""
        return "$fn $ln".trim()
    }

    fun logout() {
        prefs.edit().clear().apply()
    }
}