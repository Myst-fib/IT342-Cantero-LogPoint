package com.example.logpoint.activities

import android.content.Intent
import android.os.Bundle
import android.text.TextUtils
import android.text.method.HideReturnsTransformationMethod
import android.text.method.PasswordTransformationMethod
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
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
    private lateinit var ivTogglePassword: ImageView
    private lateinit var btnLogin: Button
    private lateinit var tvSignUp: TextView
    private lateinit var tvError: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var sessionManager: SessionManager

    private var isPasswordVisible = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        initViews()
        sessionManager = SessionManager(this)

        if (sessionManager.isLoggedIn()) {
            navigateByRole()
            return
        }

        setupClickListeners()
    }

    private fun initViews() {
        etUsername       = findViewById(R.id.etUsername)
        etPassword       = findViewById(R.id.etPassword)
        ivTogglePassword = findViewById(R.id.ivTogglePassword)
        btnLogin         = findViewById(R.id.btnLogin)
        tvSignUp         = findViewById(R.id.tvSignUp)
        tvError          = findViewById(R.id.tvError)
        progressBar      = findViewById(R.id.progressBar)
    }

    private fun setupClickListeners() {
        btnLogin.setOnClickListener { performLogin() }

        tvSignUp.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
            finish()
        }

        ivTogglePassword.setOnClickListener {
            isPasswordVisible = !isPasswordVisible
            if (isPasswordVisible) {
                etPassword.transformationMethod = HideReturnsTransformationMethod.getInstance()
                ivTogglePassword.setImageResource(R.drawable.eye)
            } else {
                etPassword.transformationMethod = PasswordTransformationMethod.getInstance()
                ivTogglePassword.setImageResource(R.drawable.eye_slash)
            }
            etPassword.setSelection(etPassword.text.length)
        }
    }

    private fun performLogin() {
        val email    = etUsername.text.toString().trim()
        val password = etPassword.text.toString().trim()

        if (TextUtils.isEmpty(email)) {
            etUsername.error = "Email is required"
            return
        }
        if (TextUtils.isEmpty(password)) {
            etPassword.error = "Password is required"
            return
        }

        showLoading(true)
        tvError.visibility = View.GONE

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.login(
                    LoginRequest(username = email, password = password)
                )

                if (response.isSuccessful) {
                    val user = response.body()
                    if (user != null) {
                        sessionManager.saveLoginSession(user)
                        Toast.makeText(this@LoginActivity, "Welcome back!", Toast.LENGTH_SHORT).show()
                        navigateByRole()
                    } else {
                        showError("Login failed: empty response")
                    }
                } else {
                    val errorMsg = response.errorBody()?.string() ?: "Invalid credentials"
                    showError(errorMsg)
                }
            } catch (e: IOException) {
                showError("Network error: cannot reach server.\nCheck your connection or BASE_URL in RetrofitClient.")
            } catch (e: Exception) {
                showError("Error: ${e.message}")
            } finally {
                showLoading(false)
            }
        }
    }

    /** Route to the correct dashboard based on role stored in session */
    private fun navigateByRole() {
        val role = sessionManager.getRole()?.lowercase() ?: ""
        val intent = when {
            role.contains("admin") -> Intent(this, AdminDashboardActivity::class.java)
            else                   -> Intent(this, GuardDashboardActivity::class.java)
        }
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }

    private fun showLoading(isLoading: Boolean) {
        progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        btnLogin.isEnabled = !isLoading
    }

    private fun showError(message: String) {
        tvError.text = message
        tvError.visibility = View.VISIBLE
    }
}