const { queryRun, queryGet, queryAll } = require('../config/db');

// POST /api/attendance - Mark or Update Attendance
const markAttendance = async (req, res) => {
  try {
    const {
      employee_id,
      attendance_date,
      check_in_time,
      check_out_time,
      attendance_status,
      notes = ''
    } = req.body;

    if (!employee_id || !attendance_date || !attendance_status) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, Attendance Date, and Attendance Status are required.'
      });
    }

    const validStatuses = ['Present', 'Absent', 'Late', 'Half-Day'];
    if (!validStatuses.includes(attendance_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid attendance status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Verify employee exists
    const employee = await queryGet('SELECT * FROM employees WHERE employee_id = ?', [employee_id.trim()]);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID '${employee_id}' does not exist.`
      });
    }

    // Check if attendance already marked for this date
    const existing = await queryGet(
      'SELECT id FROM attendance WHERE employee_id = ? AND attendance_date = ?',
      [employee_id.trim(), attendance_date.trim()]
    );

    if (existing) {
      // Update existing record
      await queryRun(
        `UPDATE attendance 
         SET check_in_time = ?, check_out_time = ?, attendance_status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [check_in_time || null, check_out_time || null, attendance_status, notes ? notes.trim() : null, existing.id]
      );

      const updated = await queryGet(
        `SELECT a.*, e.employee_name, e.department, e.designation 
         FROM attendance a 
         JOIN employees e ON a.employee_id = e.employee_id 
         WHERE a.id = ?`,
        [existing.id]
      );

      return res.status(200).json({
        success: true,
        message: 'Attendance record updated successfully.',
        data: updated
      });
    } else {
      // Insert new record
      const insertResult = await queryRun(
        `INSERT INTO attendance (employee_id, attendance_date, check_in_time, check_out_time, attendance_status, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          employee_id.trim(),
          attendance_date.trim(),
          check_in_time || null,
          check_out_time || null,
          attendance_status,
          notes ? notes.trim() : null
        ]
      );

      const created = await queryGet(
        `SELECT a.*, e.employee_name, e.department, e.designation 
         FROM attendance a 
         JOIN employees e ON a.employee_id = e.employee_id 
         WHERE a.id = ?`,
        [insertResult.lastID]
      );

      return res.status(201).json({
        success: true,
        message: 'Attendance marked successfully.',
        data: created
      });
    }
  } catch (error) {
    console.error('Error marking attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark attendance.'
    });
  }
};

// GET /api/attendance - List attendance records with filtering and pagination
const getAttendanceRecords = async (req, res) => {
  try {
    const {
      date = '',
      startDate = '',
      endDate = '',
      employee_id = '',
      department = '',
      status = '',
      search = '',
      page = 1,
      limit = 10,
      all = 'false'
    } = req.query;

    let conditions = [];
    let params = [];

    if (date.trim()) {
      conditions.push('a.attendance_date = ?');
      params.push(date.trim());
    } else if (startDate.trim() && endDate.trim()) {
      conditions.push('a.attendance_date BETWEEN ? AND ?');
      params.push(startDate.trim(), endDate.trim());
    }

    if (employee_id.trim()) {
      conditions.push('a.employee_id = ?');
      params.push(employee_id.trim());
    }

    if (department.trim() && department !== 'All') {
      conditions.push('e.department = ?');
      params.push(department.trim());
    }

    if (status.trim() && status !== 'All') {
      conditions.push('a.attendance_status = ?');
      params.push(status.trim());
    }

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push('(e.employee_name LIKE ? OR a.employee_id LIKE ?)');
      params.push(term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total 
      FROM attendance a 
      JOIN employees e ON a.employee_id = e.employee_id 
      ${whereClause}
    `;
    const countRes = await queryGet(countSql, params);
    const total = countRes ? countRes.total : 0;

    const baseQuery = `
      SELECT a.*, e.employee_name, e.department, e.designation, e.email 
      FROM attendance a 
      JOIN employees e ON a.employee_id = e.employee_id 
      ${whereClause} 
      ORDER BY a.attendance_date DESC, a.check_in_time ASC
    `;

    if (all === 'true') {
      const records = await queryAll(baseQuery, params);
      return res.status(200).json({
        success: true,
        data: records,
        total: records.length
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const pagedSql = `${baseQuery} LIMIT ? OFFSET ?`;
    const records = await queryAll(pagedSql, [...params, limitNum, offset]);

    return res.status(200).json({
      success: true,
      data: records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve attendance records.'
    });
  }
};

// GET /api/attendance/summary - Summary statistics for today or selected date
const getAttendanceSummary = async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const totalActiveEmpRes = await queryGet("SELECT COUNT(*) as count FROM employees WHERE status = 'Active'");
    const totalActiveEmployees = totalActiveEmpRes ? totalActiveEmpRes.count : 0;

    const statsSql = `
      SELECT 
        COUNT(*) as total_marked,
        SUM(CASE WHEN attendance_status = 'Present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN attendance_status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN attendance_status = 'Late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN attendance_status = 'Half-Day' THEN 1 ELSE 0 END) as half_day_count
      FROM attendance 
      WHERE attendance_date = ?
    `;
    const summary = await queryGet(statsSql, [date]);

    const present = summary?.present_count || 0;
    const absent = summary?.absent_count || 0;
    const late = summary?.late_count || 0;
    const halfDay = summary?.half_day_count || 0;
    const marked = summary?.total_marked || 0;

    // Effective present count (Present + Late + 0.5 * HalfDay) or strict present
    const effectivePresent = present + late + (halfDay * 0.5);
    const attendancePercentage = totalActiveEmployees > 0 
      ? Number(((effectivePresent / totalActiveEmployees) * 100).toFixed(1)) 
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        date,
        totalActiveEmployees,
        totalMarked: marked,
        presentCount: present,
        absentCount: absent,
        lateCount: late,
        halfDayCount: halfDay,
        attendancePercentage
      }
    });
  } catch (error) {
    console.error('Error getting attendance summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate attendance summary.'
    });
  }
};

// GET /api/attendance/employee/:employeeId - History for an individual employee
const getEmployeeAttendanceHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await queryGet('SELECT * FROM employees WHERE employee_id = ? OR id = ?', [employeeId, employeeId]);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found.'
      });
    }

    const records = await queryAll(
      `SELECT * FROM attendance 
       WHERE employee_id = ? 
       ORDER BY attendance_date DESC`,
      [employee.employee_id]
    );

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

    const totalDays = stats?.total_days || 0;
    const presentDays = stats?.present_days || 0;
    const lateDays = stats?.late_days || 0;
    const rate = totalDays > 0 ? Number((((presentDays + lateDays) / totalDays) * 100).toFixed(1)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        employee,
        stats: {
          totalDays,
          presentDays,
          absentDays: stats?.absent_days || 0,
          lateDays,
          halfDays: stats?.half_days || 0,
          attendanceRate: rate
        },
        records
      }
    });
  } catch (error) {
    console.error('Error fetching employee attendance history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employee attendance history.'
    });
  }
};

// GET /api/attendance/export - Stream CSV Export
const exportAttendanceCSV = async (req, res) => {
  try {
    const { date, startDate, endDate, department, status } = req.query;

    let conditions = [];
    let params = [];

    if (date) {
      conditions.push('a.attendance_date = ?');
      params.push(date);
    } else if (startDate && endDate) {
      conditions.push('a.attendance_date BETWEEN ? AND ?');
      params.push(startDate, endDate);
    }

    if (department && department !== 'All') {
      conditions.push('e.department = ?');
      params.push(department);
    }

    if (status && status !== 'All') {
      conditions.push('a.attendance_status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const records = await queryAll(
      `SELECT 
        a.attendance_date,
        a.employee_id,
        e.employee_name,
        e.department,
        e.designation,
        a.attendance_status,
        COALESCE(a.check_in_time, 'N/A') as check_in_time,
        COALESCE(a.check_out_time, 'N/A') as check_out_time,
        COALESCE(a.notes, '') as notes
       FROM attendance a 
       JOIN employees e ON a.employee_id = e.employee_id 
       ${whereClause} 
       ORDER BY a.attendance_date DESC, e.department ASC, e.employee_name ASC`,
      params
    );

    // Build CSV content
    const headers = ['Date', 'Employee ID', 'Employee Name', 'Department', 'Designation', 'Status', 'Check-In', 'Check-Out', 'Notes'];
    const csvRows = [headers.join(',')];

    for (const r of records) {
      const row = [
        `"${r.attendance_date}"`,
        `"${r.employee_id}"`,
        `"${r.employee_name.replace(/"/g, '""')}"`,
        `"${r.department}"`,
        `"${r.designation}"`,
        `"${r.attendance_status}"`,
        `"${r.check_in_time}"`,
        `"${r.check_out_time}"`,
        `"${r.notes.replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    }

    const csvData = csvRows.join('\r\n');
    const filename = `attendance_report_${date || 'all'}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvData);
  } catch (error) {
    console.error('Error exporting attendance CSV:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export attendance records.'
    });
  }
};

module.exports = {
  markAttendance,
  getAttendanceRecords,
  getAttendanceSummary,
  getEmployeeAttendanceHistory,
  exportAttendanceCSV
};
