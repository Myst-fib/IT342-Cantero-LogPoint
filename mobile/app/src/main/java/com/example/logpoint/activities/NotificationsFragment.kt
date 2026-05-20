package com.example.logpoint.activities

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.cardview.widget.CardView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.logpoint.R
import com.example.logpoint.models.SyncRespondRequest
import com.example.logpoint.network.RetrofitClient
import com.google.gson.JsonObject
import kotlinx.coroutines.launch
import java.io.IOException

class NotificationsFragment : Fragment() {

    private lateinit var layoutEmpty: LinearLayout
    private lateinit var cardSyncRequest: CardView
    private lateinit var tvAdminName: TextView
    private lateinit var tvRequestStatus: TextView
    private lateinit var btnAccept: com.google.android.material.button.MaterialButton
    private lateinit var btnDecline: com.google.android.material.button.MaterialButton
    private lateinit var progressBar: ProgressBar
    private lateinit var tvError: TextView

    private var pollHandler: Handler? = null
    private var currentStatus: String = ""
    private var isResponding = false

    companion object {
        private const val TAG = "NotificationsFragment"
        private const val POLL_INTERVAL_MS = 5000L
    }

    private val pollRunnable = object : Runnable {
        override fun run() {
            if (isAdded) {
                checkForSyncRequest()
                pollHandler?.postDelayed(this, POLL_INTERVAL_MS)
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View = inflater.inflate(R.layout.fragment_notifications, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        layoutEmpty     = view.findViewById(R.id.layoutNoNotifications)
        cardSyncRequest = view.findViewById(R.id.cardSyncRequest)
        tvAdminName     = view.findViewById(R.id.tvAdminName)
        tvRequestStatus = view.findViewById(R.id.tvRequestStatus)
        btnAccept       = view.findViewById(R.id.btnAccept)
        btnDecline      = view.findViewById(R.id.btnDecline)
        progressBar     = view.findViewById(R.id.progressBar)
        tvError         = view.findViewById(R.id.tvError)

        btnAccept.setOnClickListener  { respondToSync("ACCEPTED") }
        btnDecline.setOnClickListener { respondToSync("DECLINED") }

        startPolling()
    }

    override fun onResume() {
        super.onResume()
        startPolling()
    }

    override fun onPause() {
        super.onPause()
        stopPolling()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        stopPolling()
    }

    private fun startPolling() {
        stopPolling()
        pollHandler = Handler(Looper.getMainLooper())
        pollHandler?.post(pollRunnable)
    }

    private fun stopPolling() {
        pollHandler?.removeCallbacksAndMessages(null)
        pollHandler = null
    }

    private fun checkForSyncRequest() {
        if (!isAdded || isResponding) return

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.getMyRequest()
                if (!isAdded) return@launch

                if (response.isSuccessful) {
                    val body = response.body()
                    Log.d(TAG, "Poll response: $body")

                    val status = body?.get("status")?.asString ?: "NONE"

                    if (status != currentStatus) {
                        currentStatus = status
                        updateUI(status, body)
                    }

                    tvError.visibility = View.GONE

                } else {
                    Log.w(TAG, "Poll failed: ${response.code()} ${response.errorBody()?.string()}")
                }
            } catch (e: IOException) {
                if (isAdded) {
                    tvError.text = "Retrying..."
                    tvError.visibility = View.VISIBLE
                }
            } catch (e: Exception) {
                Log.e(TAG, "Poll error: ${e.message}")
            }
        }
    }

    private fun updateUI(status: String, data: JsonObject?) {
        if (!isAdded) return

        when (status) {
            "PENDING" -> {
                val adminName = data?.get("requestedByName")?.asString ?: "An administrator"
                tvAdminName.text = "$adminName is requesting to sync your visitor logs."
                tvRequestStatus.text = "Pending your response"
                tvRequestStatus.setTextColor(requireContext().getColor(R.color.warning))
                btnAccept.visibility  = View.VISIBLE
                btnDecline.visibility = View.VISIBLE
                btnAccept.isEnabled   = true
                btnDecline.isEnabled  = true
                btnAccept.text  = "Accept"
                btnDecline.text = "Decline"
                cardSyncRequest.visibility = View.VISIBLE
                layoutEmpty.visibility     = View.GONE
                (activity as? GuardDashboardActivity)?.showNotificationBadge()
            }
            "ACCEPTED" -> {
                val adminName = data?.get("requestedByName")?.asString ?: "Administrator"
                tvAdminName.text = "$adminName is now syncing your logs."
                tvRequestStatus.text = "✓ Accepted — Live sync active"
                tvRequestStatus.setTextColor(requireContext().getColor(R.color.success))
                btnAccept.visibility  = View.GONE
                btnDecline.visibility = View.GONE
                cardSyncRequest.visibility = View.VISIBLE
                layoutEmpty.visibility     = View.GONE
            }
            "DECLINED" -> {
                val adminName = data?.get("requestedByName")?.asString ?: "Administrator"
                tvAdminName.text = "You declined $adminName's sync request."
                tvRequestStatus.text = "✕ Declined"
                tvRequestStatus.setTextColor(requireContext().getColor(R.color.error))
                btnAccept.visibility  = View.GONE
                btnDecline.visibility = View.GONE
                cardSyncRequest.visibility = View.VISIBLE
                layoutEmpty.visibility     = View.GONE
            }
            else -> {
                cardSyncRequest.visibility = View.GONE
                layoutEmpty.visibility     = View.VISIBLE
                (activity as? GuardDashboardActivity)?.clearNotificationBadge()
            }
        }
    }

    private fun respondToSync(decision: String) {
        if (isResponding || !isAdded) return
        isResponding = true
        stopPolling()

        btnAccept.isEnabled  = false
        btnDecline.isEnabled = false
        if (decision == "ACCEPTED") {
            btnAccept.text = "Processing..."
        } else {
            btnDecline.text = "Processing..."
        }

        lifecycleScope.launch {
            try {
                Log.d(TAG, "Sending respond: $decision")

                val response = RetrofitClient.instance.respondToSync(
                    SyncRespondRequest(decision = decision)
                )

                Log.d(TAG, "Respond result: ${response.code()} body=${response.body()}")

                if (!isAdded) return@launch

                if (response.isSuccessful) {
                    currentStatus = decision

                    val adminName = tvAdminName.text.toString()
                        .replace(" is requesting to sync your visitor logs.", "")
                        .replace(" is now syncing your logs.", "")
                        .trim()

                    val fakeData = JsonObject().apply {
                        addProperty("status", decision)
                        addProperty("requestedByName", adminName)
                    }

                    updateUI(decision, fakeData)

                    val msg = if (decision == "ACCEPTED") "✓ Sync accepted!" else "Sync declined."
                    Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show()

                    if (decision == "ACCEPTED") {
                        (activity as? GuardDashboardActivity)?.clearNotificationBadge()
                    }
                } else {
                    val errBody = response.errorBody()?.string()
                    Log.e(TAG, "Respond failed: ${response.code()} $errBody")
                    Toast.makeText(
                        requireContext(),
                        "Failed to respond (${response.code()}). Try again.",
                        Toast.LENGTH_SHORT
                    ).show()
                    resetButtons()
                }
            } catch (e: IOException) {
                if (isAdded) {
                    Toast.makeText(requireContext(), "Network error. Check connection.", Toast.LENGTH_SHORT).show()
                    resetButtons()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Respond exception: ${e.message}")
                if (isAdded) {
                    Toast.makeText(requireContext(), "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                    resetButtons()
                }
            } finally {
                isResponding = false
                if (isAdded) {
                    pollHandler = Handler(Looper.getMainLooper())
                    pollHandler?.postDelayed(pollRunnable, POLL_INTERVAL_MS)
                }
            }
        }
    }

    private fun resetButtons() {
        btnAccept.isEnabled  = true
        btnDecline.isEnabled = true
        btnAccept.text  = "Accept"
        btnDecline.text = "Decline"
    }
}