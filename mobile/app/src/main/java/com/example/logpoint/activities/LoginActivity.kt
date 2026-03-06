package com.example.logpoint.activities

import android.content.Intent
import android.os.Bundle
import android.text.TextUtils
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.logpoint.R
import com.example.logpoint.models.LoginRequest
import com.example.logpoint.network.RetrofitClient
import com.example.logpoint.utils.SessionManager
import kotlinx.coroutines.launch
import java.io.IOException

class LoginActivity : AppCompatActivity() {

    private lateinit var etUsername: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnLogin: Button
    private lateinit var tvSignUp: TextView
    private lateinit var tvError: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        // Initialize views
        initViews()

        // Initialize session manager
        sessionManager = SessionManager(this)

        // Check if already logged in
        if (sessionManager.isLoggedIn()) {
            navigateToDashboard()
        }

        // Set click listeners
        setupClickListeners()
    }

    private fun initViews() {
        etUsername = findViewById(R.id.etUsername)
        etPassword = findViewById(R.id.etPassword)
        btnLogin = findViewById(R.id.btnLogin)
        tvSignUp = findViewById(R.id.tvSignUp)
        tvError = findViewById(R.id.tvError)
        progressBar = findViewById(R.id.progressBar)
    }

    private fun setupClickListeners() {
        btnLogin.setOnClickListener {
            performLogin()
        }

        tvSignUp.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
            finish()
        }
    }

    private fun performLogin() {
        val username = etUsername.text.toString().trim()
        val password = etPassword.text.toString().trim()

        // Validate inputs
        if (TextUtils.isEmpty(username)) {
            etUsername.error = "Username is required"
            return
        }

        if (TextUtils.isEmpty(password)) {
            etPassword.error = "Password is required"
            return
        }

        // Show progress, hide error
        showLoading(true)
        tvError.visibility = View.GONE

        // Make API call
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.login(
                    LoginRequest(username, password)
                )

                if (response.isSuccessful) {
                    response.body()?.let { user ->
                        // Save session
                        user.id?.let { userId ->
                            sessionManager.saveLoginSession(
                                userId,
                                user.username ?: username,
                                user.email ?: ""
                            )
                        }

                        Toast.makeText(
                            this@LoginActivity,
                            "Login successful!",
                            Toast.LENGTH_SHORT
                        ).show()

                        navigateToDashboard()
                    }
                } else {
                    showError(response.errorBody()?.string() ?: "Login failed")
                }
            } catch (e: IOException) {
                showError("Network error: ${e.message}")
            } catch (e: Exception) {
                showError("Server error: ${e.message}")
            } finally {
                showLoading(false)
            }
        }
    }

    private fun showLoading(isLoading: Boolean) {
        progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        btnLogin.isEnabled = !isLoading
    }

    private fun showError(message: String) {
        tvError.text = message
        tvError.visibility = View.VISIBLE
    }

    private fun navigateToDashboard() {
        startActivity(Intent(this, DashboardActivity::class.java))
        finish()
    }
}