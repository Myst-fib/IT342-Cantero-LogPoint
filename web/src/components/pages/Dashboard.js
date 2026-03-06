// Dashboard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Dashboard.css';

const Dashboard = () => {
  const [stats] = useState({
    daily: 24,
    total: 1567,
    activeNow: 8,
    completedToday: 16
  });

  const [recentActivities] = useState([
    { 
      name: 'John Smith', 
      purpose: 'Meeting', 
      time: '09:30 AM', 
      status: 'Active', 
      sub: 'Meeting with HR' 
    },
    { 
      name: 'Jane Doe', 
      purpose: 'Interview', 
      time: '10:15 AM', 
      status: 'Active', 
      sub: 'Interview — Engineering' 
    },
    { 
      name: 'Bob Wilson', 
      purpose: 'Delivery', 
      time: '08:45 AM', 
      status: 'Completed', 
      sub: 'Package delivery' 
    },
    { 
      name: 'Maria Santos', 
      purpose: 'Vendor Visit', 
      time: '11:00 AM', 
      status: 'Pending', 
      sub: 'Vendor — IT Dept.' 
    }
  ]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Active':
        return <span className="badge badge-success">Active</span>;
      case 'Completed':
        return <span className="badge badge-info">Completed</span>;
      case 'Pending':
        return <span className="badge badge-warning">Pending</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const formatDate = () => {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return today.toLocaleDateString('en-US', options);
  };

  return (
    <div className="dashboard-wrapper">

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <div className="page-title">Dashboard</div>
            <div className="page-subtitle">{formatDate()}</div>
          </div>
          <Link className="btn-add" to="/add-visitor">
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Visitor
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-label">Daily Visitors</div>
              <div className="stat-icon blue">👥</div>
            </div>
            <div className="stat-value">{stats.daily}</div>
            <div className="stat-change">↑ 12% from yesterday</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-label">Total Visitors</div>
              <div className="stat-icon purple">📊</div>
            </div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-change">↑ 8% this month</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-label">Active Now</div>
              <div className="stat-icon green">🟢</div>
            </div>
            <div className="stat-value">{stats.activeNow}</div>
            <div className="stat-change" style={{ color: 'var(--info)' }}>
              Currently on premises
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-label">Completed Today</div>
              <div className="stat-icon orange">✅</div>
            </div>
            <div className="stat-value">{stats.completedToday}</div>
            <div className="stat-change">Checked out successfully</div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
            <Link className="btn-sm btn-outline" to="/visitor-log">
              View All
            </Link>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Purpose</th>
                <th>Time In</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div className="visitor-name">{item.name}</div>
                    <div className="visitor-sub">{item.sub}</div>
                  </td>
                  <td>{item.purpose}</td>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 13 }}>
                    {item.time}
                  </td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>
                    <div className="action-btns">
                      {item.status === 'Completed' ? (
                        <button className="btn-sm btn-outline">View</button>
                      ) : (
                        <>
                          <button className="btn-sm btn-outline">Edit</button>
                          <button className="btn-sm btn-success-sm">Check Out</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Button */}
      <Link className="fab" to="/add-visitor">+</Link>
    </div>
  );
};

export default Dashboard;