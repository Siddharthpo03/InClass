# InClass – Production Deployment Documentation

This document describes how to deploy the **InClass** biometric attendance system to production. It covers architecture, platforms, environment variables, deployment steps, database setup, health checks, rollback, monitoring, and security.

---

## 1. Project Architecture

| Layer        | Technology |
|-------------|------------|
| **Frontend** | Vite / React |
| **Backend**  | Node.js / Express |
| **Database** | PostgreSQL (with pgvector for embeddings) |
| **Biometrics** | FaceNet (client-side verification) + WebAuthn (passkeys) |
| **Realtime** | Socket.io |

- The frontend is a single-page application (SPA) built with Vite and React. It talks to the backend over HTTPS and uses Socket.io for real-time updates (e.g. attendance events).
- The backend is an Express API that handles auth, faculty/attendance/reports, face and biometric routes, and serves the Socket.io server.
- PostgreSQL stores users, courses, attendance, and WebAuthn credentials; the `vector` extension is used for face embeddings where applicable.
- FaceNet runs in the browser for face verification; the server may store/compare embeddings. WebAuthn is used for passkey-based authentication.
- Socket.io is used for real-time communication (e.g. live attendance, notifications).

---

## 2. Deployment Platforms

| Component   | Platform | Notes |
|------------|----------|--------|
| **Frontend** | **Vercel** | Static/SPA deploy from `frontend` directory; use `dist` as output. |
| **Backend**  | **Render** | Node.js web service; `render.yaml` defines `inclass-backend` (rootDir: `backend`). |
| **Database** | **Render PostgreSQL** or **Railway** | Managed PostgreSQL; use connection string as `DATABASE_URL`. |

- **Render**: The repo includes `render.yaml` for backend and optional static/frontend and database. For production, frontend is typically on Vercel and database on Render or Railway.
- **Vercel**: Connect the repo, set root to `frontend`, build command `npm run build`, output directory `dist`, and configure `VITE_*` env vars.
- **Railway**: Can host PostgreSQL; create a database and use the provided URL as `DATABASE_URL` for the backend.

---

## 3. Environment Variables

All required and common optional variables are listed below. **Never commit real secrets to the repo.**

### Backend (Node.js / Express)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. `postgresql://user:password@host:port/dbname`). Used by the backend for all DB access. |
| `JWT_SECRET` | Yes | Secret key used to sign and verify JWT tokens. Use a long, random value (e.g. 32+ chars). Compromise allows forging sessions. |
| `ADMIN_SECRET` | Yes | Shared secret for admin-only operations (e.g. create/list/delete admins). Keep confidential. |
| `BIOMETRIC_ENCRYPTION_KEY` | Yes | Key used to encrypt/decrypt sensitive biometric data at rest. Must be consistent across restarts; use a fixed 32-byte (hex) or base64 key. |
| `WEBAUTHN_RP_ID` | Yes (production) | WebAuthn Relying Party ID (e.g. `yourdomain.com`). Must match the frontend origin; use `localhost` only for local dev. |
| `FRONTEND_URL` | Yes | Allowed frontend origin for CORS (e.g. `https://yourapp.vercel.app`). No trailing slash. |
| `SOCKET_ORIGINS` | Yes | Comma-separated list of allowed Socket.io origins (e.g. `https://yourapp.vercel.app`). Do not use `*` in production. |
| `PORT` | No | Port the server listens on (default often 3000 or set by platform). Render sets this automatically. |
| `NODE_ENV` | No | `production` or `development`. Affects logging, CORS, and some security behavior. |
| `SENTRY_DSN` | No | Sentry DSN for error tracking. If set, backend and Socket.io can report errors to Sentry. |
| `VITE_API_BASE_URL` | N/A (frontend) | Backend API base URL (e.g. `https://inclass-backend.onrender.com`). Set in **frontend** env (Vercel) so `VITE_` is embedded in build. |

Optional (feature-specific): e.g. Twilio (`TWILIO_*`), Nodemailer/SMTP, Google APIs, etc. See `backend/.env.example` for the full list.

### Frontend (Vite / React)

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_API_BASE_URL` | Yes | Backend API URL (e.g. `https://inclass-backend.onrender.com`). In Vercel, set as Environment Variable so it’s available at build time. |

Other `VITE_*` variables may be defined in `frontend/.env.example`; only those prefixed with `VITE_` are exposed to the client bundle.

---

## 4. Backend Deployment Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd InClass
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm ci
   ```

3. **Set environment variables**  
   Create a `.env` file (or set in Render dashboard / Railway / host env). Include at least:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ADMIN_SECRET`
   - `BIOMETRIC_ENCRYPTION_KEY`
   - `WEBAUTHN_RP_ID`
   - `FRONTEND_URL`
   - `SOCKET_ORIGINS`
   - `NODE_ENV=production`
   Optionally: `PORT`, `SENTRY_DSN`, and any Twilio/email/API keys.

4. **Run database migrations**  
   Ensure PostgreSQL is running and `DATABASE_URL` is set. Apply the schema:
   ```bash
   psql "$DATABASE_URL" -f schema.sql
   ```
   Or from repo root:
   ```bash
   psql "$DATABASE_URL" -f backend/schema.sql
   ```
   (If you use `node-pg-migrate` in the future, run the migration command defined in `package.json` instead or in addition.)

5. **Start the server**
   ```bash
   npm start
   ```
   This runs `node server.js` (Express + Socket.io). On Render, `buildCommand` is `npm install` and `startCommand` is `npm start` with `rootDir: backend`.

---

## 5. Frontend Deployment Steps

1. **Install dependencies**
   ```bash
   cd frontend
   npm ci
   ```

2. **Set VITE environment variables**  
   For local build, create `frontend/.env.production` (or set in Vercel):
   ```env
   VITE_API_BASE_URL=https://your-backend-url.onrender.com
   ```
   In Vercel: Project → Settings → Environment Variables → add `VITE_API_BASE_URL` for Production (and Preview if desired).

3. **Run build**
   ```bash
   npm run build
   ```
   Output is in `frontend/dist`.

4. **Deploy to Vercel**
   - Connect the repo to Vercel.
   - Root Directory: `frontend`.
   - Build Command: `npm run build`.
   - Output Directory: `dist`.
   - Add `VITE_API_BASE_URL` and any other `VITE_*` variables.
   - Deploy. Subsequent pushes to the main branch can auto-deploy.

---

## 6. Database Setup

1. **Create PostgreSQL database**
   - **Render**: Create a PostgreSQL instance from the dashboard (or via `render.yaml`). Copy the internal or external `DATABASE_URL`.
   - **Railway**: Create a new PostgreSQL service and copy the `DATABASE_URL` from variables.

2. **Enable required extension**
   The schema uses the `vector` extension. If your provider doesn’t enable it by default, run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Run migrations**
   Apply the consolidated schema:
   ```bash
   psql "$DATABASE_URL" -f backend/schema.sql
   ```
   This creates tables (e.g. users, colleges, departments, courses, attendance, webauthn_credentials), indexes, and seed data. Safe to run multiple times (uses `IF NOT EXISTS` and conditional logic).

4. **Create initial admin (optional)**
   From `backend`:
   ```bash
   node scripts/createAdmin.js
   ```
   Use the same `ADMIN_SECRET` and ensure `DATABASE_URL` is set.

---

## 7. Health Checks

**Endpoint:** `GET /health` (and `GET /api/health` with the same behavior)

**Purpose:** Used by load balancers, Render, and monitoring to verify the app and database are up.

**Expected response (200 OK when healthy):**
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 123.456,
  "memory": { "rss": 12345678, "heapTotal": 1234567, "heapUsed": 1234567, "external": 123 },
  "environment": "production",
  "timestamp": "2025-03-02T12:00:00.000Z",
  "responseTimeMs": 5
}
```

**On failure (500):** Database unreachable or query error. Response body includes `"status": "error"`, `"database": "disconnected"`, and an `error` message (for debugging; avoid exposing internals in public docs).

Configure your platform (e.g. Render) to use `GET /health` as the health check path if supported.

---

## 8. Rollback Procedure

If a deployment fails or introduces critical issues:

1. **Revert the git commit**
   ```bash
   git revert <bad-commit-hash> --no-edit
   git push origin main
   ```
   Or reset and force-push (only if the team agrees and no one else has pulled):
   ```bash
   git reset --hard <last-good-commit>
   git push --force origin main
   ```

2. **Redeploy previous version**
   - **Render**: Trigger a new deploy from the dashboard (after revert), or use a previous release if the platform keeps history.
   - **Vercel**: Same; redeploy from the repo state after revert, or promote a previous deployment.

3. **Restore database backup (if needed)**
   If the bad release ran destructive migrations or scripts:
   - Restore from a pre-deployment PostgreSQL backup (Render/Railway backups or your own pg_dump).
   - Point the app’s `DATABASE_URL` to the restored DB if you use a separate DB instance for rollback.

Document who can approve rollbacks and where backups are stored and how to restore them.

---

## 9. Monitoring

- **Sentry (optional)**  
  Set `SENTRY_DSN` in the backend. The app and Socket.io can send unhandled exceptions and relevant context to Sentry. Use Sentry for alerts, release tracking, and performance if configured.

- **Server logs**  
  Backend uses Winston (see `backend/utils/logger.js`). Logs go to stdout/stderr; on Render (or similar), view them in the service logs. Do not log secrets or raw biometric data.

- **Socket monitoring**  
  Socket.io connection/disconnect and errors can be logged via the same logger. Optional: log disconnect spikes or connection counts for capacity and abuse detection. Keep PII and credentials out of logs.

---

## 10. Security Notes

- **JWT_SECRET**  
  Used to sign and verify JWTs. If leaked or weak, attackers can forge valid sessions. Use a long, cryptographically random value (e.g. 32+ characters) and rotate if compromise is suspected. Never commit it to the repo.

- **WEBAUTHN_RP_ID**  
  Must match the domain users see in the browser (e.g. `yourdomain.com`). Mismatch or using `localhost` in production can break or weaken WebAuthn. Set it explicitly in production and validate origin on the server.

- **BIOMETRIC_ENCRYPTION_KEY**  
  Protects biometric data at rest. Use a fixed, strong key (e.g. 32 bytes). Losing it may make existing encrypted data unrecoverable; rotating requires re-encryption. Store in a secrets manager and restrict access.

Keep all of the above (and `ADMIN_SECRET`, `DATABASE_URL`) in platform secret/env config only, and restrict who can view or change production environment variables.
