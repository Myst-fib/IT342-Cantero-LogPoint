package com.example.logpoint.activities

import android.content.Intent
import android.os.Bundle
import android.text.TextUtils
import android.text.method.HideReturnsTransformationMethod
import android.text.method.PasswordTransformationMethod
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.logpoint.R
import com.example.logpoint.models.RegisterRequest
import com.example.logpoint.network.RetrofitClient
import kotlinx.coroutines.launch
import java.io.IOException

class RegisterActivity : AppCompatActivity() {

    private lateinit var etEmail: EditText
    private lateinit var spinnerRole: Spinner
    private lateinit var etFirstName: EditText
    private lateinit var etLastName: EditText
    private lateinit var etPassword: EditText
    private lateinit var etConfirmPassword: EditText
    private lateinit var ivTogglePassword: ImageView
    private lateinit var ivToggleConfirmPassword: ImageView
    private lateinit var btnRegister: Button
    private lateinit var tvLogin: TextView
    private lateinit var tvError: TextView
    private lateinit var progressBar: ProgressBar

    private val roles = listOf("Select Role", "Office Administrator", "Security Guard")
    private var isPasswordVisible = false
    private var isConfirmPasswordVisible = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        initViews()
        setupRoleSpinner()
        setupClickListeners()
    }

    private fun initViews() {
        etEmail                 = findViewById(R.id.etEmail)
        spinnerRole             = findViewById(R.id.spinnerRole)
        etFirstName             = findViewById(R.id.etFirstName)
        etLastName              = findViewById(R.id.etLastName)
        etPassword              = findViewById(R.id.etPassword)
        etConfirmPassword       = findViewById(R.id.etConfirmPassword)
        ivTogglePassword        = findViewById(R.id.ivTogglePassword)
        ivToggleConfirmPassword = findViewById(R.id.ivToggleConfirmPassword)
        btnRegister             = findViewById(R.id.btnRegister)
        tvLogin                 = findViewById(R.id.tvLogin)
        tvError                 = findViewById(R.id.tvError)
        progressBar             = findViewById(R.id.progressBar)
    }

    private fun setupRoleSpinner() {
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, roles)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerRole.adapter = adapter
    }

    private fun setupClickListeners() {
        btnRegister.setOnClickListener { performRegistration() }

        tvLogin.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
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

        ivToggleConfirmPassword.setOnClickListener {
            isConfirmPasswordVisible = !isConfirmPasswordVisible
            if (isConfirmPasswordVisible) {
                etConfirmPassword.transformationMethod = HideReturnsTransformationMethod.getInstance()
                ivToggleConfirmPassword.setImageResource(R.drawable.eye)
            } else {
                etConfirmPassword.transformationMethod = PasswordTransformationMethod.getInstance()
                ivToggleConfirmPassword.setImageResource(R.drawable.eye_slash)
            }
            etConfirmPassword.setSelection(etConfirmPassword.text.length)
        }
    }

    private fun performRegistration() {
        val email           = etEmail.text.toString().trim()
        val role            = spinnerRole.selectedItemPosition
        val firstName       = etFirstName.text.toString().trim()
        val lastName        = etLastName.text.toString().trim()
        val password        = etPassword.text.toString().trim()
        val confirmPassword = etConfirmPassword.text.toString().trim()

        if (TextUtils.isEmpty(email) || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            etEmail.error = "Enter a valid email"
            showError("Please enter a valid email address")
            return
        }
        if (role == 0) {
            showError("Please select a role")
            return
        }
        if (TextUtils.isEmpty(firstName)) {
            etFirstName.error = "First name is required"
            showError("Please enter your first name")
            return
        }
        if (TextUtils.isEmpty(lastName)) {
            etLastName.error = "Last name is required"
            showError("Please enter your last name")
            return
        }
        if (password.length < 6) {
            etPassword.error = "Minimum 6 characters"
            showError("Password must be at least 6 characters")
            return
        }
        if (password != confirmPassword) {
            etConfirmPassword.error = "Passwords do not match"
            showError("The passwords you entered do not match")
            return
        }

        showLoading(true)
        tvError.visibility = View.GONE

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.register(
                    RegisterRequest(
                        firstName = firstName,
                        lastName  = lastName,
                        email     = email,
                        password  = password,
                        role      = roles[role]
                    )
                )

                if (response.isSuccessful) {
                    Toast.makeText(
                        this@RegisterActivity,
                        "Account created! Please log in.",
                        Toast.LENGTH_LONG
                    ).show()
                    startActivity(Intent(this@RegisterActivity, LoginActivity::class.java))
                    finish()
                } else {
                    val errorMsg = response.errorBody()?.string() ?: "Registration failed"
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

    private fun showLoading(isLoading: Boolean) {
        progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        btnRegister.isEnabled = !isLoading
    }

    private fun showError(message: String) {
        tvError.text = message
        tvError.visibility = View.VISIBLE
    }
}