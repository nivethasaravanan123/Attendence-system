-- ==========================================================
-- Mini Attendance Management System - PostgreSQL Database Schema
-- Technical Assessment for Twite AI Technologies
-- Normalized 3NF Schema with Constraints, FKs, Triggers & Indices
-- ==========================================================

-- Enable UUID extension if needed (optional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------
-- 1. USERS TABLE (Authentication & Role-Based Access)
-- ----------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'Admin' CHECK (role IN ('Admin', 'Manager', 'Employee')),
    full_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on username for fast login lookup
CREATE INDEX idx_users_username ON users(username);

-- ----------------------------------------------------------
-- 2. EMPLOYEES TABLE (Core Employee Master Record)
-- ----------------------------------------------------------
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(30) NOT NULL UNIQUE,
    employee_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    mobile_number VARCHAR(20) NOT NULL,
    department VARCHAR(50) NOT NULL,
    designation VARCHAR(60) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid search, filtering, and sorting
CREATE INDEX idx_employees_emp_id ON employees(employee_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_name ON employees(employee_name);

-- ----------------------------------------------------------
-- 3. ATTENDANCE TABLE (Daily Attendance Transactions)
-- ----------------------------------------------------------
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(30) NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIME WITHOUT TIME ZONE,
    check_out_time TIME WITHOUT TIME ZONE,
    attendance_status VARCHAR(20) NOT NULL CHECK (attendance_status IN ('Present', 'Absent', 'Late', 'Half-Day')),
    notes VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key to employees table
    CONSTRAINT fk_attendance_employee 
        FOREIGN KEY (employee_id) 
        REFERENCES employees(employee_id) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,

    -- Unique composite constraint: one attendance entry per employee per date
    CONSTRAINT uq_employee_attendance_date 
        UNIQUE (employee_id, attendance_date)
);

-- Indices for high-frequency queries
CREATE INDEX idx_attendance_emp_date ON attendance(employee_id, attendance_date);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_status ON attendance(attendance_status);

-- ----------------------------------------------------------
-- 4. AUTOMATIC AUDIT TIMESTAMP TRIGGER (PostgreSQL)
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
