import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  CalendarCheck,
  Percent,
  UserPlus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import { apiRequest } from '../api/client';

export default function DashboardView({ user, onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchStats = async (date) => {
    try {
      setLoading(true);
      const [statsRes, trendsRes] = await Promise.all([
        apiRequest(`/dashboard/stats?date=${date}`),
        apiRequest(`/dashboard/trends`).catch(() => ({ success: false }))
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (trendsRes.success) {
        setTrends(trendsRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedDate);
  }, [selectedDate]);

  const setDatePreset = (preset) => {
    const d = new Date();
    if (preset === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    const dateStr = d.toISOString().split('T')[0];
    setSelectedDate(dateStr);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const departmentColors = [
    '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'
  ];

  return (
    <div>
      {/* 1. Welcome & Actions Hero Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Welcome back, {user?.fullName?.split(' ')[0] || user?.username || 'Administrator'} 👋
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.72rem',
              fontWeight: '600',
              color: '#34d399'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              Live Sync
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Workforce summary and real-time attendance roll-call for {selectedDate}.
          </p>
        </div>

        {/* Date Controls & Action Shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Quick Date Toggle Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.2rem'
          }}>
            <button
              className={`btn btn-sm ${isToday ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setDatePreset('today')}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            >
              Today
            </button>
            <button
              className={`btn btn-sm ${!isToday ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setDatePreset('yesterday')}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            >
              Yesterday
            </button>
            <input
              type="date"
              className="form-control"
              style={{
                width: 'auto',
                border: 'none',
                background: 'transparent',
                padding: '0.35rem 0.65rem',
                fontSize: '0.78rem',
                color: 'var(--text-primary)'
              }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <button
            id="dash-mark-attendance-btn"
            className="btn btn-primary"
            onClick={() => onNavigateTab('attendance')}
            style={{ fontSize: '0.84rem', padding: '0.55rem 1rem' }}
          >
            <CalendarCheck size={16} />
            <span>Mark Attendance</span>
          </button>

          <button
            id="dash-add-employee-btn"
            className="btn btn-secondary"
            onClick={() => onNavigateTab('employees')}
            style={{ fontSize: '0.84rem', padding: '0.55rem 1rem' }}
          >
            <UserPlus size={16} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* 2. Primary KPI Metric Cards Grid */}
      <div className="stats-grid">
        {/* Card 1: Total Employees */}
        <div className="card stat-card">
          <div className="stat-info">
            <span>Total Workforce</span>
            <h2>{stats?.totalEmployees ?? 0}</h2>
            <p>
              <span style={{ color: '#34d399', fontWeight: '600' }}>{stats?.activeEmployees ?? 0} Active</span>
              <span>•</span>
              <span>{stats?.inactiveEmployees ?? 0} Inactive</span>
            </p>
          </div>
          <div className="stat-icon-wrapper indigo">
            <Users size={22} />
          </div>
        </div>

        {/* Card 2: Present Today */}
        <div className="card stat-card">
          <div className="stat-info">
            <span>Present Today</span>
            <h2>{stats?.presentToday ?? 0}</h2>
            <p>
              <span style={{ color: '#fbbf24', fontWeight: '600' }}>+{stats?.lateToday ?? 0} late</span>
              <span>checked in</span>
            </p>
          </div>
          <div className="stat-icon-wrapper emerald">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Card 3: Absent Today */}
        <div className="card stat-card">
          <div className="stat-info">
            <span>Absent / Leave</span>
            <h2>{stats?.absentToday ?? 0}</h2>
            <p>
              <span style={{ color: '#38bdf8', fontWeight: '600' }}>{stats?.halfDayToday ?? 0} on half-day</span>
            </p>
          </div>
          <div className="stat-icon-wrapper rose">
            <XCircle size={22} />
          </div>
        </div>

        {/* Card 4: Attendance Rate */}
        <div className="card stat-card">
          <div className="stat-info">
            <span>Turnout Rate</span>
            <h2 style={{ color: '#34d399' }}>{stats?.attendancePercentage ?? 0}%</h2>
            <p>
              <span>Calculated on active staff</span>
            </p>
          </div>
          <div className="stat-icon-wrapper emerald">
            <Percent size={22} />
          </div>
        </div>
      </div>

      {/* 7-Day Turnout Trends Card */}
      {trends?.trends && trends.trends.length > 0 && (
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <TrendingUp size={18} color="#6366f1" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff' }}>
                7-Day Workforce Turnout Trend
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }} />
                Present
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f59e0b' }} />
                Late
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#38bdf8' }} />
                Half-Day
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f43f5e' }} />
                Absent
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${trends.trends.length}, 1fr)`, gap: '1rem', alignItems: 'flex-end', minHeight: '140px', padding: '0.5rem 0' }}>
            {trends.trends.map((day) => {
              const heightPct = Math.max(day.attendancePercentage, 6);
              const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });

              return (
                <div key={day.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: day.attendancePercentage > 75 ? '#34d399' : day.attendancePercentage > 50 ? '#fbbf24' : '#fb7185' }}>
                    {day.attendancePercentage}%
                  </div>
                  <div style={{ 
                    width: '100%', 
                    maxWidth: '46px', 
                    height: '110px', 
                    background: 'rgba(255, 255, 255, 0.04)', 
                    borderRadius: 'var(--radius-md)', 
                    display: 'flex', 
                    flexDirection: 'column-reverse', 
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div 
                      style={{ 
                        height: `${heightPct}%`, 
                        width: '100%', 
                        background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
                        borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                        transition: 'height 0.4s ease'
                      }} 
                      title={`${day.date}: ${day.attendancePercentage}% (${day.present} present, ${day.late} late, ${day.absent} absent)`}
                    />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-primary)' }}>{dayLabel}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{day.date.slice(5)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Split Layout: Department Distribution & Attendance Health */}
      <div className="dashboard-split-grid">
        {/* Left: Department Distribution Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Building2 size={18} color="#818cf8" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>
                Department-Wise Headcount
              </h3>
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {stats?.departmentBreakdown?.length || 0} Departments Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {stats?.departmentBreakdown && stats.departmentBreakdown.length > 0 ? (
              stats.departmentBreakdown.map((dept, idx) => {
                const maxCount = stats.totalEmployees > 0 ? stats.totalEmployees : 1;
                const percent = Math.round((dept.total_count / maxCount) * 100);
                const color = departmentColors[idx % departmentColors.length];

                return (
                  <div key={dept.department}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: color
                        }} />
                        <span style={{ fontSize: '0.86rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {dept.department}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {dept.total_count} {dept.total_count === 1 ? 'member' : 'members'} ({percent}%)
                      </span>
                    </div>

                    <div className="progress-bar-container">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${percent}%`, 
                          background: color 
                        }} 
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No department data available.</p>
            )}
          </div>
        </div>

        {/* Right: Daily Turnout Overview & Metrics */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '1.25rem' }}>
              <TrendingUp size={18} color="#10b981" />
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>
                Shift Health & Turnout
              </h3>
            </div>

            {/* Turnout Percentage Hero Card */}
            <div style={{
              background: 'var(--bg-card-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.35rem',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              marginBottom: '1.25rem'
            }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Effective Attendance
              </span>
              <div style={{
                fontSize: '3rem',
                fontWeight: '800',
                letterSpacing: '-0.03em',
                color: '#34d399',
                lineHeight: '1.1',
                margin: '0.35rem 0'
              }}>
                {stats?.attendancePercentage ?? 0}%
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Based on active staff capacity for {selectedDate}
              </p>
            </div>

            {/* Turnout Breakdown 4-Card Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.65rem'
            }}>
              <div style={{
                background: 'var(--status-present-bg)',
                border: '1px solid var(--status-present-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--status-present)', fontWeight: '600', textTransform: 'uppercase' }}>
                  On-Time Present
                </span>
                <p style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', marginTop: '0.15rem' }}>
                  {stats?.presentToday ?? 0}
                </p>
              </div>

              <div style={{
                background: 'var(--status-late-bg)',
                border: '1px solid var(--status-late-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--status-late)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Late Check-ins
                </span>
                <p style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', marginTop: '0.15rem' }}>
                  {stats?.lateToday ?? 0}
                </p>
              </div>

              <div style={{
                background: 'var(--status-halfday-bg)',
                border: '1px solid var(--status-halfday-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--status-halfday)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Half-Day Leave
                </span>
                <p style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', marginTop: '0.15rem' }}>
                  {stats?.halfDayToday ?? 0}
                </p>
              </div>

              <div style={{
                background: 'var(--status-absent-bg)',
                border: '1px solid var(--status-absent-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--status-absent)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Absent / Off
                </span>
                <p style={{ fontSize: '1.15rem', fontWeight: '700', color: '#ffffff', marginTop: '0.15rem' }}>
                  {stats?.absentToday ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Formula: (Present + Late + 0.5 × Half-Day) ÷ Active Employees × 100
            </span>
          </div>
        </div>
      </div>

      {/* 4. Recent Attendance Activity Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Clock size={18} color="#06b6d4" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>
              Recent Activity Roster
            </h3>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateTab('attendance')}
          >
            <span>View All Records</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Check-In</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentActivity?.length > 0 ? (
                stats.recentActivity.map((rec) => {
                  const statusClass = 
                    rec.attendance_status === 'Present' ? 'badge-present' :
                    rec.attendance_status === 'Absent' ? 'badge-absent' :
                    rec.attendance_status === 'Late' ? 'badge-late' : 'badge-halfday';

                  return (
                    <tr key={rec.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '0.75rem' }}>
                            {rec.employee_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#ffffff' }}>{rec.employee_name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rec.employee_id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-dept">{rec.department}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {rec.attendance_date}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {rec.check_in_time || '—'}
                      </td>
                      <td>
                        <span className={`badge ${statusClass}`}>
                          {rec.attendance_status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    No recent attendance activity found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
