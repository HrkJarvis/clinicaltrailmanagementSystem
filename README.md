# Clinical Trial Manager

A secure, role-based web application to manage clinical trials end-to-end. It supports creating, updating, tracking, and auditing trials with robust validation, modern UI/UX, and clear separation of roles for Admin and Users (Researcher/Coordinator).

## Table of Contents

- Overview
- Features
- Architecture
- Project Structure
- Getting Started
- Environment Variables
- Running the App
- Authentication & Roles
- API Overview
- Data Validation
- Frontend UX Details
- Logging & Error Handling
- Testing
- Deployment Notes
- Roadmap (Future Work)
- Troubleshooting
- Security Considerations

## Overview

- Stack: React, Node.js, Express, MongoDB (Mongoose), Passport.js, Axios
- Style: Custom CSS in `frontend/src/index.css` with a small design system (colors, spacing, radii, shadows)
- Auth: Session-based with Passport; user and admin login portals
- Data: Strict model validations (dates, enrollments, IDs) + route-level checks

## Features

- Role-Based Auth:
  - Admin portal (admin only)
  - User portal for researcher/coordinator
  - Admin self-registration disabled by design
- Trials Management:
  - CRUD with strict server-side validations
  - Search, filters (status, phase, therapeutic area), pagination
  - Enrollment and date validations
- UX:
  - Responsive tables (desktop fits, mobile scrolls)
  - Modern home hero, feature cards, and footer
  - Tight spacing to avoid phantom scrollbars
- Quality:
  - Robust error messages
  - Input cleanup and payload normalization
  - Clear API response structure

## Architecture

- Frontend: React SPA with context-based auth (`contexts/AuthContext.js`), API service (`services/api.js`)
- Backend: Express routes, Mongoose models, Passport local strategy, session cookies
- Data Model: `ClinicalTrial` with cross-field validations

## Project Structure

```
clinical trail/
├── backend/
│   ├── models/
│   │   ├── ClinicalTrial.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── trials.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.js
│   │   │   │   └── Footer.js
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   ├── Register.js
│   │   │   │   └── AdminLogin.js
│   │   │   └── trials/
│   │   │       ├── TrialsList.js
│   │   │       └── TrialForm.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## Getting Started

Prerequisites:

- Node.js LTS
- MongoDB (local or Atlas)

Install:

- Backend
  - `cd backend`
  - `npm install`
- Frontend
  - `cd frontend`
  - `npm install`

## Environment Variables

Backend (`backend/.env`):

```
MONGODB_URI=mongodb://localhost:27017/clinical-trials
SESSION_SECRET=<your-secret>
PORT=5000
NODE_ENV=development
```

Frontend (`frontend/.env`, optional):

```
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the App

1) Start MongoDB

2) Start backend

```
cd backend
npm run dev  # or npm start
```

3) Start frontend

```
cd frontend
npm start
```

URLs:

- Frontend: http://localhost:3000
- API: http://localhost:5000/api

## Authentication & Roles

- Roles: `admin`, `researcher`, `coordinator`
- Registration:
  - Only `researcher`/`coordinator` can register from UI
  - Admin registration is disabled
- Portals:
  - `/login` User login (portal=user)
  - `/admin` Admin login (portal=admin)
- Enforcement:
  - Backend enforces portal: admin cannot login via `/login`; users cannot login via `/admin`

Initial Admin Provisioning:

- Create admin manually in DB (recommended 1 admin), or add a dev-only seed script

## API Overview

Base: `/api`

Auth:

- `POST /auth/register` — Register researcher/coordinator (admin role is rejected)
- `POST /auth/login` — Login; expects `portal` flag in payload
- `POST /auth/logout` — Logout
- `GET /auth/user` — Current user
- `GET /auth/check` — Auth status
- `PUT /auth/profile` — Update profile

Trials:

- `GET /trials` — List with filters: `page`, `limit`, `status`, `phase`, `therapeuticArea`, `search`
- `GET /trials/:id` — Single trial
- `POST /trials` — Create (role-based access)
- `PUT /trials/:id` — Update (owner or admin)
- `DELETE /trials/:id` — Delete (owner or admin)

## Data Validation

- `trialId`: uppercase letters/numbers/hyphens only (e.g., `ONC-2025-00125`)
- Dates: `endDate` must be strictly after `startDate`
- Enrollment:
  - `estimatedEnrollment`: 1..100000
  - `actualEnrollment`: 0..`estimatedEnrollment`
- Cross-field rules enforced via `document.save()` on update to ensure the validator sees the entire doc

## Frontend UX Details

- Tables:
  - Desktop: Actions column width reserved, clipped within rounded cards; no page-wide horizontal scroll
  - Mobile (≤768px): table is horizontally scrollable inside the card (`overflow-x: auto`)
- Number Inputs:
  - Spinner arrows removed for better typing control
  - Optional JS blur on wheel to prevent accidental changes
- Forms:
  - Client-side validations mirror server rules
  - Dates are sent as ISO strings and normalized on the backend

## Logging & Error Handling

- Backend: Route-level logs for create/update errors
- Frontend: `handleApiError` consolidates server errors; messages are displayed in UI


## Deployment Notes

- Use environment variables for API URL and secrets
- Use secure cookies in production (secure, httpOnly, sameSite)
- Consider build pipeline (CI) and containerization

## Roadmap (Future Work)

Admin:

- Advanced audit logs (who/when/what)
- Role & permission manager (trial-level permissions)
- Soft-deletes with restore
- Bulk import/export of trials (CSV/Excel)
- Analytics dashboards (enrollment trends, overdue trials)
- Configurable reference data (phases, statuses, therapeutic areas)

User (Researcher/Coordinator):

- Attachments for protocols/notes
- Secondary endpoints/criteria builders
- Multi-site management (locations, PI per site)
- Notification center (upcoming milestones)
- Saved filters and smart lists
- Inline editing in trials table

Platform:

- OpenAPI / Swagger docs
- Error tracking (Sentry) and performance monitoring
- Rate limiting and IP allowlist for admin portal
- Email notifications (trial state changes)
- OAuth/SSO integration (Azure AD/Okta) for enterprise

## Troubleshooting

- End date must be after start date → ensure `endDate > startDate`
- Actual enrollment cannot exceed estimated → increase estimated first or reduce actual
- Admin login via user page blocked → use `/admin`; backend enforces portal flag
- Table overlaps card or looks off → hard refresh CSS; Actions column space is reserved

## Security

### Security Features Implemented

- **Password hashing (bcrypt)**
  - User passwords are hashed with bcrypt before storage (`backend/models/User.js`, `pre('save')`).
  - Passwords are removed from all JSON responses via a `toJSON` transform.

- **Session-based authentication (Passport.js)**
  - Authenticated sessions are stored server-side; the client only holds a session ID cookie.
  - Logout fully destroys the session and clears the cookie.

- **Role-based authorization**
  - Route-level checks restrict access based on `user.role` (`trials.js`, `auth.js`).
  - Ownership checks on Trial resources: non-admins may only update/delete what they created.

- **Portal enforcement (anti-confusion)**
  - Backend enforces a `portal` flag at login (`/auth/login`):
    - Admin may only log in via admin portal.
    - Researchers/Coordinators may only log in via user portal.

- **Input validation and sanitization**
  - `express-validator` used for route payload validation (`routes/auth.js`, `routes/trials.js`).
  - Mongoose schema validations and cross-field validators (e.g., `endDate > startDate`, `actual <= estimated`).

- **Least information exposure**
  - Sensitive fields (password) stripped from API responses.
  - Descriptive yet safe error messages via centralized helpers and guarded logs.

- **CORS and base URL separation**
  - Frontend uses `REACT_APP_API_URL` to talk to backend API; can be restricted per environment.

- **Secure defaults in code**
  - Uppercasing and pattern restrictions on `trialId` to reduce inconsistent data.
  - Dates normalized on the server side prior to validation.

### Production Hardening Checklist

- **Cookies & Sessions**
  - Set cookies to `secure`, `httpOnly`, `sameSite=strict` in production.
  - Use a strong `SESSION_SECRET` and rotate periodically.

- **Transport Security**
  - Force HTTPS (HSTS) via reverse proxy (Nginx) or `helmet` in Express.

- **Headers & Protections**
  - Use `helmet` to set safe HTTP headers (XSS protection, frameguard, noSniff, etc.).
  - Consider CSRF protection for state-changing endpoints when using cookies.

- **CORS**
  - Restrict allowed origins to your known frontends; disallow wildcard in production.

- **Rate Limiting & Brute-force Defense**
  - Add request rate limiting (e.g., `express-rate-limit`) especially on `/auth/login`.
  - Add lockout/slowdown on repeated failed logins per IP/username.

- **Input & Output Safety**
  - Continue strict validation; consider payload sanitation libraries where appropriate.
  - Avoid logging secrets, tokens, or PII; mask sensitive fields.

- **Secrets & Config**
  - Never commit secrets; use env or a secret manager (Vault, AWS Secrets Manager).
  - Separate `.env` files per environment; enforce minimal privileges for DB users.

- **Monitoring & Auditing**
  - Enable structured logging; forward to a SIEM (e.g., ELK, Datadog).
  - Add audit trail for CRUD (who/when/what) and expose to admins.

- **Dependencies & Build**
  - Run `npm audit` regularly and keep deps up to date.
  - Pin versions for reproducible builds.

- **Backups & DR**
  - Regular DB backups and restore drills.
  - Separate prod/staging databases and credentials.

## 🚀 Features

- **User Management**: Registration, login, logout with secure authentication
- **Clinical Trial Management**: Create, read, update, delete clinical trials
- **Modern UI**: React-based responsive interface
- **RESTful API**: Node.js/Express backend with MongoDB
- **Secure Authentication**: Passport.js integration

## 🛠️ Tech Stack

### Frontend
- React 18
- Axios for API calls
- React Router for navigation
- CSS3 for styling

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose ODM
- Passport.js for authentication
- bcryptjs for password hashing
- express-session for session management


## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clinical-trials-app
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```
   MONGODB_URI=mongodb://localhost:27017/clinical-trials
   SESSION_SECRET=your-secret-key-here
   PORT=5000
   ```

### Running the Application

1. **Start MongoDB** (if running locally)

2. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### Clinical Trials Endpoints
- `GET /api/trials` - Get all clinical trials
- `POST /api/trials` - Create new clinical trial
- `GET /api/trials/:id` - Get specific clinical trial
- `PUT /api/trials/:id` - Update clinical trial
- `DELETE /api/trials/:id` - Delete clinical trial

## 🧪 Testing

Run tests for both frontend and backend:

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 🔐 Roles & Access Control

- **Roles**: `admin`, `researcher`, `coordinator`
- **Registration**: Public registration is allowed only for `researcher` and `coordinator`. Admin registration via public endpoint is disabled.
- **Admin Login**: Dedicated admin portal at `http://localhost:3000/admin`. If a non-admin logs in via this portal, the session is dropped and an error shown.
- **User Login**: Standard user login at `http://localhost:3000/login`.

### Initial Admin Provisioning

There should be exactly one admin. Create it manually via MongoDB once:

1. Start your backend so the `users` collection exists.
2. Insert a user with role `admin` (password will be hashed if using the app flow; if inserting directly, hash the password accordingly or create via a temporary internal script).

Alternatively, ask us to add a dev-only seed script to create the first admin safely.

## 🧩 Frontend Structure & Behavior

- **Key Components**
  - `frontend/src/components/trials/TrialsList.js`: trials list table with filters, search, pagination, actions (view/edit/delete)
  - `frontend/src/components/trials/TrialForm.js`: create/edit trial form with client-side validation
  - `frontend/src/components/auth/Login.js`: user login
  - `frontend/src/components/auth/AdminLogin.js`: admin-only login
  - `frontend/src/components/auth/Register.js`: public registration (no admin option)

- **Responsive UX**
  - Desktop: table fits inside card with proper padding; actions column width reserved; no page-level horizontal scroll.
  - Mobile (<=768px): trials table is horizontally scrollable inside the card (`overflow-x: auto;`), with a `min-width` to prevent squish.

## 🧭 Routes (Frontend)

- `/` Home
- `/login` User login (researcher/coordinator)
- `/register` Public registration (no admin)
- `/admin` Admin-only login
- `/dashboard` Protected
- `/trials` Protected, list and filter
- `/trials/new` Protected, create trial
- `/trials/:id/edit` Protected, edit trial

## 🔌 API Overview (Backend)

### Auth
- `POST /api/auth/register` — Register researcher/coordinator (admin role is rejected)
- `POST /api/auth/login` — Login; returns `user`
- `POST /api/auth/logout` — Logout
- `GET /api/auth/user` — Current user
- `GET /api/auth/check` — Auth status
- `PUT /api/auth/profile` — Update profile

### Trials
- `GET /api/trials` — List with filters: `page`, `limit`, `status`, `phase`, `therapeuticArea`, `search`
- `GET /api/trials/:id` — Single trial
- `POST /api/trials` — Create (role-based access)
- `PUT /api/trials/:id` — Update (owner or admin)
- `DELETE /api/trials/:id` — Delete (owner or admin)

## ✅ Data Validation Rules (Trials)

- `trialId`: uppercase letters/numbers/hyphens only (e.g., `ONC-2025-00125`)
- `startDate`, `endDate`: ISO dates; `endDate` must be after `startDate`
- `estimatedEnrollment`: integer 1..100000
- `actualEnrollment`: integer >= 0 and `<= estimatedEnrollment`
- Backend enforces cross-field rules using document save on update.

## 🧱 Date Handling

- Frontend sends dates as ISO strings (e.g., `2025-09-27T00:00:00.000Z`).
- Backend normalizes to Date objects and zeroes time for comparisons.

## 🧹 Troubleshooting

- **Validation failed: End date must be after start date**
  - Ensure `endDate > startDate`. The frontend enforces this; if editing existing data, both must be valid.
- **Actual enrollment cannot exceed estimated enrollment**
  - Update `estimatedEnrollment` first or reduce `actualEnrollment`.
- **Admin login says not allowed**
  - Only users with role `admin` can log in via `/admin`. Create the initial admin as described above.
- **Horizontal scrolling on desktop**
  - The table container clips content and reserves space for the actions column. On mobile, horizontal scroll is intentional.

## 🔧 Environment Variables

Create `backend/.env`:

```
MONGODB_URI=mongodb://localhost:27017/clinical-trials
SESSION_SECRET=your-secret-key-here
PORT=5000
```

Optionally `frontend/.env`:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## 📜 Scripts

Backend (from `backend/`):
- `npm run dev` — start with nodemon
- `npm start` — start server

Frontend (from `frontend/`):
- `npm start` — start React dev server


