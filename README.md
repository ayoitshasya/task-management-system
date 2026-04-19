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
- [Role-Based Access Control](#role-based-access-control)
- [Notification System](#notification-system)
- [AI Task Autopilot](#ai-task-autopilot)
- [Smart Scheduling](#smart-scheduling)
- [Report Generation](#report-generation)
- [Security Measures](#security-measures)
- [Environment Variables](#environment-variables)

---

## Overview

The Task Management System (TMS) is a full-stack MERN (MongoDB, Express, React, Node.js) web application that allows users to create, assign, track, and manage tasks. It supports role-based access control (admin vs regular user), automated overdue notifications via a background cron job, paginated task listings, PDF report generation, and two AI-powered features — **AI Task Autopilot** and **Smart Scheduling** — both powered by Google Gemini (free).

The project demonstrates core OOSE principles including separation of concerns, MVC architecture, RESTful API design, JWT-based stateless authentication, and agile development practices.

---

## Features

### Core Features
- **User Authentication** — Secure register and login with JWT (JSON Web Token)
- **Role-Based Access Control** — Admins see and manage all tasks; regular users see only their own or assigned tasks
- **Task CRUD** — Create, read, update, and delete tasks with full field support
- **Priority & Status Tracking** — Every task has a priority (Low / Medium / High) and a status (Pending / In Progress / Completed)
- **Task Assignment** — Admins can assign tasks to any user; only admins can reassign
- **Due Date Validation** — Past due dates are rejected at both creation and update
- **Overdue Detection** — Tasks past their due date are highlighted in red in the UI
- **Filter by Status/Priority** — Quickly narrow down the task list
- **Pagination** — Tasks load 20 per page to handle large datasets efficiently
- **PDF Reports** — Generate and download a formatted PDF of tasks within any date range
- **Activity Logging** — All create, update, and delete actions are silently logged to the database for audit purposes

### Notification System
- Background cron job runs **every hour** and creates notifications for overdue/due-today tasks
- Dashboard notification bell shows unread count with live polling every 60 seconds
- Users can mark notifications as read one by one

### AI Features
- **AI Task Autopilot** — Type a big goal, get a structured plan with subtasks, time estimates, priorities, and suggested deadlines powered by Google Gemini
- **Smart Scheduling** — AI analyzes your current tasks, identifies overloaded days, overdue items, and suggests an optimized rescheduling plan

### Security & Reliability
- Rate limiting on the login endpoint (max 20 attempts per 15 minutes)
- Rate limiting on AI endpoints (max 10 requests per minute)
- Non-admin users cannot change the `assigned_to` field on a task, even via direct API calls
- All dates normalized to UTC midnight to prevent timezone-related edge cases
- Environment-variable-driven configuration (no hardcoded URLs)

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React.js 18 (Create React App) | UI framework |
| Routing | React Router v6 | Client-side navigation |
| HTTP Client | Axios | API calls with JWT interceptor |
| Styling | Plain CSS | Component-scoped stylesheets |
| Backend | Node.js + Express.js 4 | REST API server |
| Database | MongoDB + Mongoose ODM | Data storage and schema management |
| Authentication | JWT (jsonwebtoken) + bcrypt | Stateless auth + password hashing |
| Scheduled Jobs | node-cron | Hourly notification background job |
| PDF Generation | pdfkit | Server-side PDF creation and streaming |
| Input Validation | express-validator | Request body validation |
| Rate Limiting | express-rate-limit | Brute-force protection |
| AI | Google Generative AI (Gemini 1.5 Flash) | Task breakdown + smart scheduling |

---

## Project Structure

```
task-management-system/
│
├── backend/
│   ├── config/
│   │   └── db.js                   # Mongoose connection setup
│   │
│   ├── models/
│   │   ├── User.js                 # User schema (name, email, password, role)
│   │   ├── Task.js                 # Task schema (title, priority, status, AI fields, etc.)
│   │   ├── Notification.js         # Notification schema (user_id, message, is_read)
│   │   └── ActivityLog.js          # Audit log schema (user_id, action, timestamp)
│   │
│   ├── controllers/
│   │   ├── authController.js       # Register, login, get users
│   │   ├── taskController.js       # Task CRUD + notifications + pagination
│   │   ├── reportController.js     # PDF report generation
│   │   └── aiController.js         # AI Autopilot + Smart Scheduling (Gemini)
│   │
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT verification, attaches req.user
│   │
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth/* (with login rate limiter)
│   │   ├── taskRoutes.js           # /api/tasks/*
│   │   ├── reportRoutes.js         # /api/reports/*
│   │   └── aiRoutes.js             # /api/ai/* (with AI rate limiter)
│   │
│   ├── services/
│   │   └── notificationService.js  # Cron job — checks overdue tasks every hour
│   │
│   ├── .env                        # Environment variables (not committed to git)
│   ├── package.json
│   └── server.js                   # Express app entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    │
    ├── src/
    │   ├── api/
    │   │   └── axios.js            # Configured Axios instance (JWT interceptor, env-driven baseURL)
    │   │
    │   ├── context/
    │   │   └── AuthContext.js      # Global auth state (user, token, login, logout)
    │   │
    │   ├── pages/
    │   │   ├── Login.jsx           # Login form
    │   │   ├── Register.jsx        # Registration form with role selector
    │   │   ├── Dashboard.jsx       # Summary cards + notification bell (auto-polls)
    │   │   ├── Tasks.jsx           # Paginated task table with filters
    │   │   ├── Reports.jsx         # Date range picker + PDF download
    │   │   ├── AIAutopilot.jsx     # AI task breakdown page
    │   │   └── SmartSchedule.jsx   # AI schedule analysis page
    │   │
    │   ├── components/
    │   │   ├── Navbar.jsx          # Top navigation bar
    │   │   ├── TaskCard.jsx        # Single task row with edit/delete actions
    │   │   ├── TaskForm.jsx        # Create/edit task modal
    │   │   └── NotificationPanel.jsx # Unread notifications dropdown
    │   │
    │   ├── styles/                 # CSS files (one per page/component)
    │   ├── App.js                  # Route definitions + PrivateRoute
    │   └── index.js                # React entry point
    │
    ├── .env                        # REACT_APP_API_URL (not committed)
    └── package.json
```

---

## Database Schema

MongoDB collections are created automatically by Mongoose when the app first runs. No manual setup or migration scripts are needed.

### `users`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated primary key |
| `name` | String | Required |
| `email` | String | Unique, lowercase |
| `password` | String | Hashed with bcrypt (10 salt rounds) |
| `role` | String | `admin` or `user` — default: `user` |
| `created_at` | Date | Auto-managed by Mongoose timestamps |

### `tasks`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `title` | String | Required |
| `description` | String | Optional, defaults to `""` |
| `priority` | String | `Low`, `Medium`, `High` — default: `Medium` |
| `status` | String | `Pending`, `In Progress`, `Completed` — default: `Pending` |
| `due_date` | Date | Required; stored as UTC midnight |
| `assigned_to` | ObjectId | Ref: User (nullable) |
| `created_by` | ObjectId | Ref: User (required) |
| `estimated_hours` | Number | AI-estimated effort in hours (nullable) |
| `parent_task` | ObjectId | Ref: Task — links subtasks to parent (nullable) |
| `is_subtask` | Boolean | True if created by AI Autopilot as a child task |
| `ai_generated` | Boolean | True if created via AI features |
| `completed_at` | Date | Auto-set when status changes to `Completed` |
| `scheduled_start` | Date | AI-suggested start date (nullable) |
| `original_due_date` | Date | Preserved when Smart Scheduling reschedules a task |
| `created_at` | Date | Auto |
| `updated_at` | Date | Auto on every update |

### `notifications`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `user_id` | ObjectId | Ref: User |
| `message` | String | Notification text |
| `is_read` | Boolean | Default: `false` |
| `created_at` | Date | Auto |

### `activitylogs`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `user_id` | ObjectId | Ref: User |
| `action` | String | Human-readable description (e.g. `"Created task: Design login page"`) |
| `created_at` | Date | Auto |

---

## Setup & Installation

### Prerequisites

- **Node.js** v18 or above — [nodejs.org](https://nodejs.org)
- **MongoDB Community Edition** v6 or above, running locally — [mongodb.com](https://www.mongodb.com/try/download/community)
- **npm** (comes with Node.js)
- **Google Gemini API key** (free) — [aistudio.google.com](https://aistudio.google.com) — required only for AI features

### 1. Clone the repository

```bash
git clone https://github.com/ayoitshasya/task-management-system.git
cd task-management-system
```

### 2. Configure backend environment variables

Create a file called `.env` inside the `backend/` folder with the following content:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/tms_db
JWT_SECRET=your_strong_secret_key_here
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Getting a free Gemini API key:**
> 1. Go to [aistudio.google.com](https://aistudio.google.com)
> 2. Sign in with your Google account
> 3. Click **"Get API Key"** → **"Create API key"**
> 4. Copy the key (starts with `AIza...`) and paste it above
>
> The free tier allows 15 requests/minute — more than enough for this project.

### 3. Configure frontend environment variables

Create a file called `.env` inside the `frontend/` folder:

```env
REACT_APP_API_URL=http://localhost:5000/api
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

Make sure MongoDB is running first. Then open two terminals.

**Start MongoDB (if not running as a service):**
```bash
mongod
```

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev       # uses nodemon, auto-restarts on file changes
# or
node server.js    # production-style, no auto-restart
```
Backend runs on → `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
```
Frontend runs on → `http://localhost:3000`

Open `http://localhost:3000` in your browser. Register a new account to get started.

> **First run:** MongoDB collections (`users`, `tasks`, `notifications`, `activitylogs`) are created automatically by Mongoose the first time the app connects. No database setup script is needed.

---

## API Reference

All protected routes require the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

The token is returned on login/register and automatically attached to every request by the axios interceptor in the frontend.

---

### Auth — `/api/auth`

| Method | Endpoint | Protected | Description |
|---|---|---|---|
| POST | `/register` | No | Create a new user account |
| POST | `/login` | No | Login and receive a JWT (rate-limited: 20 req/15min) |
| GET | `/users` | Yes | Get all users (used for the assignee dropdown) |

**POST `/register` — Request body:**
```json
{
  "name": "Hasya Abburi",
  "email": "hasya@example.com",
  "password": "secret123",
  "role": "user"
}
```

**POST `/login` — Request body:**
```json
{
  "email": "hasya@example.com",
  "password": "secret123"
}
```

**Response (register and login):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Hasya Abburi",
    "email": "hasya@example.com",
    "role": "user"
  }
}
```

---

### Tasks — `/api/tasks`

| Method | Endpoint | Protected | Description |
|---|---|---|---|
| GET | `/?page=1&limit=20` | Yes | Get paginated tasks (admin: all; user: own/assigned) |
| POST | `/` | Yes | Create a new task |
| PUT | `/:id` | Yes | Update a task (creator or admin only) |
| DELETE | `/:id` | Yes | Delete a task (creator or admin only) |
| GET | `/notifications` | Yes | Get unread notifications for the current user |
| PUT | `/notifications/:id/read` | Yes | Mark a notification as read |

**GET `/` — Response format (paginated):**
```json
{
  "tasks": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 53,
    "pages": 3
  }
}
```

**POST `/` — Request body:**
```json
{
  "title": "Design login page",
  "description": "Create wireframes and implement the UI",
  "priority": "High",
  "status": "Pending",
  "due_date": "2026-05-01",
  "assigned_to": "64f1a2b3c4d5e6f7a8b9c0d1"
}
```

> **Note:** `assigned_to` can only be set by admins. Regular users cannot change this field even via the raw API.

---

### Reports — `/api/reports`

| Method | Endpoint | Protected | Description |
|---|---|---|---|
| GET | `/?from=YYYY-MM-DD&to=YYYY-MM-DD` | Yes | Download a PDF of tasks in the date range |

Returns a binary PDF file with `Content-Type: application/pdf`. The browser automatically triggers a download.

---

### AI — `/api/ai`

All AI endpoints are rate-limited to 10 requests per minute per IP.

| Method | Endpoint | Protected | Description |
|---|---|---|---|
| POST | `/autopilot` | Yes | Generate a subtask plan for a big goal |
| POST | `/autopilot/save` | Yes | Save AI-generated subtasks as real tasks |
| POST | `/schedule` | Yes | Analyze tasks and get scheduling suggestions |
| POST | `/schedule/apply` | Yes | Apply the AI-suggested reschedules to real tasks |

**POST `/autopilot` — Request body:**
```json
{
  "title": "Build a portfolio website",
  "description": "Needs to showcase my projects",
  "context": "Due in 2 weeks, for job applications"
}
```

**POST `/autopilot` — Response:**
```json
{
  "subtasks": [
    {
      "title": "Plan site structure and choose tech stack",
      "description": "Decide on pages, layout, and whether to use React or static HTML",
      "priority": "High",
      "estimated_hours": 2,
      "suggested_due_date": "2026-04-21",
      "rationale": "All other tasks depend on this decision"
    },
    ...
  ],
  "total_estimated_hours": 18,
  "recommended_approach": "Start with the structure before writing any code..."
}
```

**POST `/schedule` — Response:**
```json
{
  "summary": "You have 3 overdue tasks and 2 days next week are overloaded.",
  "productivity_tip": "Focus on high-priority tasks in the morning when energy is highest.",
  "overloaded_days": ["2026-04-25", "2026-04-26"],
  "rescheduled": [
    {
      "task_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "task_title": "Finish OOSE report",
      "old_due_date": "2026-04-18",
      "suggested_due_date": "2026-04-22",
      "reason": "Task is overdue; suggesting nearest free slot"
    }
  ],
  "suggestions": [
    {
      "type": "overdue",
      "message": "3 tasks are overdue and need immediate attention or rescheduling.",
      "affected_tasks": ["Finish OOSE report", "Submit assignment", "..."],
      "priority": "high"
    }
  ]
}
```

---

## Pages & Components

### Pages

| Page | Route | Description |
|---|---|---|
| Login | `/login` | Email + password login form |
| Register | `/register` | Name, email, password, role selection |
| Dashboard | `/dashboard` | Summary cards (total/pending/in-progress/completed/overdue) + notification bell with 60s auto-poll |
| Tasks | `/tasks` | Paginated task table with status/priority filters, create/edit/delete |
| Reports | `/reports` | Date range picker, downloads PDF report |
| AI Autopilot | `/autopilot` | Enter a goal → AI generates a subtask breakdown → save selected tasks |
| Smart Schedule | `/schedule` | AI analyzes your tasks → shows overload warnings + reschedule suggestions → apply with one click |

### Components

| Component | File | Description |
|---|---|---|
| Navbar | `Navbar.jsx` | Top navigation bar with links, logged-in username, logout button, and styled AI links |
| TaskCard | `TaskCard.jsx` | Renders one task as a table row with colour-coded priority badge, overdue highlighting, edit/delete buttons |
| TaskForm | `TaskForm.jsx` | Modal for creating or editing a task; shows assignee dropdown only to admins |
| NotificationPanel | `NotificationPanel.jsx` | Dropdown panel showing unread notifications with individual mark-as-read buttons |

---

## Authentication Flow

1. User submits register/login form → backend validates input with `express-validator`
2. On login: `bcrypt.compare()` checks the password against the stored hash
3. Backend signs a JWT with `{ id, name, email, role }` payload, expiry 7 days
4. Token is stored in `localStorage` on the frontend
5. `AuthContext` provides `user`, `token`, `login()`, `logout()` globally to all React components
6. Every outgoing axios request has the token attached via a request interceptor
7. `PrivateRoute` component in `App.js` checks for a token — redirects to `/login` if missing
8. Every protected backend route runs `authMiddleware`, which verifies the token and sets `req.user`

---

## Role-Based Access Control

There are two roles: **admin** and **user**.

| Action | Admin | Regular User |
|---|---|---|
| View all tasks | ✅ | ❌ (own/assigned only) |
| Edit any task | ✅ | ❌ (own only) |
| Delete any task | ✅ | ❌ (own only) |
| Assign tasks to others | ✅ | ❌ |
| Reassign (change `assigned_to`) | ✅ | ❌ (blocked at API level) |
| Generate reports | ✅ | ✅ |
| Use AI features | ✅ | ✅ |

Role enforcement happens on the **backend** — the frontend hides UI elements, but the API independently validates every request.

---

## Notification System

A `node-cron` job starts automatically when the backend boots and runs **every hour** at the top of the hour (`0 * * * *`). It:

1. Queries all tasks where `due_date <= now` and `status != 'Completed'`
2. For each task, checks whether a notification with the same message was already created **today** (deduplication — prevents spamming the user every hour)
3. If not already notified today, inserts a `Notification` document for the task's `assigned_to` user (or creator if unassigned)

On the frontend, the Dashboard fetches notifications on page load and then **polls every 60 seconds** using `setInterval`, so new notifications appear without a manual refresh.

Users can dismiss notifications individually by clicking "Mark as read" — this sets `is_read: true` in the database and removes it from the UI list.

> In a production environment, you would also send emails here using Nodemailer. A comment in `notificationService.js` marks where to add that.

---

## AI Task Autopilot

The Autopilot page lets users break down large, vague goals into a structured action plan.

### How it works

1. User types a goal (e.g. *"Finish my OOSE project"*) with optional description and deadline context
2. Frontend sends a `POST /api/ai/autopilot` request to the backend
3. Backend builds a detailed prompt and calls **Google Gemini 1.5 Flash**
4. Gemini returns a JSON plan with 3–7 subtasks, each having:
   - Title and description
   - Priority (Low / Medium / High)
   - Estimated hours
   - Suggested due date
   - Rationale for why it matters
5. The plan is displayed as selectable cards in the UI
6. User selects which subtasks to keep and clicks "Save"
7. Backend creates a parent task + linked subtask documents in MongoDB, all tagged `ai_generated: true` and linked via `parent_task`

### Model used
`gemini-2.0-flash` — Google's latest fast, free-tier model. 15 requests/minute on the free plan.

---

## Smart Scheduling

The Smart Schedule page analyzes your current workload and suggests how to reorganize your tasks to avoid burnout and missed deadlines.

### How it works

1. User clicks **"Analyze My Schedule"**
2. Backend fetches all the user's active (non-completed) tasks
3. Sends them to **Google Gemini** with a prompt asking it to assume 6 productive hours/day
4. Gemini returns:
   - An overall summary of the scheduling situation
   - A productivity tip tailored to the current workload
   - A list of overloaded dates (too many tasks due on one day)
   - Reschedule suggestions for overdue tasks, with new realistic due dates and reasons
   - Categorized suggestions (overdue / overload / optimization)
5. User can select which reschedules to apply and click **"Apply"**
6. Backend updates the `due_date` on selected tasks and saves the `original_due_date` field so the change is auditable

---

## Report Generation

On the Reports page, the user selects a **From** and **To** date, then clicks "Download PDF". The backend:

1. Queries all tasks where `due_date >= from` and `due_date <= to`
2. Uses **pdfkit** to generate a formatted PDF containing:
   - Report title, date range, generation timestamp
   - Summary counts (total, pending, in progress, completed)
   - A table listing each task: title, priority, status, due date, assigned to
   - Automatic page breaks for long reports
3. Streams the PDF binary directly to the browser as a file download

The frontend uses `axios` with `responseType: 'blob'` to receive the binary, then triggers a browser download using a temporary `<a>` element.

---

## Security Measures

| Measure | Implementation |
|---|---|
| Password hashing | `bcrypt` with 10 salt rounds |
| Stateless auth | JWT signed with `JWT_SECRET`, 7-day expiry |
| Login brute-force protection | `express-rate-limit` — 20 attempts per 15 minutes per IP |
| AI endpoint protection | `express-rate-limit` — 10 requests per minute per IP |
| Task ownership enforcement | Backend checks creator/admin before edit or delete |
| Assignment restriction | Non-admins get a 403 if they try to change `assigned_to` via the API |
| UTC date normalization | All due dates normalized to UTC midnight — prevents off-by-one bugs near midnight |
| Environment variables | API keys and secrets never hardcoded; loaded via `dotenv` |
| CORS | Restricted to the frontend origin defined in `FRONTEND_URL` |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the Express server listens on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/tms_db` |
| `JWT_SECRET` | Secret key used to sign and verify JWTs | `your_strong_random_secret` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `GEMINI_API_KEY` | Google Gemini API key for AI features | `AIzaSy...` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `REACT_APP_API_URL` | Base URL for all API calls | `http://localhost:5000/api` |

> Both `.env` files are listed in `.gitignore` and are never committed to the repository. If you clone this project, you must create these files manually.
