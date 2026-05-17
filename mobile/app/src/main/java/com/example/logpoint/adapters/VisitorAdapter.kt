package com.example.logpoint.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.logpoint.R
import com.example.logpoint.models.VisitorResponse

class VisitorAdapter(
    private var visitors: MutableList<VisitorResponse> = mutableListOf()
) : RecyclerView.Adapter<VisitorAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvInitial: TextView     = view.findViewById(R.id.tvInitial)
        val tvVisitorName: TextView = view.findViewById(R.id.tvVisitorName)
        val tvPurpose: TextView     = view.findViewById(R.id.tvPurpose)
        val tvHost: TextView        = view.findViewById(R.id.tvHost)
        val tvTimeIn: TextView      = view.findViewById(R.id.tvTimeIn)
        val tvContact: TextView     = view.findViewById(R.id.tvContact)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_visitor, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val visitor = visitors[position]

        val name = visitor.visitorName ?: "Unknown"
        holder.tvInitial.text     = name.firstOrNull()?.uppercaseChar()?.toString() ?: "V"
        holder.tvVisitorName.text = name
        holder.tvPurpose.text     = visitor.purpose ?: "—"
        holder.tvHost.text        = "Host: ${visitor.host ?: "—"}"
        holder.tvContact.text     = visitor.contactNo ?: "—"

        // Format time: "2026-05-16T23:22:00" → "23:22"
        val rawTime = visitor.createdAt ?: visitor.timeIn
        holder.tvTimeIn.text = if (!rawTime.isNullOrEmpty() && rawTime.contains("T")) {
            rawTime.substringAfter("T").take(5)
        } else {
            rawTime?.take(5) ?: "--:--"
        }
    }

    override fun getItemCount() = visitors.size

    fun updateList(newList: List<VisitorResponse>) {
        visitors.clear()
        visitors.addAll(newList)
        notifyDataSetChanged()
    }

    fun filter(query: String, fullList: List<VisitorResponse>) {
        val filtered = if (query.isBlank()) fullList
        else fullList.filter { v ->
            v.visitorName?.contains(query, ignoreCase = true) == true ||
                    v.purpose?.contains(query, ignoreCase = true) == true ||
                    v.host?.contains(query, ignoreCase = true) == true
        }
        updateList(filtered)
    }
}