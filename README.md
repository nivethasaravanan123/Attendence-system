# Mini Attendance Management System

A production-grade, full-stack Attendance & Workforce Tracking web application developed for the **Twite AI Technologies** Software Engineer Technical Assessment.

---

## 🌟 Key Highlights & Assessment Modules

| Assessment Module | Implementation Details | Status |
| :--- | :--- | :--- |
| **Module 1: Authentication** | JWT Bearer Authentication, bcrypt password hashing, session persistence, role authorization, quick-fill demo credentials. | ✅ Implemented |
| **Module 2: Employee Management** | Complete CRUD, Employee ID, Contact info, Department, Designation, Status (`Active`/`Inactive`), Live Search, Department & Status filtering, Sorting, Pagination. | ✅ Implemented |
| **Module 3: Attendance Tracking** | Daily Attendance Marking (Check-In, Check-Out, Status: `Present`, `Absent`, `Late`, `Half-Day`, Notes), Duplicate prevention per date, Date picker, Employee history modal. | ✅ Implemented |
| **Module 4: Dashboard** | KPI metric counters (Total, Active, Present, Absent, Late, Half-Day), Live Attendance Rate % gauge, Department-wise distribution breakdown, Recent activity stream. | ✅ Implemented |
| **Bonus Features** | OpenAPI / Swagger 3.0 Documentation (`/api/docs`), CSV Export (`/api/attendance/export`), Docker & Docker Compose setup, Postman Collection, Pure CSS design system. | ✅ Implemented |
| **Round 2 Interview Enhancements** | Dedicated architecture & implementation for all 4 live enhancement tasks: Department Filter, Attendance Percentage, Employee Status Filter, CSV Export. | ✅ Implemented |

---

## 🏗️ Architecture & Technology Stack

```
                                  ┌────────────────────────┐
                                  │      Web Browser       │
                                  │   (React.js + Vite)    │
                                  └───────────┬────────────┘
                                              │ HTTP / JSON
                                              │ (JWT Bearer)
                                              ▼
                                  ┌────────────────────────┐
                                  │    Express REST API    │
                                  │      (Node.js 20)      │
                                  └─────┬────────────┬─────┘
                                        │            │
                         ┌──────────────┘            └─────────────┐
                         ▼                                         ▼
           ┌───────────────────────────┐             ┌───────────────────────────┐
           │      Database Layer       │             │       Documentation       │
           │  • SQLite (Zero-config)   │             │   • Swagger UI (/api/docs)│
           │  • PostgreSQL (.sql)      │             │   • CSV Export Engine     │
           │  • MySQL (.sql)           │             │   • Postman Collection    │
           └───────────────────────────┘             └───────────────────────────┘
```

- **Frontend**: React 18, Vite, Lucide-React icons, Custom Dark Mode glassmorphic CSS design system, fully responsive.
- **Backend**: Node.js, Express.js, `jsonwebtoken` (JWT), `bcryptjs`, RESTful controller/route architecture, CORS enabled.
- **Database**:
  - Normalized 3NF Schema (`users`, `employees`, `attendance`).
  - Production scripts: `database/schema-postgres.sql` and `database/schema-mysql.sql`.
  - Zero-configuration local database (`attendance.sqlite`) seeded on first run with sample users and employees.
- **DevOps**: `Dockerfile` for backend and frontend, `docker-compose.yml` for multi-container deployment.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Start the Backend API Server
```bash
cd backend
npm install
npm start
```
The server will boot at **`http://localhost:5000`** and automatically initialize and seed the database.
- **API Base**: `http://localhost:5000/api`
- **Swagger Documentation**: `http://localhost:5000/api/docs`
- **Health Check**: `http://localhost:5000/api/health`

### 2. Start the Frontend Application
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Default Login Credentials
- **Username**: `admin`
- **Password**: `admin123`
*(A "Fill Demo Admin Credentials" quick-action button is also provided directly on the login screen for instant testing).*

---

## 🐳 Docker Deployment

To launch the complete containerized stack (PostgreSQL + Express Backend + React Frontend):
```bash
docker-compose up --build
```
- Frontend: `http://localhost`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

---

## 🗄️ Database Design & Normalization

The database is designed according to **Third Normal Form (3NF)** to eliminate redundancy and enforce referential integrity.

### 1. `users` Table (Authentication & Access Control)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INTEGER | PRIMARY KEY | Unique user record identifier |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Login username |
| `password_hash` | VARCHAR(255) | NOT NULL | Salted bcrypt hash |
| `role` | VARCHAR(20) | CHECK IN ('Admin', 'Manager', 'Employee') | Role-based authorization |
| `full_name` | VARCHAR(100) | NULL | Administrator's display name |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account state |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |

### 2. `employees` Table (Core Master Record)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INTEGER | PRIMARY KEY | Internal surrogate key |
| `employee_id` | VARCHAR(30) | UNIQUE, NOT NULL | Business ID (e.g. `EMP-001`) |
| `employee_name`| VARCHAR(100) | NOT NULL | Employee full name |
| `email` | VARCHAR(120) | UNIQUE, NOT NULL | Business email address |
| `mobile_number`| VARCHAR(20) | NOT NULL | Phone contact |
| `department` | VARCHAR(50) | NOT NULL | Department designation |
| `designation` | VARCHAR(60) | NOT NULL | Job title |
| `status` | VARCHAR(20) | CHECK IN ('Active', 'Inactive') | Current employment status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |

### 3. `attendance` Table (Daily Attendance Records)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INTEGER | PRIMARY KEY | Unique attendance entry ID |
| `employee_id` | VARCHAR(30) | FK -> `employees(employee_id)` ON DELETE CASCADE | Foreign Key to employee |
| `attendance_date`| DATE | NOT NULL | Date of attendance (`YYYY-MM-DD`) |
| `check_in_time`| TIME | NULL | Check-in timestamp |
| `check_out_time`| TIME | NULL | Check-out timestamp |
| `attendance_status`| VARCHAR(20)| CHECK IN ('Present', 'Absent', 'Late', 'Half-Day') | Attendance classification |
| `notes` | VARCHAR(255) | NULL | Context or justification |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |

**Integrity Constraints**:
- Composite Unique Constraint `(employee_id, attendance_date)` ensures an employee cannot have multiple conflicting attendance records on the same day.
- Foreign Key with `ON UPDATE CASCADE` and `ON DELETE CASCADE` guarantees referential cleanliness when updating an employee ID or removing a record.
- Indices on `employees(department)`, `employees(status)`, and `attendance(attendance_date, employee_id)` maximize query performance during filtering and aggregation.

---

## 📡 REST API Reference

All protected endpoints require the HTTP header:  
`Authorization: Bearer <JWT_TOKEN>`

### Authentication
- `POST /api/auth/login`: Authenticate admin with username & password; returns signed JWT.
- `GET /api/auth/me`: Validate token and retrieve active administrator profile.

### Employee Management
- `GET /api/employees`: List employees with query filters:
  - `search`: Name, employee ID, or email keyword.
  - `department`: Filter by department (e.g. `Engineering`, `Design`).
  - `status`: Filter by `Active` or `Inactive`.
  - `sortBy` & `sortOrder`: Dynamic column sorting.
  - `page` & `limit`: Server-side pagination.
- `GET /api/employees/:id`: Retrieve single employee details with attendance history and attendance rate.
- `GET /api/employees/departments`: List all distinct departments.
- `POST /api/employees`: Create new employee (validates unique employee ID and email).
- `PUT /api/employees/:id`: Update employee information.
- `DELETE /api/employees/:id`: Remove employee and cascade remove associated attendance.

### Attendance Management
- `POST /api/attendance`: Mark or update daily attendance (upsert logic for the date).
- `GET /api/attendance`: List attendance records with date, department, and status filters.
- `GET /api/attendance/summary`: Aggregated attendance numbers and attendance percentage for a date.
- `GET /api/attendance/employee/:employeeId`: Employee-wise historical track record.
- `GET /api/attendance/export`: Stream attendance data as a downloadable `.csv` spreadsheet.

### Dashboard
- `GET /api/dashboard/stats`: Returns total employees, active count, present/absent/late/half-day today, attendance percentage, and department-wise counts.

---

## 🎯 Round 2 Technical Review & Enhancement Defense Guide

During the Round 2 Technical Discussion with the Twite AI Engineering Team, candidates may be asked to explain their architecture or implement live enhancements. Here is how each item is architected:

### 1. Enhancement Task 1: "Add Department Filter"
- **Where it is implemented**:
  - Backend: `backend/src/controllers/employeeController.js` and `backend/src/controllers/attendanceController.js` check `req.query.department`. If passed and not `'All'`, `department = ?` is appended to the SQL `WHERE` clause with parameterized bindings.
  - Frontend: Dropdowns in `EmployeesView.jsx` and `AttendanceView.jsx` dynamically populate departments via `/api/employees/departments` and trigger reactive re-fetching.

### 2. Enhancement Task 2: "Add Attendance Percentage"
- **Where it is implemented**:
  - Backend: `backend/src/controllers/attendanceController.js` and `backend/src/controllers/dashboardController.js`.
  - **Formula**:
    $$\text{Attendance Rate (\%)} = \left( \frac{\text{Present} + \text{Late} + (0.5 \times \text{Half-Day})}{\text{Total Active Employees}} \right) \times 100$$
  - Frontend: Displayed as a prominent visual gauge card in `DashboardView.jsx` and inside the summary strip in `AttendanceView.jsx`.

### 3. Enhancement Task 3: "Add Employee Status Filter"
- **Where it is implemented**:
  - Backend: Handled via `status = ?` in `getEmployees` SQL query.
  - Frontend: Status selector (`All`, `Active`, `Inactive`) in `EmployeesView.jsx` allowing HR to separate current staff from resigned/inactive records.

### 4. Enhancement Task 4: "Add Export Feature"
- **Where it is implemented**:
  - Backend: `GET /api/attendance/export` in `backend/src/controllers/attendanceController.js`. It queries the filtered records, constructs sanitized CSV lines with RFC-4180 escaping, and streams the response with `Content-Type: text/csv` and `Content-Disposition: attachment; filename=attendance_report.csv`.
  - Frontend: "Export CSV" button in `AttendanceView.jsx` triggers browser blob download.

---

## 📁 Repository Structure
```
mini-attendance-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # SQLite connection & auto-seed
│   │   ├── controllers/
│   │   │   ├── authController.js     # JWT & login logic
│   │   │   ├── employeeController.js # CRUD, search, filter, pagination
│   │   │   ├── attendanceController.js# Mark, summary, history, CSV export
│   │   │   └── dashboardController.js# Stats & department breakdown
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT verification & role authorization
│   │   ├── routes/                   # Express routes
│   │   ├── docs/
│   │   │   └── swagger.json          # OpenAPI 3.0 specification
│   │   └── index.js                  # Main server entry
│   ├── .env                          # Configuration
│   ├── Dockerfile                    # Backend container definition
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js             # Centralized API fetcher with JWT
│   │   ├── components/
│   │   │   ├── LoginView.jsx         # Glassmorphic login with demo quick-fill
│   │   │   ├── Sidebar.jsx           # Responsive navigation & profile
│   │   │   ├── Navbar.jsx            # Live clock and page title
│   │   │   ├── DashboardView.jsx     # KPI cards, gauge, dept breakdown
│   │   │   ├── EmployeesView.jsx     # Employee CRUD, modals, dossier
│   │   │   └── AttendanceView.jsx    # Marking, history, CSV export
│   │   ├── App.jsx                   # Root application state & toast
│   │   ├── index.css                 # Custom design system styling
│   │   └── main.jsx
│   ├── Dockerfile                    # Frontend Nginx container definition
│   └── vite.config.js                # Vite config with /api proxy
├── database/
│   ├── schema-postgres.sql           # PostgreSQL DDL with constraints & triggers
│   ├── schema-mysql.sql              # MySQL DDL with InnoDB engine
│   └── seed.sql                      # Sample data seed script
├── docker-compose.yml                # Multi-container orchestration
├── postman_collection.json           # Ready-to-import Postman API tests
└── README.md                         # Complete documentation
```
