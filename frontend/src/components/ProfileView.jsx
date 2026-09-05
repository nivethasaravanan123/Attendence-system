import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Building2, 
  Briefcase, 
  ShieldCheck, 
  Key, 
  Calendar, 
  Clock, 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  Shield, 
  Lock,
  Sparkles,
  Layers,
  FileCheck,
  Edit3,
  KeyRound,
  Check,
  X
} from 'lucide-react';
import { apiRequest, setCurrentUser } from '../api/client';

export default function ProfileView({ user, onLogout, onNotify }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Edit Profile Form State
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const permissions = user?.permissions || [
    'Full Administrative Access',
    'Employee Record Management',
    'Attendance Logging & Overrides',
    'Data Analytics & Metrics',
    'CSV & Excel Audit Export'
  ];

  const formattedDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'September 2026';

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      onNotify?.('Full name cannot be blank', 'error');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: {
          fullName: editFullName.trim(),
          email: editEmail.trim()
        }
      });

      if (res.success && res.user) {
        const updated = { ...user, ...res.user };
        setCurrentUser(updated);
        onNotify?.('Profile details updated successfully.', 'success');
        setShowEditProfileModal(false);
        // Trigger page refresh / state update
        window.location.reload();
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      onNotify?.('Please provide both current and new password.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      onNotify?.('New password must be at least 6 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      onNotify?.('New password and confirmation do not match.', 'error');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: {
          currentPassword,
          newPassword
        }
      });

      if (res.success) {
        onNotify?.('Password changed successfully.', 'success');
        setShowChangePasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to change password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
          Administrator Profile
        </h1>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Manage your account credentials, security access levels, and administrative privileges.
        </p>
      </div>

      {/* Hero Profile Banner Card */}
      <div className="card" style={{
        padding: '0',
        overflow: 'hidden',
        marginBottom: '1.75rem',
        border: '1px solid var(--border-medium)'
      }}>
        {/* Banner Graphic Header */}
        <div style={{
          height: '110px',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0e7490 100%)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            fontSize: '0.75rem',
            color: '#34d399',
            fontWeight: '600'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }} />
            Active Session
          </div>
        </div>

        {/* Profile Info Container */}
        <div style={{ padding: '0 2rem 1.75rem 2rem', position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            marginTop: '-44px',
            marginBottom: '1.5rem'
          }}>
            {/* Avatar & Basic Info */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.25rem' }}>
              <div style={{
                width: '88px',
                height: '88px',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem',
                fontWeight: '800',
                border: '4px solid #121a2d',
                boxShadow: 'var(--shadow-md)'
              }}>
                {user?.username ? user.username.slice(0, 2).toUpperCase() : 'AD'}
              </div>

              <div style={{ paddingBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#ffffff' }}>
                    {user?.fullName || 'System Administrator'}
                  </h2>
                  <span className="badge badge-role">
                    <Shield size={12} />
                    {user?.role || 'Admin'}
                  </span>
                  <span className="badge badge-active">
                    <CheckCircle2 size={12} />
                    Active Account
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  @{user?.username || 'admin'} • {user?.email || 'admin@twiteai.com'}
                </p>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditFullName(user?.fullName || '');
                  setEditEmail(user?.email || '');
                  setShowEditProfileModal(true);
                }}
              >
                <Edit3 size={16} />
                <span>Edit Profile</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setShowChangePasswordModal(true)}
              >
                <KeyRound size={16} />
                <span>Change Password</span>
              </button>

              <button
                id="profile-logout-btn"
                className="btn btn-danger"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            padding: '1rem 1.25rem',
            background: 'var(--bg-card-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Assigned Department
              </span>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {user?.department || 'Executive Operations'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Designation
              </span>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {user?.designation || 'Principal Administrator'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Employee Code
              </span>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--accent-secondary)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                {user?.employeeId || 'ADM-001'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Auth Mechanism
              </span>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', color: '#818cf8', marginTop: '0.2rem' }}>
                JWT Bearer (HMAC-SHA256)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Information Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '1.5rem',
        marginBottom: '1.75rem'
      }}>
        {/* Left Column: Personal & Organization Details */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <User size={18} color="#6366f1" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff' }}>
              Account & Identity Details
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.86rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Full Legal Name</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {user?.fullName || 'System Administrator'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.86rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Username</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--text-primary)' }}>
                {user?.username || 'admin'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.86rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Business Email</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {user?.email || 'admin@twiteai.com'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.86rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Department</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                {user?.department || 'Operations & IT'}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.86rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Account Created</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {formattedDate}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.86rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Last Login Time</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                {new Date().toLocaleTimeString()} (Active)
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Role Privileges */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <ShieldCheck size={18} color="#10b981" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff' }}>
              Permissions & Access Scope
            </h3>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Your account is assigned the <strong>Administrator</strong> role with global read, write, and export authorization across all company modules.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {permissions.map((perm, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.83rem'
                }}
              >
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{perm}</span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '1.5rem',
            padding: '0.85rem',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Lock size={18} color="#818cf8" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
              Tokens are automatically invalidated after 24 hours of inactivity or upon explicit logout.
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Clean & Visible Logout Section */}
      <div className="card" style={{
        border: '1px solid rgba(244, 63, 94, 0.25)',
        background: 'rgba(244, 63, 94, 0.03)',
        padding: '1.5rem 1.75rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="#f43f5e" />
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>
                Session Termination
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Signing out will revoke your bearer token on this browser and redirect you to the sign-in screen.
            </p>
          </div>

          <button
            id="danger-zone-logout-btn"
            className="btn btn-danger-solid"
            onClick={() => setShowLogoutConfirm(true)}
            style={{ padding: '0.65rem 1.35rem' }}
          >
            <LogOut size={16} />
            <span>Sign Out of Session</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Administrator Profile</h3>
              <button 
                className="btn btn-ghost btn-icon" 
                onClick={() => setShowEditProfileModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditProfileModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Update Password</h3>
              <button 
                className="btn btn-ghost btn-icon" 
                onClick={() => setShowChangePasswordModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter existing password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowChangePasswordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPassword}
                >
                  {savingPassword ? 'Changing...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ color: '#ffffff' }}>Confirm Sign Out</h3>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Are you sure you want to end your administrative session?
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                You will need to re-enter your administrator credentials to access protected employee data and attendance rosters.
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Stay Signed In
              </button>
              <button
                id="modal-confirm-logout-btn"
                className="btn btn-danger-solid"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
