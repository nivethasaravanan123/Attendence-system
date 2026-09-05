import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  Search, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Printer,
  ChevronDown
} from 'lucide-react';
import { apiRequest } from '../api/client';

export default function ReportsView({ onNotify }) {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDayMonth);
  const [endDate, setEndDate] = useState(todayStr);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attRes, empRes] = await Promise.all([
        apiRequest('/attendance'),
        apiRequest('/employees')
      ]);

      setAttendance(attRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      onNotify?.(err.message || 'Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Department list extracted from employees
  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department).filter(Boolean));
    return Array.from(depts);
  }, [employees]);

  // Combined & filtered data
  const filteredData = useMemo(() => {
    const empMap = new Map(employees.map(e => [e.id, e]));

    return attendance.filter(item => {
      // Date filter
      if (startDate && item.attendance_date < startDate) return false;
      if (endDate && item.attendance_date > endDate) return false;

      // Status filter
      if (statusFilter !== 'ALL' && item.attendance_status !== statusFilter) return false;

      // Department filter
      const emp = empMap.get(item.employee_id) || {};
      const dept = item.department || emp.department || '';
      if (departmentFilter !== 'ALL' && dept !== departmentFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const empName = (item.employee_name || emp.full_name || '').toLowerCase();
        const empCode = (item.employee_code || emp.employee_id || '').toLowerCase();
        if (!empName.includes(query) && !empCode.includes(query)) return false;
      }

      return true;
    });
  }, [attendance, employees, startDate, endDate, statusFilter, departmentFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = filteredData.length;
    let present = 0, late = 0, halfDay = 0, absent = 0;

    filteredData.forEach(r => {
      if (r.attendance_status === 'Present') present++;
      else if (r.attendance_status === 'Late') late++;
      else if (r.attendance_status === 'Half-Day') halfDay++;
      else if (r.attendance_status === 'Absent') absent++;
    });

    const effectivePresent = present + late + (halfDay * 0.5);
    const rate = total > 0 ? ((effectivePresent / total) * 100).toFixed(1) : 0;

    return { total, present, late, halfDay, absent, rate };
  }, [filteredData]);

  // Export to CSV functionality
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      onNotify?.('No data to export for current filters', 'error');
      return;
    }

    const headers = ['Record ID', 'Date', 'Employee ID', 'Employee Name', 'Department', 'Status', 'Check-In', 'Check-Out', 'Working Hours'];
    const empMap = new Map(employees.map(e => [e.id, e]));

    const rows = filteredData.map(r => {
      const emp = empMap.get(r.employee_id) || {};
      return [
        r.id,
        r.attendance_date,
        `"${r.employee_code || emp.employee_id || ''}"`,
        `"${r.employee_name || emp.full_name || ''}"`,
        `"${r.department || emp.department || ''}"`,
        r.attendance_status,
        r.check_in_time || 'N/A',
        r.check_out_time || 'N/A',
        r.working_hours ? `${r.working_hours} hrs` : 'N/A'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onNotify?.(`Successfully exported ${filteredData.length} records to CSV`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Present': return 'badge-present';
      case 'Absent': return 'badge-absent';
      case 'Late': return 'badge-late';
      case 'Half-Day': return 'badge-halfday';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="reports-view">
      {/* Page Header */}
      <div className="toolbar" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Attendance & Audit Reports
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Generate, filter, inspect, and export comprehensive personnel attendance reports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={fetchData} 
            disabled={loading}
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Sync</span>
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handlePrint}
            title="Print view"
          >
            <Printer size={16} />
            <span>Print</span>
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleExportCSV}
            title="Export CSV document"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card stat-card">
          <div className="stat-info">
            <span>Filtered Records</span>
            <h2>{stats.total}</h2>
            <p>Total logged entries</p>
          </div>
          <div className="stat-icon-wrapper indigo">
            <FileText size={22} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span>Effective Rate</span>
            <h2>{stats.rate}%</h2>
            <p>Weighted attendance index</p>
          </div>
          <div className="stat-icon-wrapper emerald">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span>Late Arrivals</span>
            <h2>{stats.late}</h2>
            <p>Entries flagged tardy</p>
          </div>
          <div className="stat-icon-wrapper amber">
            <Clock size={22} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span>Absences</span>
            <h2>{stats.absent}</h2>
            <p>Unexcused absences</p>
          </div>
          <div className="stat-icon-wrapper rose">
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search Employee</label>
            <div className="search-input-wrapper" style={{ width: '100%', maxWidth: 'none' }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="form-control search-input"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Attendance Status</label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half-Day">Half-Day</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Department</label>
            <select
              className="form-control"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {(startDate !== firstDayMonth || endDate !== todayStr || statusFilter !== 'ALL' || departmentFilter !== 'ALL' || searchQuery) && (
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setStartDate(firstDayMonth);
                setEndDate(todayStr);
                setStatusFilter('ALL');
                setDepartmentFilter('ALL');
                setSearchQuery('');
              }}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Report Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee ID</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Status</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Working Hours</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem', color: 'var(--accent-primary)' }} />
                  <p style={{ color: 'var(--text-muted)' }}>Loading report records...</p>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3.5rem' }}>
                  <Filter size={32} style={{ margin: '0 auto 0.75rem', color: 'var(--text-muted)' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No attendance records match your filters</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Try expanding your date range or clearing specific filter criteria.
                  </p>
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}>
                    {item.attendance_date}
                  </td>
                  <td>
                    <span className="badge badge-dept" style={{ fontFamily: 'var(--font-mono)' }}>
                      {item.employee_code || item.employee_id}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#ffffff' }}>
                    {item.employee_name || 'N/A'}
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.department || 'General'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(item.attendance_status)}`}>
                      {item.attendance_status}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}>
                    {item.check_in_time || '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}>
                    {item.check_out_time || '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', fontWeight: 600 }}>
                    {item.working_hours ? `${item.working_hours} hrs` : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <span>Showing {filteredData.length} records</span>
        <span>Generated from Twite AI Attendance Database</span>
      </div>
    </div>
  );
}
