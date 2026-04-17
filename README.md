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
| Database | MongoDB (Mongoose ODM) |
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
│   │   └── db.js                  # MongoDB connection via Mongoose
│   │
│   ├── models/
│   │   ├── User.js                # Mongoose schema — users collection
│   │   ├── Task.js                # Mongoose schema — tasks collection
│   │   ├── Notification.js        # Mongoose schema — notifications collection
│   │   └── ActivityLog.js         # Mongoose schema — activitylogs collection
│   │
│   ├── controllers/
│   │   ├── authController.js      # Register, login, get users
│   │   ├── taskController.js      # Task CRUD + notification endpoints
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

MongoDB collections are created automatically by Mongoose on first use. No manual setup required.

### `users`
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | Auto-generated by MongoDB |
| name | String | Required |
| email | String | Unique, lowercase |
| password | String | bcrypt hashed |
| role | String | `admin` or `user` (default: `user`) |
| created_at | Date | Auto |

### `tasks`
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | Auto-generated |
| title | String | Required |
| description | String | Optional |
| priority | String | `Low`, `Medium`, `High` (default: `Medium`) |
| status | String | `Pending`, `In Progress`, `Completed` (default: `Pending`) |
| due_date | Date | Required, cannot be in the past |
| assigned_to | ObjectId | Ref: User |
| created_by | ObjectId | Ref: User |
| created_at | Date | Auto |
| updated_at | Date | Auto on update |

### `notifications`
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | Auto-generated |
| user_id | ObjectId | Ref: User |
| message | String | Notification text |
| is_read | Boolean | Default: `false` |
| created_at | Date | Auto |

### `activitylogs`
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | Auto-generated |
| user_id | ObjectId | Ref: User |
| action | String | Description of action |
| created_at | Date | Auto |

---

## Setup & Installation

### Prerequisites

- Node.js (v18 or above)
- MongoDB Community Edition (v6 or above) running locally
- npm

> MongoDB collections are created automatically by Mongoose on first use — no manual database setup or migration scripts needed.

### 1. Clone the repository

```bash
git clone https://github.com/ayoitshasya/task-management-system.git
cd task-management-system
```

### 2. Configure environment variables

Create a `.env` file inside the `backend/` folder:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/tms_db
JWT_SECRET=tms_secret_key_2026
```

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Running the Application

Make sure MongoDB is running, then open two terminals:

**Start MongoDB (if not running as a service):**
```bash
mongod
```

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

> MongoDB collections are created automatically — no database setup script needed.

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
  "user": { "id": "64f1a2b3c4d5e6f7a8b9c0d1", "name": "John Doe", "email": "john@example.com", "role": "user" }
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
  "assigned_to": "64f1a2b3c4d5e6f7a8b9c0d1"
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

1. Queries all tasks where `due_date <= now` and `status != 'Completed'` and `assigned_to != null`
2. For each task, checks whether a notification with the same message was already sent today (deduplication) — avoids spamming the user every hour
3. If not already notified today, inserts a notification document into the `notifications` collection for the assigned user
4. Logs the notification to the console

> In a production environment, this would also send an email via Nodemailer/SMTP. The code includes a comment indicating where that would go.

Users can view their unread notifications by clicking the bell icon on the Dashboard. Clicking "Mark as read" removes it from the list.

---

## Report Generation

On the Reports page, the user selects a **From** and **To** date. Clicking "Download PDF Report" sends a request to `/api/reports?from=...&to=...`.

The backend:
1. Queries tasks with `due_date` in the selected range using MongoDB `$gte` / `$lte`
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
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/tms_db` |
| `JWT_SECRET` | Secret key for signing JWTs | `tms_secret_key_2026` |

> The `.env` file is listed in `.gitignore` and is never committed to the repository.
