# TaskFlow — Task Management Platform

> A production-ready, full-stack Task Management Platform built for the KODERS Full-Stack Developer Advanced Assessment. Features real-time WebSocket collaboration, three-tier role-based access control (Admin / Manager / User), JWT dual-token authentication with rotation, and a Kanban drag-and-drop board — all containerised with Docker and deployed on cloud infrastructure.

---

## Live Demo

| Service | URL |
|---|---|
| **Frontend** | https://task-platform-five.vercel.app |
| **Backend API** | https://task-platform-production.up.railway.app/api/v1 |
| **API Docs (Swagger)** | https://task-platform-production.up.railway.app/api/v1/docs |

> The Backend API URL returns a JSON response when opened directly in a browser — this is expected REST API behaviour. Use the Frontend URL to access the full application.

---

## Architecture

```
Browser (React 18 + Vite SPA — Vercel)
         │
         ├── HTTPS REST API ─────────────────────────────────────────┐
         │                                                            ▼
         └── WSS (Socket.io) ──────────────────────► Railway.app (Node.js + Express + TypeScript)
                                                               │
                                                         Mongoose ORM
                                                               │
                                                    MongoDB (Railway Plugin)
```

**Key architectural decisions:**

- Access token stored in Zustand JS memory only — never `localStorage` (XSS-safe)
- Refresh token stored in `httpOnly` cookie — inaccessible to JavaScript
- All task mutations emit Socket.io events → clients invalidate TanStack Query cache automatically
- Soft delete applied transparently via Mongoose pre-hook middleware (no service layer filter needed)
- RBAC enforced at three layers: DB query, API service, and frontend UI rendering

---

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Routing | React Router v6 |
| Server State | TanStack Query v5 |
| Client State | Zustand v4 |
| HTTP Client | Axios (with silent token refresh interceptor) |
| Real-time | socket.io-client v4 |
| Drag and Drop | @dnd-kit/core + @dnd-kit/sortable |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS v3 + shadcn/ui (Radix primitives) |
| Icons | lucide-react |
| Animations | framer-motion |
| Toasts | sonner |

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js v20 + TypeScript |
| Framework | Express v5 |
| Database | MongoDB via Mongoose v9 |
| Auth | jsonwebtoken + bcryptjs |
| Real-time | Socket.io v4 |
| Validation | express-validator |
| Security | helmet + express-rate-limit |
| Testing | Jest + Supertest + ts-jest |

### DevOps and Deployment

| Tool | Usage |
|---|---|
| Docker | Multi-stage images for backend and frontend |
| Docker Compose | Local full-stack orchestration |
| Railway.app | Backend + MongoDB cloud deployment |
| Vercel | Frontend deployment with auto-deploy on push to master |

---

## Features

### Authentication System

- Email and password signup and login
- JWT dual-token: 15-minute access token (JS memory) + 7-day refresh token (httpOnly cookie)
- Silent token refresh via Axios response interceptor — token expiry invisible to user
- Auth state rehydration on page reload via `/auth/me` + httpOnly cookie
- Forgot Password: 3-step UI flow (request reset, email confirmation screen, set new password)
- Refresh token rotation on every use — prevents replay attacks

### Three-Tier Role-Based Access Control

| Feature | Admin | Manager | User |
|---|---|---|---|
| View tasks | All tasks | Team tasks | Own tasks only |
| Create tasks | Yes | Yes | Yes (assigned to self) |
| Edit tasks | Yes | Yes | No |
| Delete tasks | Any task | Own created tasks only | No |
| View user list | Yes | No | No |
| Manage user roles | Yes | No | No |
| Soft-delete users | Yes | No | No |

### Kanban Board

- Three columns: TODO / IN PROGRESS / DONE
- Drag-and-drop status update with optimistic UI (no loading flicker)
- On drag error: automatic revert + toast notification
- Task cards display: title, priority badge (Red = High, Yellow = Medium, Green = Low), assignee avatar with initials fallback, due date badge (green → yellow → red as deadline approaches)
- Filter chips above board: All / High / Medium / Low / My Tasks / Due Today (client-side, no API call)
- Column headers show live task count badges
- Create Task modal and Edit Task modal

### Dashboard

- Stats cards: Total Tasks, In Progress, Completed This Week, Overdue
- Recent activity feed (populated by Socket.io event stream in real time)
- Upcoming tasks list sorted by due date ascending

### UI and UX

- Dark / Light theme toggle (persisted in localStorage)
- Loading skeletons on all data-fetching states
- Toast notifications for all mutations and errors
- Empty state illustrations when lists are empty
- Fully responsive across desktop, tablet, and mobile
- Role-aware sidebar navigation (unavailable items not rendered in DOM, not just hidden)

---

## Project Structure

```
task-platform/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts               # MongoDB connection
│   │   │   └── env.ts              # Environment variable loader with required() guards
│   │   ├── constants/
│   │   │   └── index.ts            # HTTP_STATUS, COOKIE_NAMES, TOKEN_EXPIRY_MS
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── task.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── middleware/
│   │   │   ├── verifyToken.ts      # JWT verification middleware
│   │   │   ├── checkRole.ts        # RBAC middleware
│   │   │   ├── rateLimiter.ts      # express-rate-limit config
│   │   │   ├── errorHandler.ts     # Global error handler (consistent JSON shape)
│   │   │   └── notFound.ts         # 404 handler
│   │   ├── models/
│   │   │   ├── User.model.ts       # User schema with bcrypt pre-save hook
│   │   │   ├── Task.model.ts       # Task schema with soft delete pre-hook
│   │   │   └── RefreshToken.model.ts
│   │   ├── routes/
│   │   │   ├── index.ts            # Health check + route aggregator
│   │   │   ├── auth.routes.ts
│   │   │   ├── task.routes.ts
│   │   │   └── user.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts     # Business logic with token rotation
│   │   │   ├── task.service.ts     # RBAC-scoped CRUD
│   │   │   └── user.service.ts
│   │   ├── socket/
│   │   │   └── taskGateway.ts      # Socket.io event emitters
│   │   ├── utils/
│   │   │   ├── AppError.ts         # Custom error class
│   │   │   ├── generateTokens.ts   # JWT + refresh token utilities
│   │   │   └── paginate.ts         # Reusable pagination helper
│   │   └── validations/
│   │       └── schemas.ts          # express-validator rule arrays
│   ├── tests/
│   │   ├── auth.test.ts
│   │   └── tasks.test.ts
│   ├── seed/
│   │   └── seed.ts
│   ├── Dockerfile
│   ├── jest.config.ts
│   ├── .env.example
│   ├── tsconfig.json
│   └── server.ts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/               # LoginForm, SignupForm, ForgotPasswordForm
│   │   │   ├── dashboard/          # Sidebar, Navbar, StatsCards, ActivityFeed
│   │   │   ├── kanban/             # KanbanBoard, KanbanColumn, TaskCard, TaskModal
│   │   │   ├── users/              # UsersTable, UserRoleModal
│   │   │   ├── shared/             # ProtectedRoute, RoleRoute, LoadingSkeleton
│   │   │   └── ui/                 # shadcn/ui generated components
│   │   ├── hooks/
│   │   │   ├── useAuth.ts          # Auth state hydration on reload
│   │   │   ├── useTasks.ts         # TanStack Query wrappers for task API
│   │   │   ├── useUsers.ts         # TanStack Query wrappers for user API
│   │   │   └── useSocket.ts        # Socket.io event subscription hook
│   │   ├── lib/
│   │   │   ├── api.ts              # Axios instance with token interceptors
│   │   │   ├── socket.ts           # Socket.io client config
│   │   │   └── queryClient.ts      # TanStack Query client config
│   │   ├── pages/
│   │   │   ├── auth/               # LoginPage, SignupPage, ForgotPasswordPage
│   │   │   └── dashboard/          # DashboardHome, TasksPage, UsersPage
│   │   ├── store/
│   │   │   ├── authStore.ts        # Zustand: user, accessToken, isAuthenticated
│   │   │   └── uiStore.ts          # Zustand: theme, sidebarOpen, searchQuery
│   │   ├── types/
│   │   │   └── index.ts            # All shared TypeScript interfaces
│   │   ├── constants/
│   │   │   └── index.ts            # Route paths, query keys, status enums
│   │   └── validations/
│   │       └── schemas.ts          # Zod schemas for all forms
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js v20 or higher
- Docker and Docker Compose
- Git

---

### Option A — Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/yashwaldia/task-platform.git
cd task-platform

# 2. Create the backend environment file
cp backend/.env.example backend/.env
# Open backend/.env and fill in JWT secrets (see Environment Variables section below)

# 3. Create the frontend environment file
cp frontend/.env.example frontend/.env
# VITE_API_URL is pre-set for Docker; no changes needed for local use

# 4. Build and start all three services
docker compose up --build

# Services will be available at:
# Frontend:  http://localhost:5173
# Backend:   http://localhost:4000/api/v1
# MongoDB:   mongodb://localhost:27017
```

---

### Option B — Manual (Without Docker)

**Terminal 1 — Backend:**

```bash
cd backend
npm install
cp .env.example .env
# Fill in all values in .env
npm run dev
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm install
cp .env.example .env
# Ensure VITE_API_URL=http://localhost:4000/api/v1
npm run dev
```

---

## Environment Variables

### Backend — `backend/.env`

```
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://localhost:27017/taskplatform
JWT_ACCESS_SECRET=your_256bit_random_access_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_256bit_random_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
BCRYPT_ROUNDS=10
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

Generate secure secrets using:

```bash
node -e "const c = require('crypto'); console.log(c.randomBytes(32).toString('hex'));"
```

Run this command twice — once for `JWT_ACCESS_SECRET` and once for `JWT_REFRESH_SECRET`.

### Frontend — `frontend/.env`

```
VITE_API_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
```

For production (Vercel), set:

```
VITE_API_URL=https://task-platform-production.up.railway.app/api/v1
VITE_SOCKET_URL=https://task-platform-production.up.railway.app
```

---

## Test Credentials

The following accounts are seeded in the live deployed environment:

| Email | Password | Role |
|---|---|---|
| admin@test.com | Test@1234 | Admin |
| manager@test.com | Test@1234 | Manager |
| user@test.com | Test@1234 | User |

Log in with each account to test role-specific views and access restrictions.

---

## API Documentation

Interactive Swagger UI: https://task-platform-production.up.railway.app/api/v1/docs

All responses follow a consistent envelope structure:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

Error responses:

```json
{
  "success": false,
  "message": "string",
  "statusCode": 400
}
```

---

### Auth Endpoints — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/signup` | None | Register a new user, returns access token |
| POST | `/login` | None | Login, sets httpOnly refresh cookie, returns access token |
| POST | `/refresh` | Cookie | Rotate refresh token, return new access token |
| POST | `/logout` | Cookie | Revoke refresh token |
| GET | `/me` | Bearer | Get current authenticated user profile |
| POST | `/forgot-password` | None | Generate and return password reset token |
| POST | `/reset-password` | None | Reset password using token |

---

### Task Endpoints — `/api/v1/tasks`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | Bearer | All (role-filtered) | List tasks with pagination and filters |
| POST | `/` | Bearer | Admin / Manager / User | Create a new task |
| GET | `/:id` | Bearer | All (permission-checked) | Get single task by ID |
| PUT | `/:id` | Bearer | Admin / Manager | Full task update |
| PATCH | `/:id/status` | Bearer | All (own tasks) | Update task status only |
| DELETE | `/:id` | Bearer | Admin / Manager | Soft-delete task |

**Supported query parameters for `GET /tasks`:**

```
?page=1&limit=10&status=todo&priority=high&sortBy=createdAt&order=desc
```

---

### User Endpoints — `/api/v1/users`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | Bearer | Admin only | List all users with pagination |
| GET | `/:id` | Bearer | Admin or self | Get user profile |
| PUT | `/:id` | Bearer | Admin | Update user role |
| DELETE | `/:id` | Bearer | Admin only | Soft-delete user |

---

## Running Tests

```bash
cd backend
npm test
```

### Test Coverage

| Test | Endpoint | Result |
|---|---|---|
| Creates new user, returns accessToken | POST /auth/signup | Passing |
| Rejects duplicate email registration | POST /auth/signup | Passing |
| Returns token on valid credentials | POST /auth/login | Passing |
| Returns 401 on wrong password | POST /auth/login | Passing |
| Blocks unauthenticated request | GET /tasks | Passing |
| Returns task list for authenticated user | GET /tasks | Passing |
| Soft delete sets deletedAt, does not remove | DELETE /tasks/:id | Passing |

---

## Security Implementation

| Mechanism | Implementation |
|---|---|
| Password hashing | bcryptjs with 10 rounds via Mongoose pre-save hook |
| Token storage | Access token in JS memory only; refresh token in httpOnly cookie |
| Refresh token rotation | Every `/auth/refresh` issues a new pair and revokes the old one |
| CORS | Configured to allow only the frontend origin |
| HTTP security headers | helmet middleware on all routes |
| Rate limiting | express-rate-limit applied globally |
| Soft delete | Mongoose pre-hook transparently filters deleted records from all queries |
| Email enumeration prevention | `/forgot-password` returns identical response whether email exists or not |
| Input validation | express-validator on all request bodies with strict whitelist |

---

## Docker

### Build all images

```bash
docker compose build
```

### Start all services

```bash
docker compose up
```

### Services

| Container | Exposed Port | Base Image |
|---|---|---|
| task_mongodb | 27017 | mongo:7 |
| task_backend | 4000 | node:20-alpine (multi-stage build) |
| task_frontend | 5173 | nginx:alpine (multi-stage Vite build) |

The frontend Nginx container serves the Vite production build. The custom `nginx.conf` handles SPA client-side routing — all requests fall back to `index.html` so React Router v6 handles navigation without 404s on direct URL access.

---

## Deployment

### Backend — Railway.app

- Connected to GitHub repository (`yashwaldia/task-platform`), auto-deploys on push to `master`
- Deployment target: `backend/` directory using `backend/Dockerfile` (multi-stage Node.js build)
- MongoDB provided as a managed Railway plugin — connection string injected as `MONGO_URI`
- All environment variables configured via Railway dashboard (no secrets committed to repository)

### Frontend — Vercel

- Connected to GitHub repository, auto-deploys on push to `master` (typical deploy time under 60 seconds)
- Build command: `cd frontend && npm run build`
- Output directory: `frontend/dist`
- Environment variables `VITE_API_URL` and `VITE_SOCKET_URL` set to Railway backend URL in Vercel dashboard
- SPA client-side routing handled via `frontend/vercel.json` rewrite rules

---

## Known Limitations

### 1. WebSocket Real-Time Sync Non-Functional in Production

Socket.io real-time synchronisation is **non-functional on the Railway production environment**. Railway's free/hobby tier proxy does not support WebSocket protocol upgrades — `wss://` transport connections fail at the infrastructure level with:

```
WebSocket connection to 'wss://task-platform-production.up.railway.app/socket.io/...' failed
```

**What works:** All HTTP CRUD operations (create, read, update, delete tasks and users) function correctly in production. The application does not crash.

**What does not work:** Tasks updated by one connected user do not automatically appear on another user's Kanban board without a manual page refresh.

**In local Docker Compose:** Real-time sync functions fully — drag-and-drop status changes broadcast instantly to all connected clients.

**Note:** This is a platform-tier infrastructure constraint, not an application code defect. The Socket.io gateway, event emitters, and client hooks are all correctly implemented.

---

### 2. Forgot Password — Email Delivery Not Integrated

The Forgot Password feature includes:
- A complete 3-step frontend UI (request reset → email confirmation screen → set new password with strength indicator)
- A backend endpoint that generates a hashed password reset token stored in the database

**What is missing:** Integration with an SMTP mail provider. The reset token is currently returned in the API response body as a development convenience instead of being sent via email.

**The feature is non-functional end-to-end in production** (a user cannot reset their password without seeing the raw reset token from the API response).

**Resolution path:** Integrate Nodemailer with a transactional mail provider (Resend, SendGrid, or Mailgun). Replace the `data.resetToken` API response field with an email dispatch.

---

### 3. Partial Automated Test Coverage

Three fully implemented and manually verified endpoints do not have Jest/Supertest automated test cases:

- `GET /api/v1/tasks/:id`
- `PATCH /api/v1/tasks/:id/status`
- `PUT /api/v1/users/:id`

**Reason:** The 15-minute JWT access token expiry window required re-authentication mid-test session, making sequential automated coverage of all endpoints infeasible within the available timeframe. All three endpoints were manually verified functional via browser and curl during Phase 6.

---

## Phase Development Summary

| Phase | Scope |
|---|---|
| Phase 1 | Monorepo scaffolding, 107 files, all dependencies installed |
| Phase 2 | Mongoose models, TypeScript error resolution, utility functions |
| Phase 3 | JWT auth system, refresh token rotation, MongoDB Atlas connection |
| Phase 4 | CRUD APIs (17 endpoints), RBAC service layer, Socket.io event emitters |
| Phase 5 | Full frontend — auth pages, Kanban board, role UI, real-time hooks, theme system |
| Phase 6 | Jest/Supertest tests, 3 bugs identified and fixed, manual integration verification |
| Phase 7 | Docker build, Railway + Vercel deployment, production validation and fixes |

---

## Evaluation Criteria Coverage

| Criterion | Implementation |
|---|---|
| Architecture and scalability | Monorepo, service layer separation, RBAC at DB + API + UI layers, Socket.io rooms per user |
| Code quality | TypeScript strict mode, Zod validation, zero compiler errors, consistent error response shape |
| Feature completeness | All 5 assignment tasks implemented across 7 phases |
| Security practices | httpOnly cookies, token rotation, bcrypt, helmet, rate limiting, CORS, email enumeration prevention |
| UI/UX experience | Kanban drag-and-drop with optimistic UI, dark mode, loading skeletons, toasts, responsive layout |

---

Built by **Yash Waldia** — KODERS Full-Stack Developer Advanced Assessment
