import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './NavBar.css';
import logo from '../features/visitors/assets/logpoint_logo.png';

const API = 'http://localhost:8080';

function NavBar() {
  const navigate = useNavigate();
  const [showBanner, setShowBanner]       = useState(false);
  const [user, setUser]                   = useState(null);
  const [loading, setLoading]             = useState(true);

  // Sync notification state (security guard only)
  const [syncHistory, setSyncHistory]     = useState([]);
  const [showSyncNotif, setShowSyncNotif] = useState(false);
  const [respondingSync, setRespondingSync] = useState(false);
  const [hasUnread, setHasUnread]         = useState(false);
  const [respondError, setRespondError]   = useState('');

  // ── Always fetch user from backend on mount to ensure session is alive ──
  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/user/me`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // Session expired — clear local storage and redirect to login
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        navigate('/login');
      }
    } catch (error) {
      console.error('[NavBar] Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // ── Poll for sync requests — security guard only ──────────────────────────
  const pollSyncRequest = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/sync/my-request`, {
        credentials: 'include',
      });

      // Session expired mid-session — re-fetch user to force login redirect
      if (res.status === 401) {
        fetchUserData();
        return;
      }

      if (!res.ok) return;
      const data = await res.json();

      if (data.status === 'PENDING') {
        setSyncHistory(prev => {
          const alreadyPending = prev.some(
            e => e.status === 'PENDING' && e.requestedByName === data.requestedByName
          );
          if (alreadyPending) return prev;

          setHasUnread(true);
          return [
            {
              id: Date.now(),
              requestedByName: data.requestedByName || 'An administrator',
              status: 'PENDING',
              timestamp: new Date(),
            },
            ...prev,
          ];
        });
      }
    } catch {
      // silent — network error, will retry on next interval
    }
  }, [fetchUserData]);

  useEffect(() => {
    const isGuard = user?.role?.toLowerCase() === 'security guard';
    if (!isGuard) return;
    pollSyncRequest();
    const interval = setInterval(pollSyncRequest, 5000);
    return () => clearInterval(interval);
  }, [user, pollSyncRequest]);

  // ── Respond to sync request ───────────────────────────────────────────────
  const handleSyncRespond = async (decision) => {
    setRespondingSync(true);
    setRespondError('');
    try {
      const res = await fetch(`${API}/api/sync/respond`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });

      if (res.status === 401) {
        setRespondError('Session expired. Please log in again.');
        fetchUserData(); // will redirect to login
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        setRespondError(`Failed to respond: ${text}`);
        return;
      }

      // Success — update the history entry
      setSyncHistory(prev =>
        prev.map(e =>
          e.status === 'PENDING'
            ? {
                ...e,
                status: decision === 'ACCEPTED' ? 'ACCEPTED' : 'DECLINED',
                respondedAt: new Date(),
              }
            : e
        )
      );
    } catch (err) {
      setRespondError(`Network error: ${err.message}`);
    } finally {
      setRespondingSync(false);
    }
  };

  const openNotifPanel = () => {
    setShowSyncNotif(true);
    setHasUnread(false);
    setRespondError('');
  };

  const isAdmin = user?.role?.toLowerCase() === 'office administrator';
  const isGuard = user?.role?.toLowerCase() === 'security guard';

  const requestLogout  = () => setShowBanner(true);
  const cancelLogout   = () => setShowBanner(false);

  const confirmLogout = async () => {
    try {
      await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      setShowBanner(false);
      navigate('/login');
    }
  };

  const goToDashboard = () => navigate(isAdmin ? '/dashboard' : '/add-visitor');
  const goToProfile   = () => navigate('/profile');

  if (loading) {
    return (
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={goToDashboard} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="LogPoint" className="logo-image" />
        </div>
        <nav className="nav-section">
          <div className="nav-label">Main</div>
          <NavLink to="/add-visitor" className="nav-item">Add Visitor</NavLink>
          <NavLink to="/records"     className="nav-item">Visitor Log</NavLink>
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

          {isAdmin && (
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3"  y="3"  width="7" height="7" rx="1"/>
                <rect x="14" y="3"  width="7" height="7" rx="1"/>
                <rect x="3"  y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              Dashboard
            </NavLink>
          )}

          <NavLink to="/visitor-log" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Visitor Log
          </NavLink>

          <NavLink to="/add-visitor" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8"  y1="12" x2="16" y2="12"/>
            </svg>
            Add Visitor
          </NavLink>

          <div className="nav-label" style={{ marginTop: '16px' }}>Account</div>

          {isGuard && (
            <button className="nav-item nav-item-btn" onClick={openNotifPanel}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              Notifications
              {hasUnread && <span className="notif-dot" aria-label="Unread notification" />}
            </button>
          )}

          <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
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
              <div className="user-role">{user?.role || 'Unknown'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={requestLogout}>Logout</button>
        </div>
      </aside>

      {/* Logout confirmation banner */}
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

      {/* Sync Notification Panel — security guard only */}
      {isGuard && showSyncNotif && (
        <div
          className="sync-notif-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowSyncNotif(false)}
        >
          <div className="sync-notif-modal">
            <button
              className="sync-notif-dismiss"
              onClick={() => setShowSyncNotif(false)}
              title="Close"
            >
              ×
            </button>

            <div className="sync-notif-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sync-notif-bell">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>

            <div className="sync-notif-title">Notifications</div>

            {/* Error message */}
            {respondError && (
              <div className="sync-notif-error">{respondError}</div>
            )}

            {syncHistory.length === 0 ? (
              <div className="sync-notif-empty">No notifications yet.</div>
            ) : (
              <div className="sync-history-list">
                {syncHistory.map((entry) => (
                  <div key={entry.id} className={`sync-history-entry status-${entry.status.toLowerCase()}`}>
                    <div className="sync-history-header">
                      <span className="sync-history-name">{entry.requestedByName}</span>
                      <span className={`sync-history-badge badge-${entry.status.toLowerCase()}`}>
                        {entry.status === 'PENDING'  && '⏳ Pending'}
                        {entry.status === 'ACCEPTED' && '✓ Accepted'}
                        {entry.status === 'DECLINED' && '✕ Declined'}
                      </span>
                    </div>
                    <div className="sync-history-desc">
                      Requested access to your visitor log data
                    </div>
                    <div className="sync-history-time">
                      {entry.timestamp instanceof Date
                        ? entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                      {' · '}
                      {entry.timestamp instanceof Date
                        ? entry.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })
                        : new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
                      }
                      {entry.respondedAt && (
                        <span className="sync-history-responded">
                          {' · Responded '}
                          {entry.respondedAt instanceof Date
                            ? entry.respondedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date(entry.respondedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          }
                        </span>
                      )}
                    </div>

                    {entry.status === 'PENDING' && (
                      <div className="sync-notif-actions" style={{ marginTop: 12 }}>
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
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="sync-notif-actions" style={{ marginTop: 16 }}>
              <button className="sync-notif-btn decline" onClick={() => setShowSyncNotif(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NavBar;