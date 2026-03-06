package com.example.logpoint

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import com.example.logpoint.activities.DashboardActivity
import com.example.logpoint.activities.LoginActivity
import com.example.logpoint.utils.SessionManager

class MainActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Set a simple layout first to prove UI works
        setContentView(R.layout.activity_main)

        // Initialize SessionManager
        sessionManager = SessionManager(this)

        // Add a small delay so you can see the splash screen
        Handler(Looper.getMainLooper()).postDelayed({
            // Check if user is already logged in
            if (sessionManager.isLoggedIn()) {
                startActivity(Intent(this, DashboardActivity::class.java))
            } else {
                startActivity(Intent(this, LoginActivity::class.java))
            }
            finish()
        }, 2000) // 2 second delay so you can see something
    }
}