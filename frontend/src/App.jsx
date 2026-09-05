import React, { useState, useEffect } from 'react';
import { getAuthToken, getCurrentUser, setAuthToken, setCurrentUser } from './api/client';
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import EmployeesView from './components/EmployeesView';
import AttendanceView from './components/AttendanceView';
import ReportsView from './components/ReportsView';
import DepartmentsView from './components/DepartmentsView';
import SettingsView from './components/SettingsView';
import ProfileView from './components/ProfileView';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [token, setToken] = useState(getAuthToken());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Listen for unauthorized events to automatically kick back to login
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      showToast('Session expired. Please log in again.', 'error');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setToken(getAuthToken());
    showToast(`Welcome back, ${loggedInUser.fullName || loggedInUser.username}!`, 'success');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setUser(null);
    setToken(null);
    setActiveTab('dashboard');
    showToast('Signed out of session successfully', 'success');
  };

  if (!token || !user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Mobile Backdrop */}
      <div 
        className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} 
        onClick={() => setSidebarOpen(false)} 
      />

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => setActiveTab(tab)}
          user={user}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="content-body">
          {activeTab === 'dashboard' && (
            <DashboardView
              user={user}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onNotify={showToast}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeesView
              onNotify={showToast}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              onNotify={showToast}
            />
          )}
          
          {activeTab === 'reports' && (
            <ReportsView
              onNotify={showToast}
            />
          )}

          {activeTab === 'departments' && (
            <DepartmentsView
              onNotify={showToast}
            />
          )}
          
          {activeTab === 'settings' && (
            <SettingsView
              onNotify={showToast}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              user={user}
              onLogout={handleLogout}
              onNotify={showToast}
            />
          )}
        </main>
      </div>

      {/* Toast Notification Container */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? (
              <CheckCircle size={18} color="#10b981" />
            ) : (
              <AlertTriangle size={18} color="#ef4444" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
