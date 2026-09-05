const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments
} = require('../controllers/employeeController');
const { authenticateToken } = require('../middleware/auth');

// All employee routes are secured with JWT
router.use(authenticateToken);

router.get('/', getEmployees);
router.get('/departments', getDepartments);
router.get('/:id', getEmployeeById);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;
