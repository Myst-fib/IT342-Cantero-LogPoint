import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Profile.css';

// MUI Icons
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';

const API = 'https://logpoint-backend.onrender.com';

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d)) return 'N/A';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d)) return 'N/A';
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
}

function getRoleColor(role) {
  if (!role) return 'badge-role-default';
  const r = role.toLowerCase();
  if (r.includes('admin')) return 'badge-role-admin';
  if (r.includes('guard')) return 'badge-role-guard';
  return 'badge-role-default';
}

// ────────────────────────────────────────────
// Edit Account Modal (Personal Info Only)
// ────────────────────────────────────────────
function EditAccountModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOAuth2 = user.authProvider === 'GOOGLE';

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (!form.firstName.trim()) return 'First name is required.';
    if (!form.lastName.trim()) return 'Last name is required.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'Valid email is required.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setSaving(true);
    setError('');

    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
      };

      const res = await fetch(`${API}/api/user/update`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        let msg;
        if (contentType.includes('application/json')) {
          const json = await res.json();
          msg = json.message || json.error || 'Failed to update profile.';
        } else {
          msg = await res.text();
          try { const j = JSON.parse(msg); msg = j.message || j.error || 'Failed to update profile.'; } catch {}
        }
        throw new Error(msg || 'Failed to update profile.');
      }

      const updated = await res.json();
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify({ ...parsed, ...updated }));
      }
      setSuccess('Account information updated successfully!');
      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 1200);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <PersonOutlineIcon className="modal-title-icon" />
            <div>
              <h2 className="modal-title">Edit Account Information</h2>
              <p className="modal-subtitle">Update your personal details</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <CloseOutlinedIcon />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Alert messages */}
          {error && (
            <div className="modal-alert alert-error">
              <ErrorOutlineIcon className="alert-icon" />
              {error}
            </div>
          )}
          {success && (
            <div className="modal-alert alert-success">
              <CheckCircleIcon className="alert-icon" />
              {success}
            </div>
          )}

          {/* OAuth2 Notice */}
          {isOAuth2 && (
            <div className="modal-notice">
              <CloudOutlinedIcon className="notice-icon" />
              <span>Your account is linked to Google. Email cannot be changed here.</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <div className="input-with-icon-left">
                <PersonOutlineIcon className="input-icon" />
                <input
                  className="form-input with-icon"
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  autoComplete="given-name"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <div className="input-with-icon-left">
                <PersonOutlineIcon className="input-icon" />
                <input
                  className="form-input with-icon"
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon-left">
              <EmailOutlinedIcon className="input-icon" />
              <input
                className="form-input with-icon"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email address"
                autoComplete="email"
                disabled={isOAuth2}
              />
            </div>
            {isOAuth2 && <span className="form-hint">Email is managed by Google and cannot be changed here.</span>}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-modal-save" onClick={handleSave} disabled={saving || !!success}>
            {saving ? (
              <><span className="btn-spinner" /> Saving…</>
            ) : (
              <><SaveOutlinedIcon className="btn-icon-left" /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Security Modal (Password Only)
// ────────────────────────────────────────────
function SecurityModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOAuth2 = user.authProvider === 'GOOGLE';

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (!form.currentPassword) return 'Current password is required.';
    if (!form.newPassword) return 'New password is required.';
    if (form.newPassword.length < 8) return 'New password must be at least 8 characters.';
    if (form.newPassword !== form.confirmPassword) return 'New passwords do not match.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setSaving(true);
    setError('');

    try {
      const payload = {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      };

      const res = await fetch(`${API}/api/user/update-password`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        let msg;
        if (contentType.includes('application/json')) {
          const json = await res.json();
          msg = json.message || json.error || 'Failed to update password.';
        } else {
          msg = await res.text();
          try { const j = JSON.parse(msg); msg = j.message || j.error || 'Failed to update password.'; } catch {}
        }
        throw new Error(msg || 'Failed to update password.');
      }

      setSuccess('Password updated successfully!');
      setTimeout(() => {
        onSaved(user);
        onClose();
      }, 1200);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isOAuth2) {
    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-panel">
          <div className="modal-header">
            <div className="modal-title-group">
              <LockOutlinedIcon className="modal-title-icon" />
              <div>
                <h2 className="modal-title">Security</h2>
                <p className="modal-subtitle">Password management</p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose} aria-label="Close">
              <CloseOutlinedIcon />
            </button>
          </div>
          <div className="modal-body" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <CloudOutlinedIcon style={{ fontSize: 48, color: '#4285F4', marginBottom: 16 }} />
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-dark)' }}>Google Account</h3>
            <p style={{ color: 'var(--text-medium)', fontSize: 14, maxWidth: 320, margin: '0 auto' }}>
              Your account is linked to Google. Please visit your Google Account settings to manage your password.
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn-modal-save" onClick={onClose}>
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <LockOutlinedIcon className="modal-title-icon" />
            <div>
              <h2 className="modal-title">Change Password</h2>
              <p className="modal-subtitle">Update your security credentials</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <CloseOutlinedIcon />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Alert messages */}
          {error && (
            <div className="modal-alert alert-error">
              <ErrorOutlineIcon className="alert-icon" />
              {error}
            </div>
          )}
          {success && (
            <div className="modal-alert alert-success">
              <CheckCircleIcon className="alert-icon" />
              {success}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div className="input-with-icon-left">
              <LockOutlinedIcon className="input-icon" />
              <input
                className="form-input with-icon"
                type={showCurrentPw ? 'text' : 'password'}
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="pw-toggle-right"
                onClick={() => setShowCurrentPw(v => !v)}
                tabIndex={-1}
              >
                {showCurrentPw ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-with-icon-left">
                <LockOutlinedIcon className="input-icon" />
                <input
                  className="form-input with-icon"
                  type={showNewPw ? 'text' : 'password'}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="pw-toggle-right"
                  onClick={() => setShowNewPw(v => !v)}
                  tabIndex={-1}
                >
                  {showNewPw ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-with-icon-left">
                <LockOutlinedIcon className="input-icon" />
                <input
                  className="form-input with-icon"
                  type={showConfirmPw ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="pw-toggle-right"
                  onClick={() => setShowConfirmPw(v => !v)}
                  tabIndex={-1}
                >
                  {showConfirmPw ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </button>
              </div>
            </div>
          </div>

          <div className="password-requirements">
            <p className="requirements-title">Password Requirements:</p>
            <ul className="requirements-list">
              <li>At least 8 characters long</li>
              <li>Should be different from your current password</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-modal-save" onClick={handleSave} disabled={saving || !!success}>
            {saving ? (
              <><span className="btn-spinner" /> Updating…</>
            ) : (
              <><LockOutlinedIcon className="btn-icon-left" /> Update Password</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Main Profile Component
// ────────────────────────────────────────────
function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visitStats, setVisitStats] = useState({ total: 0, thisMonth: 0, active: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [banner, setBanner] = useState({ show: false, message: '', type: '' });
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Hidden file input ref for picture upload
  const fileInputRef = useRef(null);

  const showBanner = (message, type = 'success') => {
    setBanner({ show: true, message, type });
    setTimeout(() => setBanner({ show: false, message: '', type: '' }), 3500);
  };

  // Fetch user
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/user/me`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();
      setUser(data);
      return data;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch visit logs for stats and recent activity
  const fetchVisitData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/visit-logs`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const logs = await res.json();

      const now = new Date();
      const thisMonthLogs = logs.filter(l => {
        const d = new Date(l.timeIn);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const activeCount = logs.filter(l => l.status === 'ACTIVE').length;

      setVisitStats({
        total: logs.length,
        thisMonth: thisMonthLogs.length,
        active: activeCount,
      });

      const sorted = [...logs].sort((a, b) => new Date(b.timeIn) - new Date(a.timeIn));
      setRecentActivity(sorted.slice(0, 5));
    } catch (err) {
      console.error('Could not load visit data:', err);
    }
  }, []);

  useEffect(() => {
    fetchUser().then(() => fetchVisitData());
  }, [fetchUser, fetchVisitData]);

  const handleProfileSaved = (updated) => {
    setUser(prev => ({ ...prev, ...updated }));
    showBanner('Profile updated successfully!', 'success');
  };

  // ── Profile Picture Upload ───────────────────────
  const handleAvatarClick = () => {
    if (!uploadingPicture) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      showBanner('Please select a valid image file.', 'error');
      return;
    }

    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      showBanner('Image must be under 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result; // "data:image/jpeg;base64,..."
      setUploadingPicture(true);

      try {
        const res = await fetch(`${API}/api/user/update-picture`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pictureUrl: base64 }),
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed to upload picture.');
        }

        const updated = await res.json();

        // Update localStorage
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem('user', JSON.stringify({ ...parsed, pictureUrl: updated.pictureUrl }));
        }

        setUser(prev => ({ ...prev, pictureUrl: updated.pictureUrl }));
        showBanner('Profile picture updated!', 'success');
      } catch (err) {
        showBanner(err.message || 'Failed to upload picture.', 'error');
      } finally {
        setUploadingPicture(false);
        // Reset input so the same file can be re-selected if needed
        e.target.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  // ── Loading ──────────────────────────────
  if (loading) {
    return (
      <div className="profile-wrapper">
        <div className="profile-loading">
          <div className="loading-spinner" />
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  // ── Not authenticated ────────────────────
  if (!user) {
    return (
      <div className="profile-wrapper">
        <div className="profile-error">
          <SecurityOutlinedIcon style={{ fontSize: 48, color: 'var(--error)', marginBottom: 8 }} />
          <p>You need to be logged in to view your profile.</p>
          <Link to="/login" className="btn-primary-link">Go to Login</Link>
        </div>
      </div>
    );
  }

  const isOAuth2 = user.authProvider === 'GOOGLE';
  const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="profile-wrapper">
      {/* Toast Banner */}
      {banner.show && (
        <div className={`profile-banner profile-banner-${banner.type}`}>
          {banner.type === 'success'
            ? <CheckCircleIcon className="banner-icon" />
            : <ErrorOutlineIcon className="banner-icon" />
          }
          {banner.message}
        </div>
      )}

      {/* Hidden file input for picture upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className="profile-container">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <div className="page-title">My Profile</div>
            <div className="page-subtitle">Manage your account and personal information</div>
          </div>
        </div>

        <div className="profile-content">
          {/* ── Left: Profile Card ──────────────── */}
          <div className="profile-card">
            {/* Avatar with upload overlay */}
            <div className="avatar-wrap">
              <div
                className={`avatar-large avatar-clickable ${uploadingPicture ? 'avatar-uploading' : ''}`}
                onClick={handleAvatarClick}
                title="Click to change profile picture"
              >
                {uploadingPicture ? (
                  <div className="avatar-upload-spinner" />
                ) : user.pictureUrl ? (
                  <img src={user.pictureUrl} alt={`${user.firstName} ${user.lastName}`} />
                ) : (
                  <div className="avatar-fallback-large">{initials}</div>
                )}

                {/* Camera overlay shown on hover */}
                {!uploadingPicture && (
                  <div className="avatar-overlay">
                    <CameraAltOutlinedIcon className="avatar-overlay-icon" />
                    <span className="avatar-overlay-text">Change</span>
                  </div>
                )}
              </div>

              {isOAuth2 && (
                <span className="oauth-badge" title="Signed in with Google">
                  <CloudOutlinedIcon style={{ fontSize: 14 }} />
                </span>
              )}
            </div>

            <div className="profile-info">
              <h2 className="profile-name">{user.firstName} {user.lastName}</h2>
              <p className="profile-email">
                <EmailOutlinedIcon style={{ fontSize: 14, marginRight: 4, verticalAlign: 'middle' }} />
                {user.email}
              </p>
              <span className={`profile-role-badge ${getRoleColor(user.role)}`}>
                <BadgeOutlinedIcon style={{ fontSize: 13, marginRight: 4, verticalAlign: 'middle' }} />
                {user.role || 'User'}
              </span>
            </div>

            {/* Stats */}
            <div className="profile-stats">
              <div className="stat-item">
                <GroupsOutlinedIcon className="stat-icon" />
                <span className="stat-value">{visitStats.total}</span>
                <span className="stat-label">Total Visits</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <TodayOutlinedIcon className="stat-icon" />
                <span className="stat-value">{visitStats.thisMonth}</span>
                <span className="stat-label">This Month</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <HourglassEmptyOutlinedIcon className="stat-icon" />
                <span className="stat-value">{visitStats.active}</span>
                <span className="stat-label">Active</span>
              </div>
            </div>

            {/* Status Pill */}
            <div className="profile-status-row">
              <span className={`status-pill ${user.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                <span className="status-dot" />
                {user.status || 'ACTIVE'}
              </span>
            </div>
          </div>

          {/* ── Right: Details Grid ─────────────── */}
          <div className="profile-details-grid">

            {/* Account Information */}
            <section className="detail-card">
              <div className="card-header">
                <div className="card-title-group">
                  <PersonOutlineIcon className="card-header-icon" />
                  <h3 className="card-title">Account Information</h3>
                </div>
                <button className="btn-card-edit" onClick={() => setShowEditAccount(true)}>
                  <EditOutlinedIcon style={{ fontSize: 16 }} />
                </button>
              </div>
              <div className="detail-content">
                <div className="detail-row">
                  <span className="detail-label">
                    <PersonOutlineIcon className="detail-icon" /> First Name
                  </span>
                  <span className="detail-value">{user.firstName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <PersonOutlineIcon className="detail-icon" /> Last Name
                  </span>
                  <span className="detail-value">{user.lastName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <EmailOutlinedIcon className="detail-icon" /> Email
                  </span>
                  <span className="detail-value">{user.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <BadgeOutlinedIcon className="detail-icon" /> Role
                  </span>
                  <span className="detail-value">{user.role || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <CalendarTodayOutlinedIcon className="detail-icon" /> Member Since
                  </span>
                  <span className="detail-value">{formatDate(user.createdAt)}</span>
                </div>
              </div>
            </section>

            {/* Security */}
            <section className="detail-card">
              <div className="card-header">
                <div className="card-title-group">
                  <SecurityOutlinedIcon className="card-header-icon" />
                  <h3 className="card-title">Security</h3>
                </div>
                {!isOAuth2 && (
                  <button className="btn-card-edit" onClick={() => setShowSecurity(true)}>
                    <EditOutlinedIcon style={{ fontSize: 16 }} />
                  </button>
                )}
              </div>
              <div className="detail-content">
                <div className="detail-row">
                  <span className="detail-label">
                    <CloudOutlinedIcon className="detail-icon" /> Auth Provider
                  </span>
                  <span className="detail-value">
                    <span className={`provider-badge ${isOAuth2 ? 'provider-google' : 'provider-local'}`}>
                      {isOAuth2 ? '🔵 Google' : '🔐 Local'}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <LockOutlinedIcon className="detail-icon" /> Password
                  </span>
                  <span className="detail-value">
                    {isOAuth2
                      ? <span className="text-muted-sm">Managed by Google</span>
                      : <span className="pw-dots">••••••••</span>
                    }
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <VerifiedUserOutlinedIcon className="detail-icon" /> Account Status
                  </span>
                  <span className="detail-value">
                    <span className={`badge ${user.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>
                      {user.status || 'ACTIVE'}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    <AccessTimeOutlinedIcon className="detail-icon" /> Last Updated
                  </span>
                  <span className="detail-value">{formatDate(user.updatedAt)}</span>
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="detail-card full-width">
              <div className="card-header">
                <div className="card-title-group">
                  <EventNoteOutlinedIcon className="card-header-icon" />
                  <h3 className="card-title">Recent Activity</h3>
                </div>
                <Link to="/visitor-log" className="btn-view-all">View All</Link>
              </div>

              {recentActivity.length === 0 ? (
                <div className="activity-empty">
                  <EventNoteOutlinedIcon className="activity-empty-icon" />
                  <p>No visit records yet.</p>
                </div>
              ) : (
                <div className="activity-list">
                  {recentActivity.map((log) => {
                    const isCompleted = log.status === 'COMPLETED';
                    return (
                      <div className="activity-item" key={log.id}>
                        <div className="activity-icon-wrap">
                          {isCompleted
                            ? <CheckCircleOutlineIcon className="activity-icon activity-icon-done" />
                            : <HourglassEmptyOutlinedIcon className="activity-icon activity-icon-active" />
                          }
                        </div>
                        <div className="activity-main">
                          <span className="activity-name">
                            {log.visitorName || 'Unknown Visitor'}
                          </span>
                          <span className="activity-meta">
                            <LoginOutlinedIcon style={{ fontSize: 12, marginRight: 3 }} />
                            {formatDateTime(log.timeIn)}
                            {log.purposeName && (
                              <span className="activity-purpose"> · {log.purposeName}</span>
                            )}
                          </span>
                        </div>
                        <span className={`badge ${isCompleted ? 'badge-success' : 'badge-info'}`}>
                          {isCompleted ? 'Completed' : 'Active'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Edit Account Modal */}
      {showEditAccount && (
        <EditAccountModal
          user={user}
          onClose={() => setShowEditAccount(false)}
          onSaved={handleProfileSaved}
        />
      )}

      {/* Security Modal */}
      {showSecurity && (
        <SecurityModal
          user={user}
          onClose={() => setShowSecurity(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}

export default Profile;
