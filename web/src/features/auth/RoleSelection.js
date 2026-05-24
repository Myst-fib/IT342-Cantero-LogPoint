import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './RoleSelection.css';

const API = process.env.REACT_APP_API_URL || 'https://logpoint-backend.onrender.com';

function RoleSelection() {
  const navigate = useNavigate();
  const location = useLocation();

  const [userInfo, setUserInfo] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id        = params.get('id');
    const email     = params.get('email');
    const firstName = params.get('firstName');
    const lastName  = params.get('lastName');
    const picture   = params.get('picture');

    if (!email) {
      navigate('/login?error=oauth2_failed');
      return;
    }

    setUserInfo({ id, email, firstName, lastName, picture });
  }, [location, navigate]);

  const handleConfirm = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/auth/set-role`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userInfo.email, role: selectedRole }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to set role');
      }

      const data = await res.json();

      // Save to localStorage same as normal login
      const user = {
        id:           data.id,
        email:        data.email,
        firstName:    data.firstName,
        lastName:     data.lastName,
        role:         data.role,
        pictureUrl:   userInfo.picture,
        authProvider: 'GOOGLE',
      };
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect based on role
      if (data.role?.toLowerCase() === 'office administrator') {
        navigate('/dashboard');
      } else {
        navigate('/visitor-log');
      }

    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo) {
    return (
      <div className="role-sel-wrapper">
        <div className="role-sel-spinner" />
      </div>
    );
  }

  return (
    <div className="role-sel-wrapper">
      <div className="role-sel-card">

        {/* Header */}
        <div className="role-sel-header">
          <div className="role-sel-logo">🏢 LogPoint</div>
          <h1 className="role-sel-title">Almost there!</h1>
          <p className="role-sel-subtitle">Choose how you'll be using LogPoint</p>
        </div>

        {/* User info strip */}
        <div className="role-sel-user-strip">
          {userInfo.picture ? (
            <img src={userInfo.picture} alt="avatar" className="role-sel-avatar" />
          ) : (
            <div className="role-sel-avatar-fallback">
              {userInfo.firstName?.charAt(0)}{userInfo.lastName?.charAt(0)}
            </div>
          )}
          <div>
            <div className="role-sel-name">{userInfo.firstName} {userInfo.lastName}</div>
            <div className="role-sel-email">{userInfo.email}</div>
          </div>
        </div>

        {/* Role options */}
        <div className="role-sel-label">Select your role</div>
        <div className="role-sel-options">

          <button
            className={`role-option ${selectedRole === 'Office Administrator' ? 'selected' : ''}`}
            onClick={() => { setSelectedRole('Office Administrator'); setError(''); }}
          >
            <span className="role-option-icon">🖥️</span>
            <div className="role-option-info">
              <div className="role-option-name">Office Administrator</div>
              <div className="role-option-desc">
                Manage visitors, view dashboards, and oversee all visit logs
              </div>
            </div>
            <span className="role-option-check">{selectedRole === 'Office Administrator' ? '✓' : ''}</span>
          </button>

          <button
            className={`role-option ${selectedRole === 'Guard' ? 'selected' : ''}`}
            onClick={() => { setSelectedRole('Guard'); setError(''); }}
          >
            <span className="role-option-icon">🛡️</span>
            <div className="role-option-info">
              <div className="role-option-name">Security Guard</div>
              <div className="role-option-desc">
                Log visitor check-ins and check-outs at the entry point
              </div>
            </div>
            <span className="role-option-check">{selectedRole === 'Guard' ? '✓' : ''}</span>
          </button>

        </div>

        {error && <div className="role-sel-error">{error}</div>}

        <button
          className="role-sel-confirm"
          onClick={handleConfirm}
          disabled={loading || !selectedRole}
        >
          {loading ? (
            <><span className="role-sel-btn-spinner" /> Setting up your account…</>
          ) : (
            'Continue to LogPoint →'
          )}
        </button>

      </div>
    </div>
  );
}

export default RoleSelection;