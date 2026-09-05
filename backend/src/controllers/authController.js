const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryGet, queryAll } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const user = await queryGet('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact the administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name || 'System Administrator',
      email: `${user.username}@twiteai.com`,
      department: 'Operations & IT / Executive Office',
      designation: 'Principal System Administrator',
      employeeId: 'ADM-001'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name || 'System Administrator',
        email: `${user.username}@twiteai.com`,
        department: 'Operations & IT / Executive Office',
        designation: 'Principal System Administrator',
        employeeId: 'ADM-001',
        isActive: Boolean(user.is_active),
        createdAt: user.created_at,
        lastLogin: new Date().toISOString(),
        permissions: [
          'Full Administrative Access',
          'Employee Record Management',
          'Attendance Logging & Overrides',
          'Data Analytics & Metrics',
          'CSV & Excel Audit Export'
        ]
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await queryGet(
      'SELECT id, username, role, full_name, is_active, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name || 'System Administrator',
        email: `${user.username}@twiteai.com`,
        department: 'Operations & IT / Executive Office',
        designation: 'Principal System Administrator',
        employeeId: 'ADM-001',
        isActive: Boolean(user.is_active),
        createdAt: user.created_at,
        lastLogin: new Date().toISOString(),
        permissions: [
          'Full Administrative Access',
          'Employee Record Management',
          'Attendance Logging & Overrides',
          'Data Analytics & Metrics',
          'CSV & Excel Audit Export'
        ]
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.'
    });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    
    // In this basic version, we just update full_name in users table
    // (We aren't using email in the users table currently, but we could add it or just ignore it)
    await queryRun(
      'UPDATE users SET full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [fullName || null, req.user.id]
    );

    const user = await queryGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name || 'System Administrator',
        email: email || `${user.username}@twiteai.com`,
        department: 'Operations & IT / Executive Office',
        designation: 'Principal System Administrator',
        employeeId: 'ADM-001',
        isActive: Boolean(user.is_active)
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.'
    });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    const user = await queryGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await queryRun('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashed, req.user.id]);

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
  changePassword
};
