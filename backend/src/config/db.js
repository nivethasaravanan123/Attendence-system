const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../attendance.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Promisified helper methods
const queryRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const queryGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// Initialize schema and seed data
const initDatabase = async () => {
  try {
    // Enable foreign keys
    await queryRun('PRAGMA foreign_keys = ON');

    // 1. Users table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Admin' CHECK(role IN ('Admin', 'Manager', 'Employee')),
        full_name TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Employees table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL UNIQUE,
        employee_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        mobile_number TEXT NOT NULL,
        department TEXT NOT NULL,
        designation TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Attendance table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL,
        attendance_date DATE NOT NULL,
        check_in_time TIME,
        check_out_time TIME,
        attendance_status TEXT NOT NULL CHECK(attendance_status IN ('Present', 'Absent', 'Late', 'Half-Day')),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON UPDATE CASCADE ON DELETE CASCADE,
        UNIQUE (employee_id, attendance_date)
      )
    `);

    // Seed default admin if missing
    const adminUser = await queryGet('SELECT * FROM users WHERE username = ?', ['admin']);
    if (!adminUser) {
      const hashed = await bcrypt.hash('admin123', 10);
      await queryRun(
        `INSERT INTO users (username, password_hash, role, full_name, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        ['admin', hashed, 'Admin', 'Twite AI System Administrator']
      );
      console.log('Seeded default admin account (username: admin, password: admin123)');
    }

    // Seed sample employees if table is empty
    const empCount = await queryGet('SELECT COUNT(*) as count FROM employees');
    if (empCount && empCount.count === 0) {
      const sampleEmployees = [
        ['EMP-001', 'Arun Kumar', 'arun.kumar@twiteai.com', '+91 98765 43210', 'Engineering', 'Senior AI Engineer', 'Active'],
        ['EMP-002', 'Priya Sharma', 'priya.sharma@twiteai.com', '+91 98765 43211', 'Engineering', 'Full Stack Developer', 'Active'],
        ['EMP-003', 'Karthik Raja', 'karthik.raja@twiteai.com', '+91 98765 43212', 'Human Resources', 'HR Lead', 'Active'],
        ['EMP-004', 'Ananya Iyer', 'ananya.iyer@twiteai.com', '+91 98765 43213', 'Design', 'UI/UX Designer', 'Active'],
        ['EMP-005', 'Vikram Patel', 'vikram.patel@twiteai.com', '+91 98765 43214', 'Marketing', 'Growth Specialist', 'Active'],
        ['EMP-006', 'Sneha Menon', 'sneha.menon@twiteai.com', '+91 98765 43215', 'Finance', 'Financial Analyst', 'Active'],
        ['EMP-007', 'Rahul Verma', 'rahul.verma@twiteai.com', '+91 98765 43216', 'Engineering', 'DevOps Specialist', 'Active'],
        ['EMP-008', 'Divya Nair', 'divya.nair@twiteai.com', '+91 98765 43217', 'Engineering', 'Frontend Intern', 'Active'],
        ['EMP-009', 'Rohan Seth', 'rohan.seth@twiteai.com', '+91 98765 43218', 'Sales', 'Account Executive', 'Inactive'],
        ['EMP-010', 'Meera Joshi', 'meera.joshi@twiteai.com', '+91 98765 43219', 'Design', 'Product Designer', 'Active']
      ];

      for (const emp of sampleEmployees) {
        await queryRun(
          `INSERT INTO employees (employee_id, employee_name, email, mobile_number, department, designation, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          emp
        );
      }
      console.log('Seeded 10 sample employees.');

      // Seed today's and yesterday's attendance
      const today = new Date().toISOString().split('T')[0];
      const yesterdayObj = new Date();
      yesterdayObj.setDate(yesterdayObj.getDate() - 1);
      const yesterday = yesterdayObj.toISOString().split('T')[0];

      const sampleAttendance = [
        ['EMP-001', today, '09:02:00', '18:05:00', 'Present', 'On time, sprint standup'],
        ['EMP-002', today, '09:45:00', '18:15:00', 'Late', 'Delayed due to traffic transit'],
        ['EMP-003', today, '08:55:00', '17:30:00', 'Present', 'Interviews schedule'],
        ['EMP-004', today, '09:10:00', '13:00:00', 'Half-Day', 'Medical checkup in afternoon'],
        ['EMP-005', today, null, null, 'Absent', 'Sick leave notified via email'],
        ['EMP-006', today, '09:00:00', '18:00:00', 'Present', 'Monthly ledger audits'],
        ['EMP-007', today, '08:45:00', '18:30:00', 'Present', 'CI/CD pipeline upgrade'],
        ['EMP-008', today, '09:05:00', '18:00:00', 'Present', 'Component tests'],
        ['EMP-010', today, '09:30:00', '18:00:00', 'Present', 'Design system alignment'],
        // Yesterday records
        ['EMP-001', yesterday, '09:00:00', '18:00:00', 'Present', 'Standard shift'],
        ['EMP-002', yesterday, '09:05:00', '18:10:00', 'Present', 'Standard shift'],
        ['EMP-003', yesterday, '08:50:00', '17:30:00', 'Present', 'HR onboarding session'],
        ['EMP-004', yesterday, '09:15:00', '18:00:00', 'Present', 'Figma prototypes review'],
        ['EMP-005', yesterday, '09:00:00', '18:00:00', 'Present', 'Campaign launch']
      ];

      for (const att of sampleAttendance) {
        await queryRun(
          `INSERT OR IGNORE INTO attendance (employee_id, attendance_date, check_in_time, check_out_time, attendance_status, notes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          att
        );
      }
      console.log('Seeded sample attendance records.');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

module.exports = {
  db,
  queryRun,
  queryGet,
  queryAll,
  initDatabase
};
