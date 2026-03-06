package com.example.logpoint.activities

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.example.logpoint.R
import com.example.logpoint.utils.SessionManager

class DashboardActivity : AppCompatActivity() {

    private lateinit var tvWelcome: TextView
    private lateinit var btnLogout: Button
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        initViews()
        setupClickListeners()
        loadUserInfo()
    }

    private fun initViews() {
        tvWelcome = findViewById(R.id.tvWelcome)
        btnLogout = findViewById(R.id.btnLogout)
        sessionManager = SessionManager(this)
    }

    private fun setupClickListeners() {
        btnLogout.setOnClickListener {
            sessionManager.logout()
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    private fun loadUserInfo() {
        val username = sessionManager.getUsername()
        tvWelcome.text = "Welcome, $username!"
    }
}