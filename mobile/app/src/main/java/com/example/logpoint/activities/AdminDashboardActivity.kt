package com.example.logpoint.activities

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.MenuItem
import android.view.View
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import androidx.lifecycle.lifecycleScope
import com.example.logpoint.R
import com.example.logpoint.models.VisitLogResponse
import com.example.logpoint.network.RetrofitClient
import com.example.logpoint.utils.SessionManager
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.button.MaterialButton
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class AdminDashboardActivity : AppCompatActivity() {

    private lateinit var toolbar: MaterialToolbar
    private lateinit var bottomNav: BottomNavigationView
    private lateinit var contentFrame: FrameLayout
    private lateinit var sessionManager: SessionManager

    private var currentTab = R.id.nav_dashboard

    // ── Sync state — backed by SharedPreferences ──────────────────────────────
    private var syncedGuardId: Long                  = -1L
    private var syncedGuardName: String              = ""
    private var syncedLogs: List<VisitLogResponse>   = emptyList()
    private var isSyncActive  = false
    private var isPollPending = false

    private val gson        = Gson()
    private val pollHandler = Handler(Looper.getMainLooper())
    private val liveHandler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_admin_dashboard)

        sessionManager = SessionManager(this)
        toolbar        = findViewById(R.id.toolbar)
        bottomNav      = findViewById(R.id.bottomNav)
        contentFrame   = findViewById(R.id.contentFrame)

        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayShowTitleEnabled(false)

        // ── Restore persisted sync state ──────────────────────────────────
        restoreSyncState()

        showTab(R.id.nav_dashboard)

        bottomNav.setOnItemSelectedListener { item ->
            if (item.itemId != currentTab) showTab(item.itemId)
            true
        }
    }

    // ── Restore sync from SharedPreferences ───────────────────────────────────
    private fun restoreSyncState() {
        if (!sessionManager.isSyncActive()) return
        syncedGuardId   = sessionManager.getSyncGuardId()
        syncedGuardName = sessionManager.getSyncGuardName()
        val json        = sessionManager.getSyncLogsJson() ?: return
        val type        = object : TypeToken<List<VisitLogResponse>>() {}.type
        syncedLogs      = gson.fromJson(json, type) ?: emptyList()
        isSyncActive    = syncedLogs.isNotEmpty()
        if (isSyncActive) startLivePoll(syncedGuardId)
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_logout -> { showLogoutDialog(); true }
            else -> super.onOptionsItemSelected(item)
        }
    }

    // ── Tab navigation ────────────────────────────────────────────────────────
    private fun showTab(tabId: Int) {
        currentTab = tabId
        when (tabId) {
            R.id.nav_dashboard   -> showDashboardTab()
            R.id.nav_visitor_log -> { toolbar.title = "Visitor Log";  loadFragment(VisitorLogFragment()) }
            R.id.nav_add_visitor -> { toolbar.title = "Add Visitor";  loadFragment(AddVisitorFragment()) }
            R.id.nav_profile     -> showProfileTab()
        }
    }

    // ── Dashboard tab ─────────────────────────────────────────────────────────
    private fun showDashboardTab() {
        toolbar.title = "Dashboard"
        contentFrame.removeAllViews()
        val view = layoutInflater.inflate(R.layout.fragment_dashboard, contentFrame, false)

        val firstName = sessionManager.getFirstName() ?: "Admin"
        val lastName  = sessionManager.getLastName()  ?: ""
        view.findViewById<TextView>(R.id.tvWelcomeName).text =
            "${("$firstName $lastName").trim()}"
        view.findViewById<TextView>(R.id.tvWelcomeRole).text = "Office Administrator"
        view.findViewById<TextView>(R.id.tvWelcomeDate).text = getPhilippineDate()

        view.findViewById<CardView>(R.id.cardAddVisitor).setOnClickListener {
            bottomNav.selectedItemId = R.id.nav_add_visitor
        }
        view.findViewById<CardView>(R.id.cardVisitorLog).setOnClickListener {
            bottomNav.selectedItemId = R.id.nav_visitor_log
        }
        view.findViewById<MaterialButton>(R.id.btnSyncGuard).setOnClickListener {
            showSyncGuardDialog(view)
        }

        contentFrame.addView(view)
        fetchDashboardStats(view)

        if (syncedLogs.isNotEmpty()) {
            showSyncedLogsCard(view, syncedLogs, syncedGuardName)
        } else {
            view.findViewById<CardView>(R.id.cardSyncedLogs)?.visibility = View.GONE
            view.findViewById<View>(R.id.cardSyncedEmpty)?.visibility    = View.VISIBLE
        }
    }

    // ── Fetch own stats ───────────────────────────────────────────────────────
    private fun fetchDashboardStats(view: View) {
        lifecycleScope.launch {
            try {
                val res = RetrofitClient.instance.getVisitLogs()
                if (res.isSuccessful) {
                    updateStats(view, res.body() ?: emptyList())
                }
            } catch (_: Exception) { /* silent */ }
        }
    }

    private fun updateStats(view: View, ownLogs: List<VisitLogResponse>) {
        val allLogs = ownLogs + syncedLogs
        val tz      = TimeZone.getTimeZone("Asia/Manila")
        val outSdf  = SimpleDateFormat("MM/dd/yyyy", Locale.US).also { it.timeZone = tz }
        val inSdf   = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).also { it.timeZone = tz }
        val today   = outSdf.format(Date())

        fun parseDay(s: String?): String? = try {
            s?.let { outSdf.format(inSdf.parse(it.take(19)) ?: return@let null) }
        } catch (_: Exception) { null }

        val todayCount     = allLogs.count { parseDay(it.timeIn) == today }
        val totalCount     = allLogs.size
        val activeCount    = allLogs.count { it.status == "ACTIVE" }
        val completedToday = allLogs.count { it.status == "COMPLETED" && parseDay(it.timeIn) == today }

        runOnUiThread {
            view.findViewById<TextView>(R.id.tvTodayVisitors)?.text  = todayCount.toString()
            view.findViewById<TextView>(R.id.tvTotalVisitors)?.text  = totalCount.toString()
            view.findViewById<TextView>(R.id.tvActiveVisitors)?.text = activeCount.toString()
            view.findViewById<TextView>(R.id.tvCompletedToday)?.text = completedToday.toString()
        }
    }

    // ── Synced guard logs card ─────────────────────────────────────────────────
    private fun showSyncedLogsCard(view: View, logs: List<VisitLogResponse>, guardName: String) {
        view.findViewById<View>(R.id.cardSyncedEmpty)?.visibility     = View.GONE
        val card = view.findViewById<CardView>(R.id.cardSyncedLogs) ?: return
        card.visibility = View.VISIBLE

        val initial   = guardName.firstOrNull()?.uppercaseChar()?.toString() ?: "G"
        val active    = logs.count { it.status == "ACTIVE" }
        val completed = logs.count { it.status == "COMPLETED" }

        view.findViewById<TextView>(R.id.tvSyncedLogsCount)?.text =
            "${logs.size} record${if (logs.size != 1) "s" else ""}"
        view.findViewById<TextView>(R.id.tvGuardInitial)?.text = initial
        view.findViewById<TextView>(R.id.tvGuardName)?.text    = guardName
        view.findViewById<TextView>(R.id.tvGuardLogMeta)?.text =
            "${logs.size} log${if (logs.size != 1) "s" else ""}  ·  $active active  ·  $completed completed"

        // Update btn to show guard name
        view.findViewById<MaterialButton>(R.id.btnSyncGuard)?.text = "⟳  $guardName"

        val recycler = view.findViewById<androidx.recyclerview.widget.RecyclerView>(R.id.rvSyncedLogs)
        recycler?.adapter = com.example.logpoint.adapters.SyncedLogAdapter(logs)
        recycler?.layoutManager = androidx.recyclerview.widget.LinearLayoutManager(this)

        view.findViewById<TextView>(R.id.tvClearSync)?.setOnClickListener {
            clearSyncedData(view)
        }
    }

    private fun clearSyncedData(view: View) {
        val gId = syncedGuardId
        stopPolling()
        if (gId != -1L) {
            lifecycleScope.launch {
                try { RetrofitClient.instance.cancelSync(gId) } catch (_: Exception) {}
            }
        }
        syncedGuardId   = -1L
        syncedGuardName = ""
        syncedLogs      = emptyList()
        sessionManager.clearSyncState()

        view.findViewById<CardView>(R.id.cardSyncedLogs)?.visibility = View.GONE
        view.findViewById<View>(R.id.cardSyncedEmpty)?.visibility    = View.VISIBLE
        view.findViewById<MaterialButton>(R.id.btnSyncGuard)?.text   = "Sync Guard"
        fetchDashboardStats(view)
    }

    // ── Sync guard dialog ─────────────────────────────────────────────────────
    private fun showSyncGuardDialog(dashView: View) {
        lifecycleScope.launch {
            val guards = try {
                val res = RetrofitClient.instance.getSyncGuards()
                if (res.isSuccessful) res.body() ?: emptyList() else emptyList()
            } catch (_: Exception) { emptyList() }

            if (guards.isEmpty()) {
                runOnUiThread {
                    Toast.makeText(this@AdminDashboardActivity,
                        "No security guards found.", Toast.LENGTH_SHORT).show()
                }
                return@launch
            }

            runOnUiThread {
                val names = guards.map {
                    "${it.get("firstName")?.asString ?: ""} ${it.get("lastName")?.asString ?: ""}".trim()
                }.toTypedArray()

                AlertDialog.Builder(this@AdminDashboardActivity)
                    .setTitle("Select Guard to Sync")
                    .setItems(names) { _, idx ->
                        val g   = guards[idx]
                        val gId = g.get("id")?.asLong ?: return@setItems
                        startSyncRequest(dashView, gId, names[idx])
                    }
                    .setNegativeButton("Cancel", null)
                    .show()
            }
        }
    }

    // ── Sync flow ─────────────────────────────────────────────────────────────
    private fun startSyncRequest(dashView: View, guardId: Long, guardName: String) {
        syncedGuardId   = guardId
        syncedGuardName = guardName
        isPollPending   = true
        isSyncActive    = false

        Toast.makeText(this, "Sync request sent to $guardName…", Toast.LENGTH_SHORT).show()

        lifecycleScope.launch {
            try {
                RetrofitClient.instance.requestSync(guardId)
            } catch (_: Exception) {
                runOnUiThread {
                    Toast.makeText(this@AdminDashboardActivity,
                        "Failed to send sync request.", Toast.LENGTH_SHORT).show()
                }
                isPollPending = false
                return@launch
            }
            pollForAcceptance(guardId, guardName)
        }
    }

    private fun pollForAcceptance(guardId: Long, guardName: String) {
        lateinit var runnable: Runnable
        runnable = Runnable {
            if (!isPollPending) return@Runnable
            lifecycleScope.launch {
                try {
                    val res = RetrofitClient.instance.getSyncStatus(guardId)
                    if (res.isSuccessful) {
                        when (res.body()?.get("status")?.asString ?: "NONE") {
                            "ACCEPTED" -> {
                                isPollPending = false
                                collectSyncedLogs(guardId, guardName)
                            }
                            "DECLINED" -> {
                                isPollPending = false
                                runOnUiThread {
                                    Toast.makeText(this@AdminDashboardActivity,
                                        "$guardName declined the sync request.",
                                        Toast.LENGTH_LONG).show()
                                }
                            }
                            else -> pollHandler.postDelayed(runnable, 2500)
                        }
                    } else {
                        pollHandler.postDelayed(runnable, 2500)
                    }
                } catch (_: Exception) {
                    pollHandler.postDelayed(runnable, 2500)
                }
            }
        }
        pollHandler.post(runnable)
    }

    private fun collectSyncedLogs(guardId: Long, guardName: String) {
        lifecycleScope.launch {
            try {
                val logsRes = RetrofitClient.instance.getSyncLogs(guardId)
                if (logsRes.isSuccessful) {
                    val logs = logsRes.body() ?: emptyList()
                    try { RetrofitClient.instance.activateSync(guardId) } catch (_: Exception) {}

                    syncedLogs      = logs
                    syncedGuardName = guardName
                    syncedGuardId   = guardId
                    isSyncActive    = true

                    // ── Persist ───────────────────────────────────────────
                    sessionManager.saveSyncState(guardId, guardName, gson.toJson(logs))

                    runOnUiThread {
                        Toast.makeText(this@AdminDashboardActivity,
                            "Synced ${logs.size} log(s) from $guardName",
                            Toast.LENGTH_SHORT).show()
                        if (currentTab == R.id.nav_dashboard) {
                            val v = contentFrame.getChildAt(0) ?: return@runOnUiThread
                            showSyncedLogsCard(v, logs, guardName)
                            fetchDashboardStats(v)
                        }
                    }
                    startLivePoll(guardId)
                } else {
                    runOnUiThread {
                        Toast.makeText(this@AdminDashboardActivity,
                            "Could not collect logs.", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (_: Exception) {
                runOnUiThread {
                    Toast.makeText(this@AdminDashboardActivity,
                        "Error collecting synced logs.", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun startLivePoll(guardId: Long) {
        lateinit var runnable: Runnable
        runnable = Runnable {
            if (!isSyncActive) return@Runnable
            lifecycleScope.launch {
                try {
                    val res = RetrofitClient.instance.getLiveLogs(guardId)
                    when {
                        res.isSuccessful -> {
                            val fresh = res.body() ?: emptyList()
                            syncedLogs = fresh
                            sessionManager.updateSyncLogs(gson.toJson(fresh))   // keep prefs fresh
                            if (currentTab == R.id.nav_dashboard) {
                                runOnUiThread {
                                    val v = contentFrame.getChildAt(0) ?: return@runOnUiThread
                                    showSyncedLogsCard(v, fresh, syncedGuardName)
                                    fetchDashboardStats(v)
                                }
                            }
                        }
                        res.code() == 404 -> { isSyncActive = false; return@launch }
                    }
                } catch (_: Exception) { /* silent */ }
            }
            if (isSyncActive) liveHandler.postDelayed(runnable, 10_000)
        }
        liveHandler.postDelayed(runnable, 10_000)
    }

    private fun stopPolling() {
        isPollPending = false
        isSyncActive  = false
        pollHandler.removeCallbacksAndMessages(null)
        liveHandler.removeCallbacksAndMessages(null)
    }

    // ── Profile tab ───────────────────────────────────────────────────────────
    private fun showProfileTab() {
        toolbar.title = "Profile"
        contentFrame.removeAllViews()
        val view = layoutInflater.inflate(R.layout.fragment_profile, contentFrame, false)
        populateProfile(view)
        view.findViewById<MaterialButton>(R.id.btnProfileLogout)
            .setOnClickListener { showLogoutDialog() }
        contentFrame.addView(view)
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
        val role      = sessionManager.getRole()      ?: "Office Administrator"
        val initial   = firstName.firstOrNull()?.uppercaseChar()?.toString() ?: "U"
        view.findViewById<TextView>(R.id.tvProfileInitial).text = initial
        view.findViewById<TextView>(R.id.tvProfileName).text = "$firstName $lastName".trim().ifEmpty { "User" }
        view.findViewById<TextView>(R.id.tvProfileRole).text  = role
        view.findViewById<TextView>(R.id.tvProfileEmail).text = email
    }

    private fun showLogoutDialog() {
        AlertDialog.Builder(this)
            .setTitle("Logout")
            .setMessage("Are you sure you want to logout?")
            .setPositiveButton("Yes, logout") { _, _ ->
                val gId = syncedGuardId
                stopPolling()
                // NOTE: We do NOT clear sync state on logout so it restores on next login.
                // Call sessionManager.clearSyncState() here only if you want a full wipe.
                if (gId != -1L && isSyncActive) {
                    lifecycleScope.launch {
                        try { RetrofitClient.instance.cancelSync(gId) } catch (_: Exception) {}
                    }
                }
                sessionManager.logout()  // clears login keys; sync keys persist separately
                startActivity(Intent(this, LoginActivity::class.java))
                finish()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun getPhilippineDate(): String {
        val sdf = SimpleDateFormat("EEEE, MMMM d, yyyy", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("Asia/Manila")
        return sdf.format(Date())
    }

    @Suppress("OVERRIDE_DEPRECATION")
    override fun onBackPressed() {
        if (currentTab != R.id.nav_dashboard) {
            bottomNav.selectedItemId = R.id.nav_dashboard
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopPolling()
    }
}