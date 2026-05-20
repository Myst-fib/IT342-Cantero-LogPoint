package com.example.logpoint.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.logpoint.R
import com.example.logpoint.models.GuardResponse
import com.google.android.material.button.MaterialButton

class GuardAdapter(
    private var guards: MutableList<GuardResponse> = mutableListOf(),
    private val onSync: (GuardResponse) -> Unit,
    private val onCancel: (GuardResponse) -> Unit
) : RecyclerView.Adapter<GuardAdapter.ViewHolder>() {

    // Track which guard is currently synced/pending
    var syncedGuardId: Long? = null
    var pendingGuardId: Long? = null

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvInitial: TextView       = view.findViewById(R.id.tvGuardInitial)
        val tvName: TextView          = view.findViewById(R.id.tvGuardName)
        val tvEmail: TextView         = view.findViewById(R.id.tvGuardEmail)
        val tvStatusChip: TextView    = view.findViewById(R.id.tvGuardStatusChip)
        val btnSync: MaterialButton   = view.findViewById(R.id.btnSyncThis)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_guard, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val guard = guards[position]
        val ctx = holder.itemView.context
        val name = "${guard.firstName ?: ""} ${guard.lastName ?: ""}".trim()

        holder.tvInitial.text = guard.firstName?.firstOrNull()?.uppercaseChar()?.toString() ?: "G"
        holder.tvName.text    = name
        holder.tvEmail.text   = guard.email ?: ""

        val isSynced  = guard.id == syncedGuardId
        val isPending = guard.id == pendingGuardId
        val isBlocked = (syncedGuardId != null || pendingGuardId != null) && !isSynced && !isPending

        when {
            isSynced -> {
                holder.tvStatusChip.text = "● Live"
                holder.tvStatusChip.setTextColor(ctx.getColor(R.color.success))
                holder.tvStatusChip.setBackgroundResource(R.drawable.status_active_bg)
                holder.tvStatusChip.visibility = View.VISIBLE
                holder.btnSync.text = "Cancel"
                holder.btnSync.setTextColor(ctx.getColor(R.color.error))
                holder.btnSync.backgroundTintList =
                    android.content.res.ColorStateList.valueOf(ctx.getColor(android.R.color.white))
                holder.btnSync.strokeColor =
                    android.content.res.ColorStateList.valueOf(ctx.getColor(R.color.error))
                holder.btnSync.isEnabled = true
                holder.btnSync.alpha = 1f
                holder.btnSync.setOnClickListener { onCancel(guard) }
            }
            isPending -> {
                holder.tvStatusChip.text = "⏳ Waiting"
                holder.tvStatusChip.setTextColor(0xFFb08200.toInt())
                holder.tvStatusChip.setBackgroundResource(R.drawable.date_badge_bg)
                holder.tvStatusChip.visibility = View.VISIBLE
                holder.btnSync.text = "Waiting..."
                holder.btnSync.isEnabled = false
                holder.btnSync.alpha = 0.6f
                holder.btnSync.setOnClickListener(null)
            }
            isBlocked -> {
                holder.tvStatusChip.visibility = View.GONE
                holder.btnSync.text = "Sync"
                holder.btnSync.isEnabled = false
                holder.btnSync.alpha = 0.35f
                holder.btnSync.setOnClickListener(null)
            }
            else -> {
                holder.tvStatusChip.visibility = View.GONE
                holder.btnSync.text = "Sync"
                holder.btnSync.setTextColor(ctx.getColor(android.R.color.white))
                holder.btnSync.setBackgroundResource(R.drawable.gradient_button)
                holder.btnSync.isEnabled = true
                holder.btnSync.alpha = 1f
                holder.btnSync.setOnClickListener { onSync(guard) }
            }
        }
    }

    override fun getItemCount() = guards.size

    fun updateList(newList: List<GuardResponse>) {
        guards.clear()
        guards.addAll(newList)
        notifyDataSetChanged()
    }

    fun filter(query: String, fullList: List<GuardResponse>) {
        val filtered = if (query.isBlank()) fullList
        else fullList.filter { g ->
            "${g.firstName} ${g.lastName}".contains(query, ignoreCase = true) ||
                    g.email?.contains(query, ignoreCase = true) == true
        }
        updateList(filtered)
    }
}