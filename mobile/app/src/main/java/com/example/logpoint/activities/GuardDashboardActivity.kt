package com.example.logpoint.activities

import android.content.Intent
import android.os.Bundle
import android.view.MenuItem
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.example.logpoint.R
import com.example.logpoint.utils.SessionManager
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.bottomnavigation.BottomNavigationView

class GuardDashboardActivity : AppCompatActivity() {

        private lateinit var toolbar: MaterialToolbar
        private lateinit var bottomNav: BottomNavigationView
        private lateinit var contentFrame: android.widget.FrameLayout
        private lateinit var sessionManager: SessionManager

        private var currentTab = R.id.nav_visitor_log

        override fun onCreate(savedInstanceState: Bundle?) {
                super.onCreate(savedInstanceState)
                setContentView(R.layout.activity_guard_dashboard)

                sessionManager = SessionManager(this)
                toolbar      = findViewById(R.id.toolbar)
                bottomNav    = findViewById(R.id.bottomNav)
                contentFrame = findViewById(R.id.contentFrame)

                setSupportActionBar(toolbar)
                supportActionBar?.setDisplayShowTitleEnabled(false)

                showTab(R.id.nav_visitor_log)

                bottomNav.setOnItemSelectedListener { item ->
                        if (item.itemId != currentTab) showTab(item.itemId)
                        if (item.itemId == R.id.nav_notifications) clearNotificationBadge()
                        true
                }
        }

        override fun onOptionsItemSelected(item: MenuItem): Boolean {
                return when (item.itemId) {
                        R.id.action_logout -> { showLogoutDialog(); true }
                        else -> super.onOptionsItemSelected(item)
                }
        }

        private fun showTab(tabId: Int) {
                currentTab = tabId

                when (tabId) {
                        R.id.nav_visitor_log -> {
                                toolbar.title = "Visitor Log"
                                loadFragment(VisitorLogFragment())
                        }

                        R.id.nav_add_visitor -> {
                                toolbar.title = "Add Visitor"
                                loadFragment(AddVisitorFragment())
                        }

                        R.id.nav_notifications -> {
                                toolbar.title = "Notifications"
                                loadFragment(NotificationsFragment())
                        }

                        R.id.nav_profile -> {
                                toolbar.title = "Profile"
                                contentFrame.removeAllViews()
                                val view = layoutInflater.inflate(R.layout.fragment_profile, contentFrame, false)
                                populateProfile(view)
                                view.findViewById<com.google.android.material.button.MaterialButton>(
                                        R.id.btnProfileLogout
                                ).setOnClickListener { showLogoutDialog() }
                                contentFrame.addView(view)
                        }
                }
        }

        private fun loadFragment(fragment: androidx.fragment.app.Fragment) {
                supportFragmentManager.beginTransaction()
                        .replace(R.id.contentFrame, fragment)
                        .commit()
        }

        private fun populateProfile(view: View) {
                val firstName = sessionManager.getFirstName() ?: ""
                val lastName  = sessionManager.getLastName()  ?: ""
                val email     = sessionManager.getEmail()     ?: ""
                val role      = sessionManager.getRole()      ?: "Security Guard"
                val initial   = firstName.firstOrNull()?.uppercaseChar()?.toString() ?: "U"
                view.findViewById<TextView>(R.id.tvProfileInitial).text = initial
                view.findViewById<TextView>(R.id.tvProfileName).text =
                        "$firstName $lastName".trim().ifEmpty { "User" }
                view.findViewById<TextView>(R.id.tvProfileRole).text = role
                view.findViewById<TextView>(R.id.tvProfileEmail).text = email
        }

        fun showNotificationBadge() {
                bottomNav.getOrCreateBadge(R.id.nav_notifications).apply {
                        isVisible = true
                        backgroundColor = resources.getColor(R.color.error, theme)
                }
        }

        private fun clearNotificationBadge() {
                bottomNav.removeBadge(R.id.nav_notifications)
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
                if (currentTab != R.id.nav_visitor_log) {
                        bottomNav.selectedItemId = R.id.nav_visitor_log
                } else {
                        super.onBackPressed()
                }
        }
}