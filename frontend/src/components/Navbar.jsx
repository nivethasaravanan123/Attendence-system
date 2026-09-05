import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  Menu, 
  User, 
  LogOut, 
  ChevronDown, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { setAuthToken, setCurrentUser } from '../api/client';

export default function Navbar({ activeTab, setActiveTab, user, onLogout, onToggleSidebar }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const titles = {
    dashboard: { main: 'Executive Dashboard', sub: 'Real-time workforce attendance & departmental distribution' },
    employees: { main: 'Employee Directory', sub: 'Manage master personnel records, departments, and roles' },
    attendance: { main: 'Attendance Management', sub: 'Daily shift logging, roll-call verification, and CSV exports' },
    profile: { main: 'My Account & Profile', sub: 'Administrative session, privileges, and personal info' }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const handleDropdownLogout = () => {
    setIsDropdownOpen(false);
    setAuthToken(null);
    setCurrentUser(null);
    onLogout();
  };

  return (
    <header className="top-bar">
      {/* Left: Hamburger & Title Hierarchy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button
          className="btn btn-secondary btn-icon"
          onClick={onToggleSidebar}
          style={{ display: 'none' }}
        >
          <Menu size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.18rem', fontWeight: '700', letterSpacing: '-0.02em', color: '#ffffff' }}>
            {titles[activeTab]?.main || 'Attendance Portal'}
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {titles[activeTab]?.sub || 'Twite AI Technologies Internal Suite'}
          </span>
        </div>
      </div>

      {/* Right: Date, Time & Top User Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
        {/* Live Clock Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.4rem 0.85rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <Calendar size={14} color="#818cf8" />
          <span>{todayStr}</span>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>
          <Clock size={14} color="#38bdf8" />
          <span style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{time}</span>
        </div>

        {/* User Profile Dropdown Menu */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            id="navbar-user-menu-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: isDropdownOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              padding: '0.3rem 0.75rem 0.3rem 0.35rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#ffffff' }}>
              {user?.fullName?.split(' ')[0] || user?.username || 'Admin'}
            </span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {/* Dropdown Menu Modal */}
          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '230px',
              background: '#111827',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              padding: '0.5rem',
              zIndex: 100,
              animation: 'fadeIn 0.15s ease-out'
            }}>
              {/* Profile Overview */}
              <div style={{
                padding: '0.65rem 0.75rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '0.35rem'
              }}>
                <div style={{ fontWeight: '700', fontSize: '0.86rem', color: '#ffffff' }}>
                  {user?.fullName || 'Administrator'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email || 'admin@twiteai.com'}
                </div>
              </div>

              {/* Navigation Items */}
              <button
                className="nav-item"
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.82rem', width: '100%' }}
                onClick={() => {
                  setIsDropdownOpen(false);
                  setActiveTab('profile');
                }}
              >
                <User size={15} color="#818cf8" />
                <span>My Profile</span>
              </button>

              <div style={{ margin: '0.35rem 0', borderTop: '1px solid var(--border-subtle)' }} />

              {/* Logout button */}
              <button
                id="navbar-logout-btn"
                className="nav-item"
                style={{
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.82rem',
                  width: '100%',
                  color: '#fb7185'
                }}
                onClick={handleDropdownLogout}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
