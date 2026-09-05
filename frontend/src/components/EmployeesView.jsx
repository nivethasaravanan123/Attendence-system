import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X,
  Building,
  Mail,
  Phone,
  Briefcase
} from 'lucide-react';
import { apiRequest } from '../api/client';

export default function EmployeesView({ onNotify }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  // Filter, Search, Pagination & Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewEmployeeModal, setViewEmployeeModal] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);

  // Add/Edit Form State
  const [formData, setFormData] = useState({
    employee_id: '',
    employee_name: '',
    email: '',
    mobile_number: '',
    department: 'Engineering',
    designation: '',
    status: 'Active'
  });
  const [formError, setFormError] = useState('');

  // Fetch departments list
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

  // Fetch employees with all filters
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        department: selectedDept,
        status: selectedStatus,
        sortBy,
        sortOrder
      });

      const res = await apiRequest(`/employees?${params.toString()}`);
      if (res.success) {
        setEmployees(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to fetch employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, selectedDept, selectedStatus, sortBy, sortOrder]);

  // Handle Search submit / debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEmployees();
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormData({
      employee_id: `EMP-0${Math.floor(100 + Math.random() * 900)}`,
      employee_name: '',
      email: '',
      mobile_number: '+91 ',
      department: departments[0] || 'Engineering',
      designation: '',
      status: 'Active'
    });
    setFormError('');
    setIsAddEditOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      employee_id: emp.employee_id,
      employee_name: emp.employee_name,
      email: emp.email,
      mobile_number: emp.mobile_number,
      department: emp.department,
      designation: emp.designation,
      status: emp.status
    });
    setFormError('');
    setIsAddEditOpen(true);
  };

  // View Details Modal
  const handleOpenView = async (emp) => {
    try {
      const res = await apiRequest(`/employees/${emp.id}`);
      if (res.success) {
        setViewEmployeeModal(res.data);
      }
    } catch (err) {
      onNotify?.('Failed to load employee details', 'error');
    }
  };

  // Submit Add / Edit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (editingEmployee) {
        // Update
        const res = await apiRequest(`/employees/${editingEmployee.id}`, {
          method: 'PUT',
          body: formData
        });
        if (res.success) {
          onNotify?.('Employee updated successfully', 'success');
          setIsAddEditOpen(false);
          fetchEmployees();
          fetchDepartments();
        }
      } else {
        // Create
        const res = await apiRequest('/employees', {
          method: 'POST',
          body: formData
        });
        if (res.success) {
          onNotify?.('Employee added successfully', 'success');
          setIsAddEditOpen(false);
          fetchEmployees();
          fetchDepartments();
        }
      }
    } catch (err) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmModal) return;
    try {
      const res = await apiRequest(`/employees/${deleteConfirmModal.id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        onNotify?.(res.message || 'Employee deleted successfully', 'success');
        setDeleteConfirmModal(null);
        fetchEmployees();
        fetchDepartments();
      }
    } catch (err) {
      onNotify?.(err.message || 'Failed to delete employee', 'error');
    }
  };

  return (
    <div>
      {/* Header and Add Button */}
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
            Employee Management
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            Maintain full employee profiles, statuses, and departmental assignments.
          </p>
        </div>

        <button
          id="add-employee-btn"
          className="btn btn-primary"
          onClick={handleOpenCreate}
        >
          <UserPlus size={18} />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Toolbar: Search, Filters (Department & Status), and Sort */}
      <div className="toolbar card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            id="employee-search-input"
            type="text"
            className="form-control search-input"
            placeholder="Search by name, ID, email, role..."
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
              id="department-filter"
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

          {/* Employee Status Filter (Round 2 Defense Item) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
            <select
              id="status-filter"
              className="form-control"
              style={{ width: 'auto', padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Sort Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowUpDown size={15} color="var(--text-muted)" />
            <select
              id="sort-select"
              className="form-control"
              style={{ width: 'auto', padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split('-');
                setSortBy(f);
                setSortOrder(o);
              }}
            >
              <option value="created_at-DESC">Newest First</option>
              <option value="created_at-ASC">Oldest First</option>
              <option value="employee_name-ASC">Name (A-Z)</option>
              <option value="employee_name-DESC">Name (Z-A)</option>
              <option value="employee_id-ASC">Employee ID (Asc)</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchTerm('');
              setSelectedDept('All');
              setSelectedStatus('All');
              setSortBy('created_at');
              setSortOrder('DESC');
              setCurrentPage(1);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Employees Data Table */}
      <div className="table-container">
        <table className="custom-table" id="employees-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name & Designation</th>
              <th>Department</th>
              <th>Contact Info</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading employee records...
                </td>
              </tr>
            ) : employees.length > 0 ? (
              employees.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--accent-secondary)' }}>
                    {emp.employee_id}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar">
                        {emp.employee_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{emp.employee_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.designation}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-dept">{emp.department}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>
                      <div style={{ color: 'var(--text-primary)' }}>{emp.email}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{emp.mobile_number}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${emp.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary btn-icon"
                        title="View Details"
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => handleOpenView(emp)}
                      >
                        <Eye size={15} color="#06b6d4" />
                      </button>
                      <button
                        className="btn btn-secondary btn-icon"
                        title="Edit Employee"
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => handleOpenEdit(emp)}
                      >
                        <Edit3 size={15} color="#818cf8" />
                      </button>
                      <button
                        className="btn btn-secondary btn-icon"
                        title="Delete Employee"
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => setDeleteConfirmModal(emp)}
                      >
                        <Trash2 size={15} color="#f87171" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No employees matched your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
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
            Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} employees
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

      {/* Add / Edit Employee Modal */}
      {isAddEditOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingEmployee ? 'Edit Employee Details' : 'Add New Employee'}</h3>
              <button
                className="btn btn-secondary btn-icon"
                style={{ width: '30px', height: '30px' }}
                onClick={() => setIsAddEditOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.84rem',
                    marginBottom: '1rem'
                  }}>
                    {formError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Employee ID *</label>
                    <input
                      id="form-emp-id"
                      type="text"
                      className="form-control"
                      placeholder="e.g. EMP-101"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      id="form-emp-name"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Jane Doe"
                      value={formData.employee_name}
                      onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      id="form-emp-email"
                      type="email"
                      className="form-control"
                      placeholder="jane.doe@twiteai.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      id="form-emp-mobile"
                      type="tel"
                      className="form-control"
                      placeholder="+91 98765 43210"
                      value={formData.mobile_number}
                      onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Department *</label>
                    <input
                      id="form-emp-dept"
                      type="text"
                      className="form-control"
                      placeholder="Engineering, Design, HR..."
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Designation *</label>
                    <input
                      id="form-emp-desig"
                      type="text"
                      className="form-control"
                      placeholder="Software Engineer"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Employee Status</label>
                  <select
                    id="form-emp-status"
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active (Eligible for Attendance)</option>
                    <option value="Inactive">Inactive (On Leave / Resigned)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddEditOpen(false)}
                >
                  Cancel
                </button>
                <button
                  id="submit-employee-btn"
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingEmployee ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employee Details Modal */}
      {viewEmployeeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Employee Dossier</h3>
              <button
                className="btn btn-secondary btn-icon"
                style={{ width: '30px', height: '30px' }}
                onClick={() => setViewEmployeeModal(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {/* Profile Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="avatar" style={{ width: '56px', height: '56px', fontSize: '1.2rem' }}>
                  {viewEmployeeModal.employee_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '800' }}>
                    {viewEmployeeModal.employee_name}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>
                      {viewEmployeeModal.employee_id}
                    </span>
                    <span className={`badge ${viewEmployeeModal.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                      {viewEmployeeModal.status}
                    </span>
                    <span className="badge badge-dept">{viewEmployeeModal.department}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Email Address:</span>
                  <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{viewEmployeeModal.email}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Mobile Number:</span>
                  <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{viewEmployeeModal.mobile_number}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Designation:</span>
                  <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{viewEmployeeModal.designation}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Member Since:</span>
                  <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{viewEmployeeModal.created_at?.split(' ')[0] || 'Recently'}</p>
                </div>
              </div>

              {/* Attendance Stats for this employee */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                Attendance Track Record
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                textAlign: 'center'
              }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Tracked</span>
                  <p style={{ fontSize: '1.2rem', fontWeight: '800' }}>{viewEmployeeModal.stats?.totalDays || 0}</p>
                </div>
                <div style={{ background: 'var(--status-present-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--status-present)' }}>Present</span>
                  <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#34d399' }}>{viewEmployeeModal.stats?.presentDays || 0}</p>
                </div>
                <div style={{ background: 'var(--status-late-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--status-late)' }}>Late</span>
                  <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fbbf24' }}>{viewEmployeeModal.stats?.lateDays || 0}</p>
                </div>
                <div style={{ background: 'var(--status-absent-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--status-absent)' }}>Absent</span>
                  <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f87171' }}>{viewEmployeeModal.stats?.absentDays || 0}</p>
                </div>
              </div>

              {/* Recent Attendance Entries */}
              <h5 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Recent Logs
              </h5>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {viewEmployeeModal.recentAttendance?.length > 0 ? (
                  <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Check-In</th>
                        <th>Check-Out</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewEmployeeModal.recentAttendance.map((a) => (
                        <tr key={a.id}>
                          <td>{a.attendance_date}</td>
                          <td>{a.check_in_time || '—'}</td>
                          <td>{a.check_out_time || '—'}</td>
                          <td>
                            <span className={`badge ${
                              a.attendance_status === 'Present' ? 'badge-present' :
                              a.attendance_status === 'Absent' ? 'badge-absent' :
                              a.attendance_status === 'Late' ? 'badge-late' : 'badge-halfday'
                            }`}>
                              {a.attendance_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No attendance records found.</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewEmployeeModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ color: '#f87171' }}>Confirm Removal</h3>
              <button
                className="btn btn-secondary btn-icon"
                style={{ width: '30px', height: '30px' }}
                onClick={() => setDeleteConfirmModal(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Are you sure you want to delete employee <strong>{deleteConfirmModal.employee_name}</strong> (<code>{deleteConfirmModal.employee_id}</code>)?
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                This will delete the employee master record and all associated historical attendance entries.
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmModal(null)}>
                Cancel
              </button>
              <button
                id="confirm-delete-btn"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
              >
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
