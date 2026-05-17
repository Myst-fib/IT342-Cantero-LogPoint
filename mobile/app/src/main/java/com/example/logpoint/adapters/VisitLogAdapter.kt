package com.example.logpoint.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.logpoint.R
import com.example.logpoint.models.VisitLogResponse
import com.google.android.material.button.MaterialButton
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class VisitLogAdapter(
    private var logs: MutableList<VisitLogResponse> = mutableListOf(),
    private val onCheckOut: (VisitLogResponse) -> Unit,
    private val onEdit: (VisitLogResponse) -> Unit,
    private val onDelete: (VisitLogResponse) -> Unit
) : RecyclerView.Adapter<VisitLogAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvInitial: TextView         = view.findViewById(R.id.tvInitial)
        val tvVisitorName: TextView     = view.findViewById(R.id.tvVisitorName)
        val tvPurpose: TextView         = view.findViewById(R.id.tvPurpose)
        val tvStatus: TextView          = view.findViewById(R.id.tvStatus)
        val tvHost: TextView            = view.findViewById(R.id.tvHost)
        val tvContact: TextView         = view.findViewById(R.id.tvContact)
        val tvTimeIn: TextView          = view.findViewById(R.id.tvTimeIn)
        val tvTimeOut: TextView         = view.findViewById(R.id.tvTimeOut)
        val layoutTimeOut: LinearLayout = view.findViewById(R.id.layoutTimeOut)
        val spacerActive: View          = view.findViewById(R.id.spacerActive)
        val btnCheckOut: MaterialButton = view.findViewById(R.id.btnCheckOut)
        val btnEdit: ImageButton        = view.findViewById(R.id.btnEdit)
        val btnDelete: ImageButton      = view.findViewById(R.id.btnDelete)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_visit_log, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val log = logs[position]
        val ctx = holder.itemView.context
        val name = log.visitorName ?: "Unknown"
        val isActive = log.status == "ACTIVE"

        holder.tvInitial.text     = name.firstOrNull()?.uppercaseChar()?.toString() ?: "V"
        holder.tvVisitorName.text = name
        holder.tvPurpose.text     = log.purposeName ?: "—"
        holder.tvHost.text        = log.hostName ?: "—"
        holder.tvContact.text     = log.contactNo ?: "—"
        holder.tvTimeIn.text      = formatTime(log.timeIn)

        // Status styling
        if (isActive) {
            holder.tvStatus.text = "● Active"
            holder.tvStatus.setTextColor(ctx.getColor(R.color.success))
            holder.tvStatus.setBackgroundResource(R.drawable.status_active_bg)
        } else {
            holder.tvStatus.text = "✓ Completed"
            holder.tvStatus.setTextColor(0xFF1565C0.toInt())
            holder.tvStatus.setBackgroundResource(R.drawable.status_completed_bg)
        }

        if (isActive) {
            holder.btnCheckOut.visibility   = View.VISIBLE
            holder.btnEdit.visibility       = View.VISIBLE
            holder.btnDelete.visibility     = View.VISIBLE
            holder.layoutTimeOut.visibility = View.GONE
            holder.spacerActive.visibility  = View.VISIBLE

            // Tint edit icon blue, delete icon red
            holder.btnEdit.setColorFilter(ctx.getColor(R.color.primary_dark))
            holder.btnDelete.setColorFilter(ctx.getColor(R.color.error))

            holder.btnCheckOut.setOnClickListener { onCheckOut(log) }
            holder.btnEdit.setOnClickListener     { onEdit(log) }
            holder.btnDelete.setOnClickListener   { onDelete(log) }
        } else {
            holder.btnCheckOut.visibility  = View.GONE
            holder.btnEdit.visibility      = View.GONE
            holder.btnDelete.visibility    = View.GONE
            holder.spacerActive.visibility = View.GONE

            if (!log.timeOut.isNullOrEmpty()) {
                holder.layoutTimeOut.visibility = View.VISIBLE
                holder.tvTimeOut.text = formatTime(log.timeOut)
            } else {
                holder.layoutTimeOut.visibility = View.GONE
            }
        }
    }

    override fun getItemCount() = logs.size

    fun updateList(newList: List<VisitLogResponse>) {
        logs.clear()
        logs.addAll(newList)
        notifyDataSetChanged()
    }

    fun filter(query: String, statusFilter: String, dateFilter: String, fullList: List<VisitLogResponse>) {
        var result = fullList

        if (statusFilter != "ALL") {
            result = result.filter { it.status == statusFilter }
        }
        if (query.isNotBlank()) {
            result = result.filter { log ->
                log.visitorName?.contains(query, ignoreCase = true) == true ||
                        log.purposeName?.contains(query, ignoreCase = true) == true ||
                        log.hostName?.contains(query, ignoreCase = true) == true ||
                        log.contactNo?.contains(query, ignoreCase = true) == true
            }
        }
        if (dateFilter.isNotBlank()) {
            result = result.filter { log -> log.timeIn?.take(10) == dateFilter }
        }

        updateList(result)
    }

    private fun formatTime(raw: String?): String {
        if (raw.isNullOrEmpty()) return "—"
        return try {
            val dt = LocalDateTime.parse(raw.take(19))
            val ph = dt.atZone(ZoneId.of("Asia/Manila"))
            ph.format(DateTimeFormatter.ofPattern("hh:mm a"))
        } catch (e: Exception) {
            raw.take(5)
        }
    }
}