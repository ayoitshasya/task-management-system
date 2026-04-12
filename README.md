# Task Management System

A full-stack web application for managing tasks, built as a mini-project for the Object Oriented Software Engineering (OOSE) course at K.J. Somaiya College of Engineering, Somaiya Vidyavihar University.

**Developer:** Hasya Abburi  
**Course:** OOSE — Third Year B.Tech IT, Semester 6  
**Methodology:** Agile Scrum (solo)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Pages & Components](#pages--components)
- [Authentication Flow](#authentication-flow)
- [Notification System](#notification-system)
- [Report Generation](#report-generation)
- [Environment Variables](#environment-variables)

---

## Overview

The Task Management System (TMS) is a web application that allows users to create, assign, track, and manage tasks. It supports role-based access (admin and regular user), automated overdue notifications via a background cron job, and PDF report generation for tasks within a selected date range.

---

## Features

- **User Authentication** — Register and login with JWT-based authentication
- **Role-Based Access** — Admins can view and manage all tasks; regular users see only their own
- **Task CRUD** — Create, read, update, and delete tasks with full field support
- **Priority & Status Tracking** — Tasks have priority (Low / Medium / High) and status (Pending / In Progress / Completed)
- **Due Date Validation** — Past due dates are rejected on task creation and update
- **Filters** — Filter task list by status and priority
- **Overdue Detection** — Tasks past their due date are highlighted in the UI
- **Notifications** — Cron job runs hourly, inserting notifications for overdue/due-today tasks
- **PDF Reports** — Generate and download a PDF report of tasks within any date range
- **Activity Logging** — All create, update, and delete actions are logged in the database

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Create React App), React Router v6, plain CSS |
| Backend | Node.js, Express.js |
| Database | MySQL (mysql2 driver) |
| Authentication | JWT (jsonwebtoken), bcrypt |
| Scheduled Jobs | node-cron |
| PDF Generation | pdfkit |
| Validation | express-validator |
| HTTP Client | axios |

---

## Project Structure

```
task-management-system/
│
├── backend/
│   ├── config/
│   │   ├── db.js                  # MySQL connection pool (promise-based)
│   │   └── schema.sql             # Database schema — run this to set up MySQL
│   │
│   ├── controllers/
│   │   ├── authController.js      # Register, login, get users
│   │   ├── taskController.js      # Task CRUD + notifications
│   │   └── reportController.js    # PDF report generation
│   │
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT verification, attaches req.user
│   │
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth/*
│   │   ├── taskRoutes.js          # /api/tasks/*
│   │   └── reportRoutes.js        # /api/reports/*
│   │
│   ├── services/
│   │   └── notificationService.js # Cron job — checks overdue tasks every hour
│   │
│   ├── .env                       # Environment variables (not committed)
│   ├── .gitignore
│   ├── package.json
│   └── server.js                  # Express app entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    │
    ├── src/
    │   ├── api/
    │   │   └── axios.js           # Axios instance with JWT interceptor
    │   │
    │   ├── context/
    │   │   └── AuthContext.js     # Auth state (user, token, login, logout)
    │   │
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx      # Summary cards + notification bell
    │   │   ├── Tasks.jsx          # Task list with filters
    │   │   └── Reports.jsx        # PDF report generator
    │   │
    │   ├── components/
    │   │   ├── Navbar.jsx         # Top navigation bar
    │   │   ├── TaskCard.jsx       # Single task row in table
    │   │   ├── TaskForm.jsx       # Create/edit task modal
    │   │   └── NotificationPanel.jsx
    │   │
    │   ├── styles/                # CSS files (one per component/page)
    │   ├── App.js                 # Routes + PrivateRoute wrapper
    │   └── index.js               # React entry point
    │
    ├── .gitignore
    └── package.json
```

---

## Database Schema

Run `backend/config/schema.sql` in MySQL to create the database and all tables.

### `users`
| Column | Type | Notes |
|---|---|---|
| id | INT (PK) | Auto increment |
| name | VARCHAR(100) | Required |
| email | VARCHAR(100) | Unique |
| password | VARCHAR(255) | bcrypt hashed |
| role | ENUM | `admin` or `user` (default: `user`) |
| created_at | TIMESTAMP | Auto |

### `tasks`
| Column | Type | Notes |
|---|---|---|
| id | INT (PK) | Auto increment |
| title | VARCHAR(200) | Required |
| description | TEXT | Optional |
| priority | ENUM | `Low`, `Medium`, `High` (default: `Medium`) |
| status | ENUM | `Pending`, `In Progress`, `Completed` (default: `Pending`) |
| due_date | DATE | Required, cannot be in the past |
| assigned_to | INT (FK) | References `users.id` |
| created_by | INT (FK) | References `users.id` |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto on update |

### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | INT (PK) | Auto increment |
| user_id | INT (FK) | References `users.id` |
| message | VARCHAR(255) | Notification text |
| is_read | BOOLEAN | Default: `false` |
| created_at | TIMESTAMP | Auto |

### `activity_log`
| Column | Type | Notes |
|---|---|---|
| id | INT (PK) | Auto increment |
| user_id | INT | User who performed the action |
| action | VARCHAR(255) | Description of action |
| created_at | TIMESTAMP | Auto |

---

## Setup & Installation

### Prerequisites

- Node.js (v18 or above)
- MySQL (v8 or above)
- npm

### 1. Clone the repository

```bash
git clone https://github.com/ayoitshasya/task-management-system.git
cd task-management-system
```

### 2. Set up the database

Open MySQL and run the schema file:

```bash
mysql -u root -p < backend/config/schema.sql
```

Or paste the contents of `backend/config/schema.sql` directly into MySQL Workbench.

### 3. Configure environment variables

Create a `.env` file inside the `backend/` folder:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tms_db
JWT_SECRET=tms_secret_key_2026
```

### 4. Install backend dependencies

```bash
cd backend
npm install
```

### 5. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Running the Application

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
node server.js
```
Backend runs on `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
```
Frontend runs on `http://localhost:3000`

Visit `http://localhost:3000` in your browser.

---

## API Reference

All protected routes require the header:
```
Authorization: Bearer <jwt_token>
```

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register a new user |
| POST | `/login` | No | Login and receive JWT |
| GET | `/users` | Yes | Get all users (for assignee dropdown) |

**POST /register — Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**POST /login — Request body:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response (both register and login):**
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "user" }
}
```

---

### Tasks — `/api/tasks`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Yes | Get tasks (all if admin, own if user) |
| POST | `/` | Yes | Create a new task |
| PUT | `/:id` | Yes | Update a task |
| DELETE | `/:id` | Yes | Delete a task |
| GET | `/notifications` | Yes | Get unread notifications for current user |
| PUT | `/notifications/:id/read` | Yes | Mark a notification as read |

**POST / — Request body:**
```json
{
  "title": "Design login page",
  "description": "Create wireframes and implement UI",
  "priority": "High",
  "status": "Pending",
  "due_date": "2026-05-01",
  "assigned_to": 2
}
```

---

### Reports — `/api/reports`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/?from=YYYY-MM-DD&to=YYYY-MM-DD` | Yes | Download PDF report of tasks in date range |

Returns a downloadable PDF file (`application/pdf`).

---

## Pages & Components

### Pages

| Page | Route | Description |
|---|---|---|
| Login | `/login` | Email + password login form |
| Register | `/register` | Name, email, password registration |
| Dashboard | `/dashboard` | Summary cards (total, pending, in progress, completed, overdue) + notification bell |
| Tasks | `/tasks` | Full task table with filters, create/edit/delete actions |
| Reports | `/reports` | Date range picker with PDF download button |

### Components

| Component | Description |
|---|---|
| `Navbar` | Top bar with nav links, logged-in user name, logout button |
| `TaskCard` | Renders one task as a table row with colour-coded priority badge |
| `TaskForm` | Modal form for creating or editing a task, includes assignee dropdown |
| `NotificationPanel` | Dropdown showing unread notifications with mark-as-read option |

---

## Authentication Flow

1. User registers or logs in → backend returns a JWT token
2. Token is stored in `localStorage`
3. All API requests automatically attach the token via an axios interceptor
4. Protected routes in React check for the token via `AuthContext` — redirect to `/login` if missing
5. Backend middleware decodes the token and attaches `req.user` to every protected request

---

## Notification System

A `node-cron` job starts automatically when the backend boots. It runs **every hour** and:

1. Queries all tasks where `due_date <= today` and `status != 'Completed'`
2. Inserts a notification row into the `notifications` table for the assigned user
3. Logs the notification to the console

> In a production environment, this would also send an email via Nodemailer/SMTP. The code includes a comment indicating where that would go.

Users can view their unread notifications by clicking the bell icon on the Dashboard. Clicking "Mark as read" removes it from the list.

---

## Report Generation

On the Reports page, the user selects a **From** and **To** date. Clicking "Download PDF Report" sends a request to `/api/reports?from=...&to=...`.

The backend:
1. Queries tasks with `due_date` in the selected range
2. Uses `pdfkit` to generate a PDF containing:
   - Report title, date range, generation date
   - Summary counts (total, pending, in progress, completed)
   - A table listing each task with title, priority, status, due date, and assignee
3. Streams the PDF directly to the browser as a download

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `yourpassword` |
| `DB_NAME` | Database name | `tms_db` |
| `JWT_SECRET` | Secret key for signing JWTs | `tms_secret_key_2026` |

> The `.env` file is listed in `.gitignore` and is never committed to the repository.
