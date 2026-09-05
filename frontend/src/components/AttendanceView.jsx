import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Calendar, 
  Download, 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  User, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight, 
  X,
  History,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { apiRequest, getAuthToken } from '../api/client';

export default function AttendanceView({ onNotify }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Filters & Controls
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Mark Attendance Modal
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [markForm, setMarkForm] = useState({
    employee_id: '',
    attendance_date: new Date().toISOString().split('T')[0],
    check_in_time: '09:00:00',
    check_out_time: '18:00:00',
    attendance_status: 'Present',
    notes: ''
  });
  const [markError, setMarkError] = useState('');

  // Individual History Modal
  const [employeeHistoryModal, setEmployeeHistoryModal] = useState(null);

  // Fetch employees list for Mark Attendance dropdown
  const fetchAllEmployees = async () => {
    try {
      const res = await apiRequest('/employees?all=true');
      if (res.success) {
        setAllEmployees(res.data);
        if (res.data.length > 0 && !markForm.employee_id) {
          setMarkForm((prev) => ({ ...prev, employee_id: res.data[0].employee_id }));
        }
      }
    } catch (err) {
      console.error('Error fetching employees list:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await apiRequest('/employees/departments');
      if (res.success) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  // Fetch records and summary
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        date: selectedDate,
        department: selectedDept,
        status: selectedStatus,
        search: searchTerm
      });

      const [recordsRes, summaryRes] = await Promise.all([
        apiRequest(`/attendance?${params.toString()}`),
        apiRequest(`/attendance/summary?date=${selectedDate}`)
      ]);

      if (recordsRes.success) {
        setRecords(recordsRes.data);
        if (recordsRes.pagination) {
          setPagination(recordsRes.pagination);
        }
      }

      if (summaryRes.success) {
        setSummary(summaryRes.data);
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to fetch attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate, selectedDept, selectedStatus, currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAttendanceData();
  };

  // Open mark attendance modal with sensible defaults
  const handleOpenMarkModal = (empId = null) => {
    const defaultEmp = empId || (allEmployees[0] ? allEmployees[0].employee_id : '');
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    setMarkForm({
      employee_id: defaultEmp,
      attendance_date: selectedDate || now.toISOString().split('T')[0],
      check_in_time: timeStr,
      check_out_time: '18:00:00',
      attendance_status: 'Present',
      notes: ''
    });
    setMarkError('');
    setIsMarkModalOpen(true);
  };

  // Submit mark attendance
  const handleMarkSubmit = async (e) => {
    e.preventDefault();
    setMarkError('');

    try {
      const res = await apiRequest('/attendance', {
        method: 'POST',
        body: markForm
      });

      if (res.success) {
        onNotify?.(res.message || 'Attendance marked successfully', 'success');
        setIsMarkModalOpen(false);
        fetchAttendanceData();
      }
    } catch (err) {
      setMarkError(err.message || 'Failed to mark attendance.');
    }
  };

  // Export Attendance CSV (Round 2 Defense Item)
  const handleExportCSV = () => {
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        department: selectedDept,
        status: selectedStatus
      });

      const token = getAuthToken();
      // Fetch CSV directly and trigger browser download
      fetch(`/api/attendance/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${selectedDate || 'all'}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        onNotify?.('Attendance report downloaded as CSV!', 'success');
      })
      .catch((err) => {
        onNotify?.('Failed to download attendance CSV.', 'error');
      });
    } catch (err) {
      onNotify?.('Error exporting CSV', 'error');
    }
  };

  // View individual employee history
  const handleOpenEmployeeHistory = async (empId) => {
    try {
      const res = await apiRequest(`/attendance/employee/${empId}`);
      if (res.success) {
        setEmployeeHistoryModal(res.data);
      }
    } catch (err) {
      onNotify?.('Failed to fetch employee attendance history', 'error');
    }
  };

  return (
    <div>
      {/* Header & Main Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
            Attendance Management
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            Track daily check-ins, check-outs, attendance status, and export audits.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Export Feature (Round 2 Defense Item) */}
          <button
            id="export-csv-btn"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            title="Download CSV Report"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            id="mark-attendance-btn"
            className="btn btn-primary"
            onClick={() => handleOpenMarkModal()}
          >
            <CalendarCheck size={18} />
            <span>Mark Attendance</span>
          </button>
        </div>
      </div>

      {/* Attendance Summary Strip */}
      {summary && (
        <div className="card" style={{
          marginBottom: '1.5rem',
          padding: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          alignItems: 'center',
          background: 'rgba(17, 24, 39, 0.9)'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Selected Date</span>
            <p style={{ fontSize: '1rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>
              {summary.date}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Present</span>
            <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#34d399' }}>
              {summary.presentCount}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Late</span>
            <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fbbf24' }}>
              {summary.lateCount}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Half-Day</span>
            <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#60a5fa' }}>
              {summary.halfDayCount}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Absent</span>
            <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f87171' }}>
              {summary.absentCount}
            </p>
          </div>

          {/* Attendance Percentage (Round 2 Defense Item) */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '0.5rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '600', textTransform: 'uppercase' }}>
              Attendance Rate
            </span>
            <p style={{ fontSize: '1.35rem', fontWeight: '800', color: '#34d399' }}>
              {summary.attendancePercentage}%
            </p>
          </div>
        </div>
      )}

      {/* Toolbar: Date Picker, Department Filter, Status Filter, Search */}
      <div className="toolbar card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16} color="#6366f1" />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Date:</span>
          <input
            id="attendance-date-picker"
            type="date"
            className="form-control"
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="search-input-wrapper" style={{ maxWidth: '280px' }}>
          <Search size={16} className="search-icon" />
          <input
            id="attendance-search-input"
            type="text"
            className="form-control search-input"
            placeholder="Search employee or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        {/* Filters Group */}
        <div className="filter-group">
          {/* Department Filter (Round 2 Defense Item) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dept:</span>
            <select
              id="attendance-dept-filter"
              className="form-control"
              style={{ width: 'auto', padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
            <select
              id="attendance-status-filter"
              className="form-control"
              style={{ width: 'auto', padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half-Day">Half-Day</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSelectedDate(new Date().toISOString().split('T')[0]);
              setSelectedDept('All');
              setSelectedStatus('All');
              setSearchTerm('');
              setCurrentPage(1);
            }}
          >
            Today
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="table-container">
        <table className="custom-table" id="attendance-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Date</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Status</th>
              <th>Notes</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading attendance records...
                </td>
              </tr>
            ) : records.length > 0 ? (
              records.map((rec) => {
                const statusClass = 
                  rec.attendance_status === 'Present' ? 'badge-present' :
                  rec.attendance_status === 'Absent' ? 'badge-absent' :
                  rec.attendance_status === 'Late' ? 'badge-late' : 'badge-halfday';

                return (
                  <tr key={rec.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--accent-secondary)' }}>
                      {rec.employee_id}
                    </td>
                    <td>
                      <div 
                        style={{ fontWeight: '600', cursor: 'pointer', color: 'var(--text-primary)' }}
                        onClick={() => handleOpenEmployeeHistory(rec.employee_id)}
                        title="Click to view full attendance history"
                      >
                        {rec.employee_name}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-dept">{rec.department}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {rec.attendance_date}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {rec.check_in_time || '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                      {rec.check_out_time || '—'}
                    </td>
                    <td>
                      <span className={`badge ${statusClass}`}>
                        {rec.attendance_status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rec.notes || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-icon"
                        title="View Individual Attendance History"
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => handleOpenEmployeeHistory(rec.employee_id)}
                      >
                        <History size={15} color="#06b6d4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No attendance records found for this date and filter selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1.25rem',
          padding: '0 0.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>
            <span style={{ padding: '0 0.5rem', fontFamily: 'var(--font-mono)' }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Mark Attendance Modal */}
      {isMarkModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Mark / Update Daily Attendance</h3>
              <button
                className="btn btn-secondary btn-icon"
                style={{ width: '30px', height: '30px' }}
                onClick={() => setIsMarkModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleMarkSubmit}>
              <div className="modal-body">
                {markError && (
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.84rem',
                    marginBottom: '1rem'
                  }}>
                    {markError}
                  </div>
                )}

                <div className="form-group">
                  <label>Select Employee *</label>
                  <select
                    id="mark-employee-select"
                    className="form-control"
                    value={markForm.employee_id}
                    onChange={(e) => setMarkForm({ ...markForm, employee_id: e.target.value })}
                    required
                  >
                    {allEmployees.map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.employee_id} - {emp.employee_name} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Attendance Date *</label>
                  <input
                    id="mark-date-input"
                    type="date"
                    className="form-control"
                    value={markForm.attendance_date}
                    onChange={(e) => setMarkForm({ ...markForm, attendance_date: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Check-In Time</label>
                    <input
                      id="mark-checkin-input"
                      type="time"
                      step="1"
                      className="form-control"
                      value={markForm.check_in_time}
                      onChange={(e) => setMarkForm({ ...markForm, check_in_time: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Check-Out Time</label>
                    <input
                      id="mark-checkout-input"
                      type="time"
                      step="1"
                      className="form-control"
                      value={markForm.check_out_time}
                      onChange={(e) => setMarkForm({ ...markForm, check_out_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Attendance Status *</label>
                  <select
                    id="mark-status-select"
                    className="form-control"
                    value={markForm.attendance_status}
                    onChange={(e) => setMarkForm({ ...markForm, attendance_status: e.target.value })}
                    required
                  >
                    <option value="Present">Present (Full Working Day)</option>
                    <option value="Late">Late Arrival</option>
                    <option value="Half-Day">Half-Day (0.5 Day)</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notes / Justification</label>
                  <input
                    id="mark-notes-input"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Remote work, traffic transit, doctor visit"
                    value={markForm.notes}
                    onChange={(e) => setMarkForm({ ...markForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsMarkModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  id="submit-mark-btn"
                  type="submit"
                  className="btn btn-primary"
                >
                  Confirm & Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Employee Attendance History Modal */}
      {employeeHistoryModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <History size={20} color="#06b6d4" />
                <h3>Attendance History: {employeeHistoryModal.employee?.employee_name}</h3>
              </div>
              <button
                className="btn btn-secondary btn-icon"
                style={{ width: '30px', height: '30px' }}
                onClick={() => setEmployeeHistoryModal(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {/* Employee Summary Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>
                    {employeeHistoryModal.employee?.employee_name}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {employeeHistoryModal.employee?.employee_id} • {employeeHistoryModal.employee?.department} • {employeeHistoryModal.employee?.designation}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attendance Rate</span>
                  <p style={{ fontSize: '1.3rem', fontWeight: '800', color: '#34d399' }}>
                    {employeeHistoryModal.stats?.attendanceRate}%
                  </p>
                </div>
              </div>

              {/* Stats Counters */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                textAlign: 'center',
                marginBottom: '1.25rem'
              }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Recorded Days</span>
                  <p style={{ fontWeight: '700' }}>{employeeHistoryModal.stats?.totalDays}</p>
                </div>
                <div style={{ background: 'var(--status-present-bg)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--status-present)' }}>Present</span>
                  <p style={{ fontWeight: '700', color: '#34d399' }}>{employeeHistoryModal.stats?.presentDays}</p>
                </div>
                <div style={{ background: 'var(--status-late-bg)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--status-late)' }}>Late</span>
                  <p style={{ fontWeight: '700', color: '#fbbf24' }}>{employeeHistoryModal.stats?.lateDays}</p>
                </div>
                <div style={{ background: 'var(--status-absent-bg)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--status-absent)' }}>Absent</span>
                  <p style={{ fontWeight: '700', color: '#f87171' }}>{employeeHistoryModal.stats?.absentDays}</p>
                </div>
              </div>

              {/* History Table */}
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeHistoryModal.records?.length > 0 ? (
                      employeeHistoryModal.records.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{item.attendance_date}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{item.check_in_time || '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{item.check_out_time || '—'}</td>
                          <td>
                            <span className={`badge ${
                              item.attendance_status === 'Present' ? 'badge-present' :
                              item.attendance_status === 'Absent' ? 'badge-absent' :
                              item.attendance_status === 'Late' ? 'badge-late' : 'badge-halfday'
                            }`}>
                              {item.attendance_status}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{item.notes || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                          No records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEmployeeHistoryModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
