const { queryGet, queryAll } = require('../config/db');

// GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const today = req.query.date || new Date().toISOString().split('T')[0];

    // Total employees
    const totalEmpRow = await queryGet('SELECT COUNT(*) as total FROM employees');
    const totalEmployees = totalEmpRow ? totalEmpRow.total : 0;

    // Active & Inactive employees
    const activeEmpRow = await queryGet("SELECT COUNT(*) as active FROM employees WHERE status = 'Active'");
    const activeEmployees = activeEmpRow ? activeEmpRow.active : 0;
    const inactiveEmployees = totalEmployees - activeEmployees;

    // Today's attendance numbers
    const attendanceStatsRow = await queryGet(
      `SELECT 
        SUM(CASE WHEN attendance_status = 'Present' THEN 1 ELSE 0 END) as present_today,
        SUM(CASE WHEN attendance_status = 'Absent' THEN 1 ELSE 0 END) as absent_today,
        SUM(CASE WHEN attendance_status = 'Late' THEN 1 ELSE 0 END) as late_today,
        SUM(CASE WHEN attendance_status = 'Half-Day' THEN 1 ELSE 0 END) as half_day_today,
        COUNT(*) as marked_today
       FROM attendance 
       WHERE attendance_date = ?`,
      [today]
    );

    const presentToday = attendanceStatsRow?.present_today || 0;
    const absentToday = attendanceStatsRow?.absent_today || 0;
    const lateToday = attendanceStatsRow?.late_today || 0;
    const halfDayToday = attendanceStatsRow?.half_day_today || 0;
    const markedToday = attendanceStatsRow?.marked_today || 0;

    // Unmarked count (active employees who haven't had attendance marked today)
    const unmarkedToday = Math.max(0, activeEmployees - markedToday);

    // Attendance percentage calculation (Present + Late + 0.5 * HalfDay) / Active Employees * 100
    const effectivePresent = presentToday + lateToday + (halfDayToday * 0.5);
    const attendancePercentage = activeEmployees > 0 
      ? Number(((effectivePresent / activeEmployees) * 100).toFixed(1)) 
      : 0;

    // Department-wise employee count
    const departmentBreakdown = await queryAll(`
      SELECT 
        department, 
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_count
      FROM employees 
      GROUP BY department 
      ORDER BY total_count DESC
    `);

    // Recent 5 attendance events
    const recentActivity = await queryAll(
      `SELECT a.id, a.employee_id, e.employee_name, e.department, a.attendance_date, a.check_in_time, a.attendance_status 
       FROM attendance a 
       JOIN employees e ON a.employee_id = e.employee_id 
       ORDER BY a.updated_at DESC, a.created_at DESC 
       LIMIT 6`
    );

    return res.status(200).json({
      success: true,
      data: {
        date: today,
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        presentToday,
        absentToday,
        lateToday,
        halfDayToday,
        markedToday,
        unmarkedToday,
        attendancePercentage,
        departmentBreakdown,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics.'
    });
  }
};

// GET /api/dashboard/trends
const getDashboardTrends = async (req, res) => {
  try {
    const today = new Date();
    // Generate last 7 days strings
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const startDate = days[0];
    const endDate = days[6];

    // Get all attendance for the last 7 days
    const attendanceRecords = await queryAll(
      `SELECT attendance_date, attendance_status 
       FROM attendance 
       WHERE attendance_date BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    const activeEmpRow = await queryGet("SELECT COUNT(*) as active FROM employees WHERE status = 'Active'");
    const activeEmployees = activeEmpRow ? activeEmpRow.active : 0;

    const trends = days.map(date => {
      const dayRecords = attendanceRecords.filter(r => r.attendance_date === date);
      
      let present = 0, late = 0, halfDay = 0, absent = 0;
      dayRecords.forEach(r => {
        if (r.attendance_status === 'Present') present++;
        else if (r.attendance_status === 'Late') late++;
        else if (r.attendance_status === 'Half-Day') halfDay++;
        else if (r.attendance_status === 'Absent') absent++;
      });
      
      const effectivePresent = present + late + (halfDay * 0.5);
      const attendancePercentage = activeEmployees > 0 
        ? Number(((effectivePresent / activeEmployees) * 100).toFixed(1)) 
        : 0;

      return {
        date,
        present,
        late,
        halfDay,
        absent,
        attendancePercentage
      };
    });

    // Also calculate overall status distribution across the period
    let totalPresent = 0, totalLate = 0, totalHalfDay = 0, totalAbsent = 0;
    attendanceRecords.forEach(r => {
        if (r.attendance_status === 'Present') totalPresent++;
        else if (r.attendance_status === 'Late') totalLate++;
        else if (r.attendance_status === 'Half-Day') totalHalfDay++;
        else if (r.attendance_status === 'Absent') totalAbsent++;
    });

    const statusDistribution = [
      { name: 'Present', value: totalPresent, color: '#10b981' },
      { name: 'Late', value: totalLate, color: '#f59e0b' },
      { name: 'Half-Day', value: totalHalfDay, color: '#38bdf8' },
      { name: 'Absent', value: totalAbsent, color: '#f43f5e' }
    ];

    return res.status(200).json({
      success: true,
      data: {
        trends,
        statusDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard trends:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard trends.'
    });
  }
};

module.exports = {
  getDashboardStats,
  getDashboardTrends
};
