import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  User,
  LogOut, 
  ShieldCheck, 
  BarChart2,
  Building,
  Settings
} from 'lucide-react';
import { setAuthToken, setCurrentUser } from '../api/client';

export default function Sidebar({ isOpen, activeTab, setActiveTab, user, onLogout }) {
  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    onLogout();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance Records', icon: CalendarCheck },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'departments', label: 'Departments', icon: Building }
  ];

  const systemItems = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand */}
      <div className="brand">
        <div className="brand-icon">
          <ShieldCheck size={22} />
        </div>
        <div className="brand-text">
          <h1>Twite AI</h1>
          <span>Attendance Hub</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav-menu">
        <div className="nav-section-title">Main Menu</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="nav-section-title" style={{ marginTop: '0.75rem' }}>System</div>
        {systemItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile & Logout Card */}
      <div className="sidebar-footer">
        <button
          className="user-info-btn"
          onClick={() => setActiveTab('profile')}
          title="View profile"
        >
          <div className="avatar">
            {user?.username ? user.username.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="user-details">
            <h4>{user?.fullName || 'Administrator'}</h4>
            <span>{user?.role || 'Admin'}</span>
          </div>
        </button>

        <button
          id="logout-btn"
          className="btn btn-secondary btn-icon"
          title="Sign Out of Session"
          onClick={handleLogout}
          style={{
            width: '32px',
            height: '32px',
            color: '#fb7185',
            borderColor: 'rgba(244, 63, 94, 0.25)'
          }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
