const { queryRun, queryGet, queryAll } = require('../config/db');

// GET /api/employees
// Supports: search, department, status, sortBy, sortOrder, page, limit
const getEmployees = async (req, res) => {
  try {
    const {
      search = '',
      department = '',
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
      all = 'false'
    } = req.query;

    const allowedSortFields = ['employee_id', 'employee_name', 'department', 'designation', 'status', 'created_at'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let conditions = [];
    let params = [];

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push('(employee_name LIKE ? OR employee_id LIKE ? OR email LIKE ? OR designation LIKE ?)');
      params.push(term, term, term, term);
    }

    if (department.trim() && department !== 'All') {
      conditions.push('department = ?');
      params.push(department.trim());
    }

    if (status.trim() && status !== 'All') {
      conditions.push('status = ?');
      params.push(status.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching records
    const countSql = `SELECT COUNT(*) as total FROM employees ${whereClause}`;
    const countResult = await queryGet(countSql, params);
    const total = countResult ? countResult.total : 0;

    let employees;
    if (all === 'true') {
      const querySql = `SELECT * FROM employees ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder}`;
      employees = await queryAll(querySql, params);
      return res.status(200).json({
        success: true,
        data: employees,
        total: employees.length
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const querySql = `
      SELECT * FROM employees 
      ${whereClause} 
      ORDER BY ${safeSortBy} ${safeSortOrder} 
      LIMIT ? OFFSET ?
    `;
    const queryParams = [...params, limitNum, offset];
    employees = await queryAll(querySql, queryParams);

    return res.status(200).json({
      success: true,
      data: employees,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employees.'
    });
  }
};

// GET /api/employees/:id
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    // Allow lookup by primary key id or employee_id string
    const employee = await queryGet(
      'SELECT * FROM employees WHERE id = ? OR employee_id = ?',
      [id, id]
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.'
      });
    }

    // Fetch recent 10 attendance records for this employee
    const recentAttendance = await queryAll(
      `SELECT * FROM attendance 
       WHERE employee_id = ? 
       ORDER BY attendance_date DESC 
       LIMIT 10`,
      [employee.employee_id]
    );

    // Compute basic employee statistics
    const stats = await queryGet(
      `SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN attendance_status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN attendance_status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN attendance_status = 'Late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN attendance_status = 'Half-Day' THEN 1 ELSE 0 END) as half_days
       FROM attendance WHERE employee_id = ?`,
      [employee.employee_id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...employee,
        stats: {
          totalDays: stats?.total_days || 0,
          presentDays: stats?.present_days || 0,
          absentDays: stats?.absent_days || 0,
          lateDays: stats?.late_days || 0,
          halfDays: stats?.half_days || 0
        },
        recentAttendance
      }
    });
  } catch (error) {
    console.error('Error fetching employee by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee details.'
    });
  }
};

// POST /api/employees
const createEmployee = async (req, res) => {
  try {
    const {
      employee_id,
      employee_name,
      email,
      mobile_number,
      department,
      designation,
      status = 'Active'
    } = req.body;

    // Required fields validation
    if (!employee_id || !employee_name || !email || !mobile_number || !department || !designation) {
      return res.status(400).json({
        success: false,
        message: 'All fields (Employee ID, Name, Email, Mobile Number, Department, Designation) are required.'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format.'
      });
    }

    // Check unique employee_id
    const existingId = await queryGet('SELECT id FROM employees WHERE employee_id = ?', [employee_id.trim()]);
    if (existingId) {
      return res.status(409).json({
        success: false,
        message: `Employee ID '${employee_id.trim()}' is already in use.`
      });
    }

    // Check unique email
    const existingEmail = await queryGet('SELECT id FROM employees WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: `Email address '${email.trim().toLowerCase()}' is already registered.`
      });
    }

    const insertResult = await queryRun(
      `INSERT INTO employees (employee_id, employee_name, email, mobile_number, department, designation, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_id.trim(),
        employee_name.trim(),
        email.trim().toLowerCase(),
        mobile_number.trim(),
        department.trim(),
        designation.trim(),
        status === 'Inactive' ? 'Inactive' : 'Active'
      ]
    );

    const newEmployee = await queryGet('SELECT * FROM employees WHERE id = ?', [insertResult.lastID]);

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: newEmployee
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating employee.'
    });
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employee_id,
      employee_name,
      email,
      mobile_number,
      department,
      designation,
      status
    } = req.body;

    const existing = await queryGet('SELECT * FROM employees WHERE id = ? OR employee_id = ?', [id, id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.'
      });
    }

    // Check duplicate employee_id if changing
    if (employee_id && employee_id.trim() !== existing.employee_id) {
      const duplicateId = await queryGet(
        'SELECT id FROM employees WHERE employee_id = ? AND id != ?',
        [employee_id.trim(), existing.id]
      );
      if (duplicateId) {
        return res.status(409).json({
          success: false,
          message: `Employee ID '${employee_id.trim()}' is already taken.`
        });
      }
    }

    // Check duplicate email if changing
    if (email && email.trim().toLowerCase() !== existing.email.toLowerCase()) {
      const duplicateEmail = await queryGet(
        'SELECT id FROM employees WHERE email = ? AND id != ?',
        [email.trim().toLowerCase(), existing.id]
      );
      if (duplicateEmail) {
        return res.status(409).json({
          success: false,
          message: `Email address '${email.trim().toLowerCase()}' is already in use.`
        });
      }
    }

    const updatedEmpId = employee_id ? employee_id.trim() : existing.employee_id;
    const updatedName = employee_name ? employee_name.trim() : existing.employee_name;
    const updatedEmail = email ? email.trim().toLowerCase() : existing.email;
    const updatedMobile = mobile_number ? mobile_number.trim() : existing.mobile_number;
    const updatedDept = department ? department.trim() : existing.department;
    const updatedDesig = designation ? designation.trim() : existing.designation;
    const updatedStatus = status ? status : existing.status;

    await queryRun(
      `UPDATE employees 
       SET employee_id = ?, employee_name = ?, email = ?, mobile_number = ?, department = ?, designation = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [updatedEmpId, updatedName, updatedEmail, updatedMobile, updatedDept, updatedDesig, updatedStatus, existing.id]
    );

    // If employee_id changed, update attendance foreign key
    if (updatedEmpId !== existing.employee_id) {
      await queryRun(
        'UPDATE attendance SET employee_id = ? WHERE employee_id = ?',
        [updatedEmpId, existing.employee_id]
      );
    }

    const updatedEmployee = await queryGet('SELECT * FROM employees WHERE id = ?', [existing.id]);

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully.',
      data: updatedEmployee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update employee.'
    });
  }
};

// DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await queryGet('SELECT * FROM employees WHERE id = ? OR employee_id = ?', [id, id]);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.'
      });
    }

    // Delete attendance records for this employee
    await queryRun('DELETE FROM attendance WHERE employee_id = ?', [employee.employee_id]);
    // Delete employee
    await queryRun('DELETE FROM employees WHERE id = ?', [employee.id]);

    return res.status(200).json({
      success: true,
      message: `Employee '${employee.employee_name}' (${employee.employee_id}) and associated attendance records deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete employee.'
    });
  }
};

// GET /api/employees/departments
const getDepartments = async (req, res) => {
  try {
    const departments = await queryAll('SELECT DISTINCT department FROM employees ORDER BY department ASC');
    return res.status(200).json({
      success: true,
      data: departments.map((d) => d.department)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve departments.'
    });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments
};
