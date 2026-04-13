import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../../styles/NavBar.css';
import logo from '../assets/logpoint_logo.png';

function NavBar() {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync notification state (security guard only)
  const [syncRequest, setSyncRequest] = useState(null); // null | { requestedByName, status }
  const [showSyncNotif, setShowSyncNotif] = useState(false);
  const [respondingSync, setRespondingSync] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setLoading(false);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        fetchUserData();
      }
    } else {
      fetchUserData();
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/user/me', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.log('Not authenticated');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Poll for sync requests — security guard only
  const pollSyncRequest = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8080/api/sync/my-request', {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === 'PENDING') {
        setSyncRequest(data);
        setShowSyncNotif(true);
      } else {
        // If no pending request, hide notification
        setSyncRequest(null);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    const isGuard = user?.role?.toLowerCase() === 'security guard';
    if (!isGuard) return;
    pollSyncRequest();
    const interval = setInterval(pollSyncRequest, 5000);
    return () => clearInterval(interval);
  }, [user, pollSyncRequest]);

  const handleSyncRespond = async (decision) => {
    setRespondingSync(true);
    try {
      await fetch('http://localhost:8080/api/sync/respond', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      setSyncRequest(null);
      setShowSyncNotif(false);
    } catch {
      // silent
    } finally {
      setRespondingSync(false);
    }
  };

  const isAdmin = user?.role?.toLowerCase() === 'office administrator';
  const isGuard = user?.role?.toLowerCase() === 'security guard';

  const requestLogout = () => setShowBanner(true);

  const confirmLogout = async () => {
    try {
      await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      setShowBanner(false);
      navigate('/login');
    }
  };

  const cancelLogout = () => setShowBanner(false);

  const goToDashboard = () => {
    if (isAdmin) navigate('/dashboard');
    else navigate('/add-visitor');
  };

  const goToProfile = () => navigate('/profile');

  if (loading) {
    return (
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={goToDashboard} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="LogPoint" className="logo-image" />
        </div>
        <nav className="nav-section">
          <div className="nav-label">Main</div>
          <NavLink to="/add-visitor" className="nav-item">Add Visitor</NavLink>
          <NavLink to="/records" className="nav-item">Visitor Log</NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">...</div>
            <div>Loading...</div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={goToDashboard} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="LogPoint" className="logo-image" />
        </div>

        <nav className="nav-section">
          <div className="nav-label">Main</div>

          {/* Dashboard — admin only */}
          {isAdmin && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              Dashboard
            </NavLink>
          )}

          {/* Visitor Log — all roles */}
          <NavLink
            to="/visitor-log"
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Visitor Log
          </NavLink>

          {/* Add Visitor — all roles */}
          <NavLink
            to="/add-visitor"
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Add Visitor
          </NavLink>

          <div className="nav-label" style={{ marginTop: '16px' }}>Account</div>

          {/* Sync Notification Bell — security guard only */}
          {isGuard && (
            <button
              className={`nav-item nav-item-btn ${showSyncNotif && syncRequest ? 'notif-active' : ''}`}
              onClick={() => setShowSyncNotif(true)}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              Notifications
              {syncRequest && <span className="notif-badge">1</span>}
            </button>
          )}

          {/* Profile — all roles */}
          <NavLink
            to="/profile"
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Profile
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip" onClick={goToProfile} style={{ cursor: 'pointer' }}>
            <div className="avatar">
              {user ? (user.firstName?.charAt(0)?.toUpperCase() || 'U') : 'U'}
            </div>
            <div>
              <div className="user-name">
                {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'User'}
              </div>
              <div className="user-role">
                {user?.role || 'Unknown'}
              </div>
            </div>
          </div>
          <button className="logout-btn" onClick={requestLogout}>Logout</button>
        </div>
      </aside>

      {showBanner && (
        <div className="logout-banner">
          <div className="logout-banner-inner">
            <p className="logout-message">Are you sure you want to logout?</p>
            <div className="logout-actions">
              <button className="btn-sm btn-outline" onClick={cancelLogout}>Cancel</button>
              <button className="btn-sm btn-primary" onClick={confirmLogout}>Yes, logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Request Notification — security guard only */}
      {isGuard && showSyncNotif && (
        <div className="sync-notif-overlay" onClick={(e) => e.target === e.currentTarget && setShowSyncNotif(false)}>
          <div className="sync-notif-modal">

            {/* X button — closes modal only, request stays pending */}
            <button
              className="sync-notif-dismiss"
              onClick={() => setShowSyncNotif(false)}
              title="Dismiss (request stays pending)"
            >
              ×
            </button>

            <div className="sync-notif-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sync-notif-bell">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>

            {syncRequest ? (
              <>
                <div className="sync-notif-title">Sync Request</div>
                <div className="sync-notif-body">
                  <strong>{syncRequest.requestedByName || 'An administrator'}</strong> is requesting to collect your visitor log data.
                </div>
                <div className="sync-notif-sub">
                  Do you want to share your logs with the admin?
                </div>
                <div className="sync-notif-actions">
                  <button
                    className="sync-notif-btn decline"
                    onClick={() => handleSyncRespond('DECLINED')}
                    disabled={respondingSync}
                  >
                    Decline
                  </button>
                  <button
                    className="sync-notif-btn accept"
                    onClick={() => handleSyncRespond('ACCEPTED')}
                    disabled={respondingSync}
                  >
                    {respondingSync ? 'Processing…' : 'Accept'}
                  </button>
                </div>
                <div className="sync-notif-dismiss-hint">
                  Closing this window will not dismiss the request.
                </div>
              </>
            ) : (
              <>
                <div className="sync-notif-title">Notifications</div>
                <div className="sync-notif-empty">No pending sync requests.</div>
                <div className="sync-notif-actions">
                  <button className="sync-notif-btn decline" onClick={() => setShowSyncNotif(false)}>Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default NavBar;