const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendanceRecords,
  getAttendanceSummary,
  getEmployeeAttendanceHistory,
  exportAttendanceCSV
} = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/auth');

// All attendance routes are secured with JWT
router.use(authenticateToken);

router.post('/', markAttendance);
router.get('/', getAttendanceRecords);
router.get('/summary', getAttendanceSummary);
router.get('/export', exportAttendanceCSV);
router.get('/employee/:employeeId', getEmployeeAttendanceHistory);

module.exports = router;
