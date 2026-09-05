import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, 
  Users, 
  Briefcase, 
  Search, 
  RefreshCw, 
  ChevronRight, 
  UserCheck, 
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { apiRequest } from '../api/client';

export default function DepartmentsView({ onNotify }) {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, attRes] = await Promise.all([
        apiRequest('/employees'),
        apiRequest('/attendance')
      ]);

      setEmployees(empRes.data || []);
      setAttendance(attRes.data || []);
    } catch (err) {
      onNotify?.(err.message || 'Failed to load department analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Group employees by department
  const departmentStats = useMemo(() => {
    const map = {};

    employees.forEach(emp => {
      const dept = emp.department || 'General Operations';
      if (!map[dept]) {
        map[dept] = {
          name: dept,
          total: 0,
          active: 0,
          inactive: 0,
          roles: new Set(),
          employees: [],
          presentToday: 0
        };
      }

      map[dept].total += 1;
      if (emp.status === 'Active') {
        map[dept].active += 1;
      } else {
        map[dept].inactive += 1;
      }

      if (emp.designation) {
        map[dept].roles.add(emp.designation);
      }

      // Check today's attendance for this employee
      const attToday = attendance.find(a => a.employee_id === emp.id && a.attendance_date === todayStr);
      if (attToday && (attToday.attendance_status === 'Present' || attToday.attendance_status === 'Late')) {
        map[dept].presentToday += 1;
      }

      map[dept].employees.push({
        ...emp,
        todayStatus: attToday ? attToday.attendance_status : 'Not Marked'
      });
    });

    return Object.values(map).map(d => ({
      ...d,
      roles: Array.from(d.roles),
      attendanceRate: d.active > 0 ? Math.round((d.presentToday / d.active) * 100) : 0
    }));
  }, [employees, attendance, todayStr]);

  const filteredDepartments = useMemo(() => {
    return departmentStats.filter(dept => {
      if (selectedDept !== 'ALL' && dept.name !== selectedDept) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = dept.name.toLowerCase().includes(q);
        const matchesEmployee = dept.employees.some(e => e.full_name.toLowerCase().includes(q) || e.employee_id.toLowerCase().includes(q));
        return matchesName || matchesEmployee;
      }
      return true;
    });
  }, [departmentStats, selectedDept, searchQuery]);

  return (
    <div className="departments-view">
      {/* Page Header */}
      <div className="toolbar" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Departments & Workforce Distribution
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Track organizational hierarchy, team capacity, and department-level attendance trends.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={fetchData} 
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="card stat-card">
          <div className="stat-info">
            <span>Total Departments</span>
            <h2>{departmentStats.length}</h2>
            <p>Active operational units</p>
          </div>
          <div className="stat-icon-wrapper indigo">
            <Building size={22} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span>Total Staff</span>
            <h2>{employees.length}</h2>
            <p>{employees.filter(e => e.status === 'Active').length} active status</p>
          </div>
          <div className="stat-icon-wrapper emerald">
            <Users size={22} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span>Largest Unit</span>
            <h2 style={{ fontSize: '1.4rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {departmentStats.length > 0 
                ? [...departmentStats].sort((a, b) => b.total - a.total)[0]?.name 
                : 'None'}
            </h2>
            <p>
              {departmentStats.length > 0 
                ? `${[...departmentStats].sort((a, b) => b.total - a.total)[0]?.total} personnel allocated` 
                : 'No data'}
            </p>
          </div>
          <div className="stat-icon-wrapper amber">
            <Layers size={22} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span>Average Team Size</span>
            <h2>
              {departmentStats.length > 0 ? (employees.length / departmentStats.length).toFixed(1) : 0}
            </h2>
            <p>Employees per division</p>
          </div>
          <div className="stat-icon-wrapper rose">
            <Briefcase size={22} />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="toolbar" style={{ marginBottom: '1.5rem' }}>
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search department or employee name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select 
            className="form-control"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="ALL">All Departments ({departmentStats.length})</option>
            {departmentStats.map(d => (
              <option key={d.name} value={d.name}>{d.name} ({d.total})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="card" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem', color: 'var(--accent-primary)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Analyzing department structures...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <Building size={32} style={{ margin: '0 auto 0.75rem', color: 'var(--text-muted)' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No departments found</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            No units match the specified search or filter criteria.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {filteredDepartments.map((dept) => (
            <div key={dept.name} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                    {dept.name}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                    {dept.total} {dept.total === 1 ? 'Member' : 'Members'} • {dept.active} Active
                  </span>
                </div>
                <div className="badge badge-dept" style={{ fontSize: '0.76rem' }}>
                  {dept.attendanceRate}% Today
                </div>
              </div>

              {/* Progress bar for attendance */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  <span>Today's Attendance Rate</span>
                  <span>{dept.presentToday} / {dept.active} present</span>
                </div>
                <div className="progress-bar-container" style={{ margin: 0 }}>
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${dept.attendanceRate}%`,
                      background: dept.attendanceRate >= 80 ? 'var(--status-present)' : dept.attendanceRate >= 50 ? 'var(--status-late)' : 'var(--status-absent)'
                    }} 
                  />
                </div>
              </div>

              {/* Team Members List preview */}
              <div style={{ flex: 1, borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.75rem' }}>
                  Staff Allocated ({dept.employees.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {dept.employees.map(emp => (
                    <div 
                      key={emp.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.72rem' }}>
                          {emp.full_name ? emp.full_name.slice(0, 2).toUpperCase() : 'EM'}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {emp.full_name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {emp.designation || 'Staff'}
                          </div>
                        </div>
                      </div>

                      <span className={`badge ${
                        emp.todayStatus === 'Present' ? 'badge-present' : 
                        emp.todayStatus === 'Late' ? 'badge-late' : 
                        emp.todayStatus === 'Half-Day' ? 'badge-halfday' : 
                        emp.todayStatus === 'Absent' ? 'badge-absent' : 'badge-inactive'
                      }`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                        {emp.todayStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roles badge tags footer */}
              {dept.roles.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {dept.roles.slice(0, 3).map(role => (
                      <span key={role} className="badge badge-role" style={{ fontSize: '0.68rem' }}>
                        {role}
                      </span>
                    ))}
                    {dept.roles.length > 3 && (
                      <span className="badge" style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                        +{dept.roles.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
