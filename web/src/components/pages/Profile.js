// Profile.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Added for navigation
import '../../styles/Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/api/user/me", {
      method: "GET",
      credentials: "include", //VERY IMPORTANT (session)
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-error">
        <p>Please login first.</p>
        <Link to="/login" className="btn btn-primary">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">

      <div className="profile-container">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <div className="page-title">My Profile</div>
            <div className="page-subtitle">Manage your personal information</div>
          </div>
          <button className="btn-edit-profile">
            <span style={{ fontSize: 16, marginRight: 4 }}>✎</span> Edit Profile
          </button>
        </div>

        <div className="profile-content">
          {/* Profile Card */}
          <div className="profile-card">
            <div className="avatar-large">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
              ) : (
                <div className="avatar-fallback-large">
                  {user.firstName.charAt(0)}
                </div>
              )}
            </div>

            <div className="profile-info">
              <h2 className="profile-name">
                {user.firstName} {user.lastName}
              </h2>
              <p className="profile-email">{user.email}</p>
              <span className="profile-badge">Security Guard</span>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">156</span>
                <span className="stat-label">Visits</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">12</span>
                <span className="stat-label">This Month</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">4.8</span>
                <span className="stat-label">Rating</span>
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="profile-details-grid">
            {/* Account Information */}
            <section className="detail-card">
              <div className="card-header">
                <h3 className="card-title">Account Information</h3>
                <button className="btn-icon">✎</button>
              </div>
              <div className="detail-content">
                <div className="detail-row">
                  <span className="detail-label">First Name</span>
                  <span className="detail-value">{user.firstName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Last Name</span>
                  <span className="detail-value">{user.lastName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{user.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Member Since</span>
                  <span className="detail-value">January 2025</span>
                </div>
              </div>
            </section>

            {/* Security Settings */}
            <section className="detail-card">
              <div className="card-header">
                <h3 className="card-title">Security</h3>
                <button className="btn-icon">⚙️</button>
              </div>
              <div className="detail-content">
                <div className="detail-row">
                  <span className="detail-label">Password</span>
                  <span className="detail-value">••••••••</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">2FA Status</span>
                  <span className="detail-value">
                    <span className="badge badge-success">Enabled</span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Last Login</span>
                  <span className="detail-value">Today, 09:30 AM</span>
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="detail-card full-width">
              <div className="card-header">
                <h3 className="card-title">Recent Activity</h3>
                <Link to="/records" className="btn-sm btn-outline">View All</Link>
              </div>
              <div className="activity-list">
                <div className="activity-item">
                  <span className="activity-time">10:30 AM</span>
                  <span className="activity-desc">Checked in visitor John Smith</span>
                  <span className="badge badge-success">Completed</span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">09:45 AM</span>
                  <span className="activity-desc">Processed delivery package</span>
                  <span className="badge badge-info">In Progress</span>
                </div>
                <div className="activity-item">
                  <span className="activity-time">Yesterday</span>
                  <span className="activity-desc">Updated visitor records</span>
                  <span className="badge badge-warning">Pending</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;