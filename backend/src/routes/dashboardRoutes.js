const express = require('express');
const router = express.Router();
const { getDashboardStats, getDashboardTrends } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

router.get('/stats', authenticateToken, getDashboardStats);
router.get('/trends', authenticateToken, getDashboardTrends);

module.exports = router;
