package com.example.logpoint.activities

import android.app.AlertDialog
import android.app.DatePickerDialog
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.logpoint.R
import com.example.logpoint.adapters.VisitLogAdapter
import com.example.logpoint.models.UpdateVisitLogRequest
import com.example.logpoint.models.VisitLogResponse
import com.example.logpoint.network.RetrofitClient
import kotlinx.coroutines.launch
import java.io.IOException
import java.text.SimpleDateFormat
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.*

class VisitorLogFragment : Fragment() {

    private lateinit var recyclerVisitLogs: RecyclerView
    private lateinit var progressBar: ProgressBar
    private lateinit var layoutEmpty: LinearLayout
    private lateinit var tvEmptySubtitle: TextView
    private lateinit var etSearch: EditText
    private lateinit var spinnerStatus: Spinner
    private lateinit var tvTotalCount: TextView
    private lateinit var tvActiveCount: TextView
    private lateinit var tvCompletedCount: TextView
    private lateinit var tvCurrentDate: TextView
    private lateinit var btnDateFilter: LinearLayout
    private lateinit var tvDateFilter: TextView
    private lateinit var tvClearDate: TextView

    private var fullList: List<VisitLogResponse> = emptyList()
    private var currentSearch = ""
    private var currentStatus = "ALL"
    private var currentDateFilter = "" // "yyyy-MM-dd" or ""

    private val statusOptions = listOf("All Status", "Active", "Completed")
    private val statusValues  = listOf("ALL", "ACTIVE", "COMPLETED")

    private lateinit var adapter: VisitLogAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?
    ): View = inflater.inflate(R.layout.fragment_visitor_log, container, false)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        recyclerVisitLogs = view.findViewById(R.id.recyclerVisitLogs)
        progressBar       = view.findViewById(R.id.progressBar)
        layoutEmpty       = view.findViewById(R.id.layoutEmpty)
        tvEmptySubtitle   = view.findViewById(R.id.tvEmptySubtitle)
        etSearch          = view.findViewById(R.id.etSearch)
        spinnerStatus     = view.findViewById(R.id.spinnerStatus)
        tvTotalCount      = view.findViewById(R.id.tvTotalCount)
        tvActiveCount     = view.findViewById(R.id.tvActiveCount)
        tvCompletedCount  = view.findViewById(R.id.tvCompletedCount)
        tvCurrentDate     = view.findViewById(R.id.tvCurrentDate)
        btnDateFilter     = view.findViewById(R.id.btnDateFilter)
        tvDateFilter      = view.findViewById(R.id.tvDateFilter)
        tvClearDate       = view.findViewById(R.id.tvClearDate)

        adapter = VisitLogAdapter(
            onCheckOut = { log -> showCheckOutDialog(log) },
            onEdit     = { log -> showEditDialog(log) },
            onDelete   = { log -> showDeleteDialog(log) }
        )

        recyclerVisitLogs.layoutManager = LinearLayoutManager(requireContext())
        recyclerVisitLogs.adapter = adapter

        updateCurrentDate()
        setupStatusSpinner()
        setupSearch()
        setupDateFilter()
        loadVisitLogs()
    }

    override fun onResume() {
        super.onResume()
        loadVisitLogs()
    }

    private fun updateCurrentDate() {
        val philippine = TimeZone.getTimeZone("Asia/Manila")
        val fmt = SimpleDateFormat("MMMM dd, yyyy", Locale.ENGLISH)
        fmt.timeZone = philippine
        tvCurrentDate.text = fmt.format(Date())
    }

    private fun setupStatusSpinner() {
        val spinnerAdapter = ArrayAdapter(
            requireContext(), android.R.layout.simple_spinner_item, statusOptions
        )
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerStatus.adapter = spinnerAdapter

        spinnerStatus.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View?, pos: Int, id: Long) {
                currentStatus = statusValues[pos]
                applyFilters()
            }
            override fun onNothingSelected(parent: AdapterView<*>) {}
        }
    }

    private fun setupSearch() {
        etSearch.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                currentSearch = s.toString()
                applyFilters()
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })
    }

    private fun setupDateFilter() {
        btnDateFilter.setOnClickListener {
            val cal = Calendar.getInstance(TimeZone.getTimeZone("Asia/Manila"))
            DatePickerDialog(
                requireContext(),
                { _, year, month, day ->
                    val selected = String.format("%04d-%02d-%02d", year, month + 1, day)
                    currentDateFilter = selected
                    val display = SimpleDateFormat("MMM dd, yyyy", Locale.ENGLISH).format(
                        SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH).parse(selected)!!
                    )
                    tvDateFilter.text = display
                    tvDateFilter.setTextColor(resources.getColor(R.color.primary_dark, null))
                    tvClearDate.visibility = View.VISIBLE
                    applyFilters()
                },
                cal.get(Calendar.YEAR),
                cal.get(Calendar.MONTH),
                cal.get(Calendar.DAY_OF_MONTH)
            ).show()
        }

        tvClearDate.setOnClickListener {
            currentDateFilter = ""
            tvDateFilter.text = "All Dates"
            tvDateFilter.setTextColor(resources.getColor(R.color.text_light, null))
            tvClearDate.visibility = View.GONE
            applyFilters()
        }
    }

    private fun applyFilters() {
        adapter.filter(currentSearch, currentStatus, currentDateFilter, fullList)
        val hasResults = adapter.itemCount > 0
        layoutEmpty.visibility       = if (hasResults) View.GONE else View.VISIBLE
        recyclerVisitLogs.visibility = if (hasResults) View.VISIBLE else View.GONE

        if (!hasResults) {
            tvEmptySubtitle.text = if (currentSearch.isNotBlank() || currentStatus != "ALL" || currentDateFilter.isNotBlank())
                "Try adjusting your search or filter"
            else
                "Visit logs will appear here once visitors check in."
        }
    }

    private fun loadVisitLogs() {
        progressBar.visibility       = View.VISIBLE
        layoutEmpty.visibility       = View.GONE
        recyclerVisitLogs.visibility = View.GONE

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.getVisitLogs()
                if (response.isSuccessful) {
                    val list = response.body() ?: emptyList()
                    fullList = list.sortedByDescending { it.timeIn }

                    tvTotalCount.text     = fullList.size.toString()
                    tvActiveCount.text    = fullList.count { it.status == "ACTIVE" }.toString()
                    tvCompletedCount.text = fullList.count { it.status == "COMPLETED" }.toString()

                    applyFilters()
                } else {
                    showEmpty("Failed to load records.")
                }
            } catch (e: IOException) {
                showEmpty("Network error. Check your connection.")
            } catch (e: Exception) {
                showEmpty("Error: ${e.message}")
            } finally {
                progressBar.visibility = View.GONE
            }
        }
    }

    private fun showEmpty(message: String) {
        layoutEmpty.visibility       = View.VISIBLE
        recyclerVisitLogs.visibility = View.GONE
        tvEmptySubtitle.text         = message
    }

    // ── Check Out ──
    private fun showCheckOutDialog(log: VisitLogResponse) {
        AlertDialog.Builder(requireContext())
            .setTitle("Check Out Visitor")
            .setMessage("Check out ${log.visitorName}?\n\nThis will mark their visit as completed.")
            .setPositiveButton("Yes, Check Out") { _, _ -> performCheckOut(log) }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun performCheckOut(log: VisitLogResponse) {
        val id = log.id ?: return
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.checkOut(id)
                if (response.isSuccessful) {
                    Toast.makeText(requireContext(), "✓ ${log.visitorName} checked out!", Toast.LENGTH_SHORT).show()
                    loadVisitLogs()
                } else {
                    Toast.makeText(requireContext(), "Failed to check out. Try again.", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Network error.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // ── Delete ──
    private fun showDeleteDialog(log: VisitLogResponse) {
        AlertDialog.Builder(requireContext())
            .setTitle("Delete Record")
            .setMessage("Delete the record for ${log.visitorName}?\n\nThis action cannot be undone.")
            .setPositiveButton("Yes, Delete") { _, _ -> performDelete(log) }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun performDelete(log: VisitLogResponse) {
        val id = log.id ?: return
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.deleteVisitLog(id)
                if (response.isSuccessful) {
                    Toast.makeText(requireContext(), "✓ Record deleted.", Toast.LENGTH_SHORT).show()
                    loadVisitLogs()
                } else {
                    Toast.makeText(requireContext(), "Failed to delete. Try again.", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Network error.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // ── Edit ──
    private fun showEditDialog(log: VisitLogResponse) {
        val dialogView = LayoutInflater.from(requireContext())
            .inflate(R.layout.dialog_edit_visitor, null)

        val tvEditError        = dialogView.findViewById<TextView>(R.id.tvEditError)
        val etVisitorName      = dialogView.findViewById<EditText>(R.id.etEditVisitorName)
        val spinnerPurpose     = dialogView.findViewById<Spinner>(R.id.spinnerEditPurpose)
        val layoutOtherPurpose = dialogView.findViewById<LinearLayout>(R.id.layoutEditOtherPurpose)
        val etOtherPurpose     = dialogView.findViewById<EditText>(R.id.etEditOtherPurpose)
        val etHost             = dialogView.findViewById<EditText>(R.id.etEditHost)
        val etContact          = dialogView.findViewById<EditText>(R.id.etEditContact)

        val purposes = listOf("Meeting", "Interview", "Delivery", "Vendor Visit", "Maintenance", "Other")
        val purpAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, purposes)
        purpAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerPurpose.adapter = purpAdapter

        // Pre-fill current values
        etVisitorName.setText(log.visitorName ?: "")
        etHost.setText(log.hostName ?: "")
        etContact.setText(log.contactNo ?: "")

        val currentPurpose = log.purposeName ?: ""
        val purpIdx = purposes.indexOfFirst { it.equals(currentPurpose, ignoreCase = true) }
        if (purpIdx >= 0) {
            spinnerPurpose.setSelection(purpIdx)
        } else {
            // Custom purpose — select "Other" and fill the field
            spinnerPurpose.setSelection(purposes.indexOf("Other"))
            layoutOtherPurpose.visibility = View.VISIBLE
            etOtherPurpose.setText(currentPurpose)
        }

        spinnerPurpose.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View?, pos: Int, id: Long) {
                layoutOtherPurpose.visibility =
                    if (purposes[pos] == "Other") View.VISIBLE else View.GONE
            }
            override fun onNothingSelected(parent: AdapterView<*>) {}
        }

        // Restrict contact to digits only, max 11
        etContact.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                val digits = s.toString().replace(Regex("[^0-9]"), "")
                if (digits != s.toString()) {
                    etContact.setText(digits)
                    etContact.setSelection(digits.length)
                }
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })

        val dialog = AlertDialog.Builder(requireContext())
            .setTitle("Edit Visitor  •  #${log.id}")
            .setView(dialogView)
            .setPositiveButton("Save Changes", null)
            .setNegativeButton("Cancel", null)
            .create()

        dialog.setOnShowListener {
            val saveBtn = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            saveBtn.setOnClickListener {
                val name    = etVisitorName.text.toString().trim()
                val purpIdx = spinnerPurpose.selectedItemPosition
                val other   = etOtherPurpose.text.toString().trim()
                val host    = etHost.text.toString().trim()
                val contact = etContact.text.toString().trim()

                // Validate
                if (name.isEmpty()) {
                    tvEditError.text = "Visitor name is required"
                    tvEditError.visibility = View.VISIBLE
                    return@setOnClickListener
                }
                if (purposes[purpIdx] == "Other" && other.isEmpty()) {
                    tvEditError.text = "Please specify the purpose"
                    tvEditError.visibility = View.VISIBLE
                    return@setOnClickListener
                }
                if (host.isEmpty()) {
                    tvEditError.text = "Host name is required"
                    tvEditError.visibility = View.VISIBLE
                    return@setOnClickListener
                }
                if (contact.length != 11) {
                    tvEditError.text = "Contact number must be exactly 11 digits"
                    tvEditError.visibility = View.VISIBLE
                    return@setOnClickListener
                }

                tvEditError.visibility = View.GONE
                val purpose = if (purposes[purpIdx] == "Other") other else purposes[purpIdx]

                saveBtn.isEnabled = false
                saveBtn.text = "Saving..."

                lifecycleScope.launch {
                    try {
                        val response = RetrofitClient.instance.updateVisitLog(
                            log.id!!,
                            UpdateVisitLogRequest(
                                visitorName = name,
                                purpose     = purpose,
                                host        = host,
                                contactNo   = contact
                            )
                        )
                        if (response.isSuccessful) {
                            dialog.dismiss()
                            Toast.makeText(
                                requireContext(),
                                "✓ Visitor updated successfully!",
                                Toast.LENGTH_SHORT
                            ).show()
                            loadVisitLogs()
                        } else {
                            val errBody = response.errorBody()?.string()
                            tvEditError.text = errBody?.ifEmpty { "Failed to update. Try again." }
                                ?: "Failed to update. Try again."
                            tvEditError.visibility = View.VISIBLE
                            saveBtn.isEnabled = true
                            saveBtn.text = "Save Changes"
                        }
                    } catch (e: IOException) {
                        tvEditError.text = "Network error. Check your connection."
                        tvEditError.visibility = View.VISIBLE
                        saveBtn.isEnabled = true
                        saveBtn.text = "Save Changes"
                    } catch (e: Exception) {
                        tvEditError.text = "Error: ${e.message}"
                        tvEditError.visibility = View.VISIBLE
                        saveBtn.isEnabled = true
                        saveBtn.text = "Save Changes"
                    }
                }
            }
        }

        dialog.show()
    }
}