package com.example.logpoint.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.logpoint.R
import com.example.logpoint.models.VisitLogResponse

class SyncedLogAdapter(private val logs: List<VisitLogResponse>) :
    RecyclerView.Adapter<SyncedLogAdapter.VH>() {

    inner class VH(view: View) : RecyclerView.ViewHolder(view) {
        val tvName:    TextView = view.findViewById(R.id.tvSyncedLogName)
        val tvPurpose: TextView = view.findViewById(R.id.tvSyncedLogPurpose)
        val tvStatus:  TextView = view.findViewById(R.id.tvSyncedLogStatus)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        VH(LayoutInflater.from(parent.context).inflate(R.layout.item_synced_log_row, parent, false))

    override fun getItemCount() = logs.size

    override fun onBindViewHolder(holder: VH, position: Int) {
        val log = logs[position]
        holder.tvName.text    = log.visitorName ?: "—"
        holder.tvPurpose.text = log.purposeName ?: "—"
        holder.tvStatus.text  = log.status      ?: "—"

        when (log.status) {
            "ACTIVE"    -> {
                holder.tvStatus.setBackgroundResource(R.drawable.status_active_bg)
                holder.tvStatus.setTextColor(Color.parseColor("#1D9E75"))
            }
            "COMPLETED" -> {
                holder.tvStatus.setBackgroundResource(R.drawable.status_completed_bg)
                holder.tvStatus.setTextColor(Color.parseColor("#004AAD"))
            }
            else -> {
                holder.tvStatus.setBackgroundResource(0)
                holder.tvStatus.setTextColor(Color.parseColor("#999999"))
            }
        }
    }
}