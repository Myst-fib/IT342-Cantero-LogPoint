package com.example.logpoint.activities

import android.content.Intent
import android.os.Bundle
import android.view.MenuItem
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import com.example.logpoint.R
import com.example.logpoint.utils.SessionManager
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.bottomnavigation.BottomNavigationView

class AdminDashboardActivity : AppCompatActivity() {

    private lateinit var toolbar: MaterialToolbar
    private lateinit var bottomNav: BottomNavigationView
    private lateinit var contentFrame: android.widget.FrameLayout
    private lateinit var sessionManager: SessionManager

    // Keep track of which view is currently shown
    private var currentTab = R.id.nav_dashboard

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_admin_dashboard)

        sessionManager = SessionManager(this)

        toolbar      = findViewById(R.id.toolbar)
        bottomNav    = findViewById(R.id.bottomNav)
        contentFrame = findViewById(R.id.contentFrame)

        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayShowTitleEnabled(false)

        // Load default tab
        showTab(R.id.nav_dashboard)

        bottomNav.setOnItemSelectedListener { item ->
            if (item.itemId != currentTab) {
                showTab(item.itemId)
            }
            true
        }
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_logout -> {
                showLogoutDialog()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    private fun showTab(tabId: Int) {
        currentTab = tabId
        contentFrame.removeAllViews()

        val inflater = layoutInflater

        when (tabId) {
            R.id.nav_dashboard -> {
                toolbar.title = "Dashboard"
                val view = inflater.inflate(R.layout.fragment_dashboard, contentFrame, false)

                // Populate welcome card
                val firstName = sessionManager.getFirstName() ?: "Admin"
                val lastName  = sessionManager.getLastName()  ?: ""
                view.findViewById<TextView>(R.id.tvWelcomeName).text =
                    "Welcome, $firstName $lastName".trim() + "!"
                view.findViewById<TextView>(R.id.tvWelcomeRole).text = "Office Administrator"

                // Quick action cards
                view.findViewById<CardView>(R.id.cardAddVisitor).setOnClickListener {
                    bottomNav.selectedItemId = R.id.nav_add_visitor
                }
                view.findViewById<CardView>(R.id.cardVisitorLog).setOnClickListener {
                    bottomNav.selectedItemId = R.id.nav_visitor_log
                }

                contentFrame.addView(view)
            }

            R.id.nav_visitor_log -> {
                toolbar.title = "Visitor Log"
                val view = inflater.inflate(R.layout.fragment_visitor_log, contentFrame, false)
                contentFrame.addView(view)
            }

            R.id.nav_add_visitor -> {
                toolbar.title = "Add Visitor"
                val view = inflater.inflate(R.layout.fragment_add_visitor, contentFrame, false)
                contentFrame.addView(view)
            }

            R.id.nav_profile -> {
                toolbar.title = "Profile"
                val view = inflater.inflate(R.layout.fragment_profile, contentFrame, false)
                populateProfile(view)
                view.findViewById<com.google.android.material.button.MaterialButton>(
                    R.id.btnProfileLogout
                ).setOnClickListener { showLogoutDialog() }
                contentFrame.addView(view)
            }
        }
    }

    private fun populateProfile(view: View) {
        val firstName = sessionManager.getFirstName() ?: ""
        val lastName  = sessionManager.getLastName()  ?: ""
        val email     = sessionManager.getEmail()     ?: ""
        val role      = sessionManager.getRole()      ?: "Office Administrator"
        val initial   = firstName.firstOrNull()?.uppercaseChar()?.toString() ?: "U"

        view.findViewById<TextView>(R.id.tvProfileInitial).text = initial
        view.findViewById<TextView>(R.id.tvProfileName).text =
            "$firstName $lastName".trim().ifEmpty { "User" }
        view.findViewById<TextView>(R.id.tvProfileRole).text = role
        view.findViewById<TextView>(R.id.tvProfileEmail).text = email
    }

    private fun showLogoutDialog() {
        AlertDialog.Builder(this)
            .setTitle("Logout")
            .setMessage("Are you sure you want to logout?")
            .setPositiveButton("Yes, logout") { _, _ ->
                sessionManager.logout()
                startActivity(Intent(this, LoginActivity::class.java))
                finish()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onBackPressed() {
        if (currentTab != R.id.nav_dashboard) {
            bottomNav.selectedItemId = R.id.nav_dashboard
        } else {
            super.onBackPressed()
        }
    }
}