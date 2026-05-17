package com.example.logpoint.activities

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.logpoint.R
import com.example.logpoint.models.VisitorRequest
import com.example.logpoint.network.RetrofitClient
import com.google.android.material.button.MaterialButton
import kotlinx.coroutines.launch
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

class AddVisitorFragment : Fragment() {

    private lateinit var tvCurrentDate: TextView
    private lateinit var tvTimeIn: TextView
    private lateinit var etVisitorName: EditText
    private lateinit var spinnerPurpose: Spinner
    private lateinit var layoutOtherPurpose: LinearLayout
    private lateinit var etOtherPurpose: EditText
    private lateinit var etHost: EditText
    private lateinit var etContactNumber: EditText
    private lateinit var btnCancel: MaterialButton
    private lateinit var btnSave: MaterialButton
    private lateinit var progressBar: ProgressBar
    private lateinit var tvError: TextView

    private val purposeOptions = listOf(
        "Select purpose",
        "Meeting",
        "Interview",
        "Delivery",
        "Vendor Visit",
        "Maintenance",
        "Other"
    )

    private val timeHandler = Handler(Looper.getMainLooper())
    private val timeRunnable = object : Runnable {
        override fun run() {
            updateDateTime()
            timeHandler.postDelayed(this, 60_000)
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return inflater.inflate(R.layout.fragment_add_visitor, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        initViews(view)
        setupPurposeSpinner()
        updateDateTime()
        timeHandler.postDelayed(timeRunnable, 60_000)

        btnCancel.setOnClickListener { clearForm() }
        btnSave.setOnClickListener { submitForm() }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        timeHandler.removeCallbacks(timeRunnable)
    }

    private fun initViews(view: View) {
        tvCurrentDate     = view.findViewById(R.id.tvCurrentDate)
        tvTimeIn          = view.findViewById(R.id.tvTimeIn)
        etVisitorName     = view.findViewById(R.id.etVisitorName)
        spinnerPurpose    = view.findViewById(R.id.spinnerPurpose)
        layoutOtherPurpose = view.findViewById(R.id.layoutOtherPurpose)
        etOtherPurpose    = view.findViewById(R.id.etOtherPurpose)
        etHost            = view.findViewById(R.id.etHost)
        etContactNumber   = view.findViewById(R.id.etContactNumber)
        btnCancel         = view.findViewById(R.id.btnCancel)
        btnSave           = view.findViewById(R.id.btnSave)
        progressBar       = view.findViewById(R.id.progressBar)
        tvError           = view.findViewById(R.id.tvError)
    }

    private fun setupPurposeSpinner() {
        val adapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_item,
            purposeOptions
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerPurpose.adapter = adapter

        spinnerPurpose.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View?, pos: Int, id: Long) {
                layoutOtherPurpose.visibility =
                    if (purposeOptions[pos] == "Other") View.VISIBLE else View.GONE
            }
            override fun onNothingSelected(parent: AdapterView<*>) {}
        }
    }

    private fun updateDateTime() {
        val philippineZone = TimeZone.getTimeZone("Asia/Manila")

        val dateFormat = SimpleDateFormat("MMMM dd, yyyy", Locale.ENGLISH)
        dateFormat.timeZone = philippineZone

        val timeFormat = SimpleDateFormat("HH:mm", Locale.ENGLISH)
        timeFormat.timeZone = philippineZone

        val now = Date()
        tvCurrentDate.text = dateFormat.format(now)
        tvTimeIn.text = timeFormat.format(now)
    }

    private fun submitForm() {
        val visitorName   = etVisitorName.text.toString().trim()
        val purposeIndex  = spinnerPurpose.selectedItemPosition
        val otherPurpose  = etOtherPurpose.text.toString().trim()
        val host          = etHost.text.toString().trim()
        val contactNumber = etContactNumber.text.toString().trim()

        // Validation
        if (visitorName.isEmpty()) {
            showError("Please enter visitor name")
            return
        }
        if (purposeIndex == 0) {
            showError("Please select a purpose of visit")
            return
        }
        if (purposeOptions[purposeIndex] == "Other" && otherPurpose.isEmpty()) {
            showError("Please specify the purpose of visit")
            return
        }
        if (host.isEmpty()) {
            showError("Please enter the host name")
            return
        }
        if (contactNumber.isEmpty()) {
            showError("Please enter a contact number")
            return
        }
        if (!contactNumber.matches(Regex("^\\d{11}$"))) {
            showError("Contact number must be exactly 11 digits")
            return
        }

        tvError.visibility = View.GONE

        val purpose = if (purposeOptions[purposeIndex] == "Other") otherPurpose
        else purposeOptions[purposeIndex]

        val request = VisitorRequest(
            visitorName   = visitorName,
            contactNo     = contactNumber,
            host          = host,
            purpose       = purpose
        )

        showLoading(true)

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.createVisitor(request)

                if (response.isSuccessful) {
                    showBanner("✓ Visitor checked in successfully!", isSuccess = true)
                    clearForm()
                } else {
                    val errorMsg = response.errorBody()?.string() ?: "Failed to add visitor"
                    showError(errorMsg)
                }
            } catch (e: IOException) {
                showError("Network error. Check your connection.")
            } catch (e: Exception) {
                showError("Error: ${e.message}")
            } finally {
                showLoading(false)
            }
        }
    }

    private fun clearForm() {
        etVisitorName.text.clear()
        spinnerPurpose.setSelection(0)
        etOtherPurpose.text.clear()
        etHost.text.clear()
        etContactNumber.text.clear()
        layoutOtherPurpose.visibility = View.GONE
        tvError.visibility = View.GONE
    }

    private fun showLoading(isLoading: Boolean) {
        progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        btnSave.isEnabled = !isLoading
        btnSave.text = if (isLoading) "Saving..." else "Save Entry"
    }

    private fun showError(message: String) {
        tvError.text = "✗  $message"
        tvError.visibility = View.VISIBLE
    }

    private fun showBanner(message: String, isSuccess: Boolean) {
        Toast.makeText(requireContext(), message, Toast.LENGTH_LONG).show()
    }
}