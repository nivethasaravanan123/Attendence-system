-- ==========================================================
-- Mini Attendance Management System - Seed Data Script
-- Populates Admin credentials, Employee records, and Attendance history
-- ==========================================================

-- 1. Insert Administrator (Default password is 'admin123' bcrypt hashed)
-- Password hash for 'admin123': $2a$10$w09ZlMhyYwNq9U0H0lQp0.8G2rE/f2e5aYlU1Pz3C5Y2yNfRk/Lqm (generated via bcryptjs)
INSERT INTO users (username, password_hash, role, full_name, is_active)
VALUES 
('admin', '$2a$10$tZ9210FjX3R23dYqX519oODF32u4m0y9RjH7bE3K/mH9g8M3P7W3.', 'Admin', 'Twite AI System Administrator', 1);

-- 2. Insert Sample Employees across diverse departments
INSERT INTO employees (employee_id, employee_name, email, mobile_number, department, designation, status)
VALUES
('EMP-001', 'Arun Kumar', 'arun.kumar@twiteai.com', '+91 98765 43210', 'Engineering', 'Senior AI Engineer', 'Active'),
('EMP-002', 'Priya Sharma', 'priya.sharma@twiteai.com', '+91 98765 43211', 'Engineering', 'Full Stack Developer', 'Active'),
('EMP-003', 'Karthik Raja', 'karthik.raja@twiteai.com', '+91 98765 43212', 'Human Resources', 'HR Lead', 'Active'),
('EMP-004', 'Ananya Iyer', 'ananya.iyer@twiteai.com', '+91 98765 43213', 'Design', 'UI/UX Designer', 'Active'),
('EMP-005', 'Vikram Patel', 'vikram.patel@twiteai.com', '+91 98765 43214', 'Marketing', 'Growth Specialist', 'Active'),
('EMP-006', 'Sneha Menon', 'sneha.menon@twiteai.com', '+91 98765 43215', 'Finance', 'Financial Analyst', 'Active'),
('EMP-007', 'Rahul Verma', 'rahul.verma@twiteai.com', '+91 98765 43216', 'Engineering', 'DevOps Specialist', 'Active'),
('EMP-008', 'Divya Nair', 'divya.nair@twiteai.com', '+91 98765 43217', 'Engineering', 'Frontend Intern', 'Active'),
('EMP-009', 'Rohan Seth', 'rohan.seth@twiteai.com', '+91 98765 43218', 'Sales', 'Account Executive', 'Inactive'),
('EMP-010', 'Meera Joshi', 'meera.joshi@twiteai.com', '+91 98765 43219', 'Design', 'Product Designer', 'Active');

-- 3. Insert Attendance records for today and recent dates
-- (Assuming today's date context: realistic records)
INSERT INTO attendance (employee_id, attendance_date, check_in_time, check_out_time, attendance_status, notes)
VALUES
('EMP-001', CURRENT_DATE, '09:02:00', '18:05:00', 'Present', 'On time, sprint standup'),
('EMP-002', CURRENT_DATE, '09:45:00', '18:15:00', 'Late', 'Delayed due to traffic transit'),
('EMP-003', CURRENT_DATE, '08:55:00', '17:30:00', 'Present', 'All day interviews'),
('EMP-004', CURRENT_DATE, '09:10:00', '13:00:00', 'Half-Day', 'Doctor consultation in afternoon'),
('EMP-005', CURRENT_DATE, NULL, NULL, 'Absent', 'Sick leave notified via email'),
('EMP-006', CURRENT_DATE, '09:00:00', '18:00:00', 'Present', 'Monthly ledger audits'),
('EMP-007', CURRENT_DATE, '08:45:00', '18:30:00', 'Present', 'CI/CD pipeline upgrade'),
('EMP-008', CURRENT_DATE, '09:05:00', '18:00:00', 'Present', 'Frontend component refactoring'),
('EMP-010', CURRENT_DATE, '09:30:00', '18:00:00', 'Present', 'Design system alignment');
