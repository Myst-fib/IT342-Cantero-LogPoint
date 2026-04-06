import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../../styles/NavBar.css';
import logo from '../assets/logpoint_logo.png';

function NavBar() {
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const isAdmin = user?.role?.toLowerCase() === 'office administrators';

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
    </>
  );
}

export default NavBar;