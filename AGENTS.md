# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

InClass is a monorepo with two services:

| Service | Directory | Dev command | Port |
|---------|-----------|-------------|------|
| Backend (Express.js 5) | `backend/` | `npm run server` | 4000 |
| Frontend (React 19 + Vite) | `frontend/` | `npm run dev` | 5173 |

PostgreSQL 16 is required and must be running on port 5432 before starting the backend.

### Database setup

1. Start PostgreSQL: `sudo pg_ctlcluster 16 main start`
2. Create user/database (first time only):
   ```
   sudo -u postgres psql -c "CREATE USER inclass WITH PASSWORD 'inclass123';"
   sudo -u postgres psql -c "CREATE DATABASE inclass OWNER inclass;"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE inclass TO inclass;"
   sudo -u postgres psql -c "GRANT ALL ON SCHEMA public TO inclass;" -d inclass
   ```
3. Apply schema: `PGPASSWORD=inclass123 psql -h localhost -U inclass -d inclass -f backend/schema.sql`

The `backend/scripts/setup-schema.js` Node script has a SQL-splitting bug — use `psql -f` directly instead.

### Backend .env

Must exist at `backend/.env` with at minimum:
```
PORT=4000
DATABASE_URL=postgresql://inclass:inclass123@localhost:5432/inclass
JWT_SECRET=dev-jwt-secret-for-local-testing-only
FRONTEND_URL=http://localhost:5173
```

Optional services (Twilio SMS, Gmail SMTP, Google Maps) degrade gracefully when not configured.

### Native dependencies

The `canvas` npm package requires system libraries: `libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`. These are pre-installed in the VM snapshot.

### Running services

- Start backend: `cd backend && npm run server` (uses nodemon for hot reload)
- Start frontend: `cd frontend && npm run dev`
- The backend exits immediately if PostgreSQL is unreachable — always start Postgres first.

### Lint / Build / Test

- Frontend lint: `cd frontend && npm run lint` (pre-existing lint errors exist in the codebase)
- Frontend build: `cd frontend && npm run build`
- Backend has no automated tests (`npm test` is a no-op stub)

### Admin account for testing

Create with: `cd backend && node scripts/createAdmin.js "Test Admin" "admin@inclass.com" "Admin123"`

Login requires the `role` field in the API request body (the frontend handles this automatically).
