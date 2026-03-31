# InClass System Inventory: Pages, Models, and Technologies

This file is a quick reference for what the system contains at a high level.

## 1) Frontend Pages (React + Vite)

Primary routes are defined in `frontend/src/App.jsx`.

### Auth and onboarding
- `/` -> `Homepage`
- `/login` -> `Login/InClassLogin`
- `/register` -> `Register/InClassRegister`
- `/forgot` -> `ForgotPass/InClassForgotPass`
- `/onboard/biometrics` -> `Onboard/OnboardBiometrics`
- `/faculty/onboard` -> `Faculty/BiometricOnboard`

### Student
- `/student/dashboard` -> `Student/InClassStudent`
- `/student/register-courses` -> `Student/CourseRegistration`
- `/preview/student` -> student preview mode

### Faculty
- `/faculty/dashboard` -> `Faculty/InClassFaculty`
- `/faculty/courses` -> `Faculty/FacultyCourses`
- `/faculty/courses/:courseId` -> `Faculty/CourseDetail`
- `/faculty/sessions` -> `Faculty/SessionsList`
- `/faculty/sessions/:sessionId` -> `Faculty/SessionMonitor`
- `/faculty/profile` -> `Faculty/ProfileEdit`
- `/preview/faculty` -> faculty preview mode

### Admin
- `/inclass/admin/login` -> `Admin/AdminLogin`
- `/admin/dashboard` -> `Admin/AdminDashboard`
- `/admin/old` -> `Admin/InClassAdmin` (legacy page)
- `/preview/admin` -> admin preview mode

### Public/info pages
- `/about`, `/features`, `/contact`, `/report`
- `/terms`, `/privacy`, `/cookies`
- `/careers`, `/apply`, `/help`, `/docs`, `/blog`
- `/developers`, `/support`, `/newsletter`, `/social`
- `/accessibility`, `/guidelines`, `/preview`

## 2) Backend API Modules (Node.js + Express)

Route modules in `backend/routes`:
- `auth.js` -> login/register/auth token flows
- `admin.js` -> admin management operations
- `faculty.js` -> faculty dashboard/course/session operations
- `attendance.js` -> attendance marking and status operations
- `registrations.js` -> student course registration flows
- `reports.js` -> reporting endpoints
- `biometrics.js` -> WebAuthn + face enrollment/verification + consent/status
- `faceRecognition.js` -> face recognition processing endpoints

Realtime:
- `backend/socket.js` -> Socket.io server/events and origin restrictions

## 3) Data Models (PostgreSQL tables)

Defined in `backend/schema.sql`:
- `colleges`
- `departments`
- `users`
- `classes`
- `sessions`
- `enrollments`
- `face_encodings`
- `fingerprint_data`
- `webauthn_credentials`
- `biometric_face`
- `biometric_consent`
- `attendance`
- `expired_code_reports`
- `pending_students`
- `otps`
- `courses`
- `student_registrations`
- `fingerprint_templates`

## 4) Biometric/AI Models and Security Models

### Face model
- FaceNet model files loaded on frontend from `frontend/public/models/facenet` (or CDN via `VITE_CDN_BASE_URL`)
- Loader/verification utility: `frontend/src/utils/faceModels.js`

### Fingerprint/passkey model
- WebAuthn implementation:
  - Frontend: `@simplewebauthn/browser`
  - Backend: `@simplewebauthn/server`
- Credential data stored in `webauthn_credentials`

### Encryption/security model
- AES-256-GCM encryption for sensitive biometric payloads
- Key validation and secure logging: `backend/utils/crypto.js`
- JWT-based auth, rate limiting, Helmet hardening, strict CORS

## 5) Core Technology Stack

### Frontend
- React 19
- Vite 5
- React Router
- Axios
- Socket.io client
- Optional a11y tooling: `@axe-core/react`

### Backend
- Node.js (22.x)
- Express 5
- PostgreSQL (`pg`) + `pgvector`
- Socket.io
- JWT (`jsonwebtoken`)
- Security middleware: `helmet`, `cors`, `express-rate-limit`
- Monitoring: Sentry (`@sentry/node`), Prometheus metrics (`prom-client`)
- Logging libraries present: `pino`, `winston`
- Background/scheduled tasks: `node-cron`

### DevOps and quality
- Render deployment config (`render.yaml`)
- Lint CI workflow (`.github/workflows/lint.yml`)
- ESLint (frontend + backend)
- k6 load tests in `backend/tests/load`

## 6) Quick Reference Files

- App routes: `frontend/src/App.jsx`
- API routes: `backend/routes/*.js`
- Realtime: `backend/socket.js`
- DB schema: `backend/schema.sql`
- Deployment guide: `DEPLOYMENT.md`
- Biometric onboarding guide: `BIOMETRIC_ONBOARDING_README.md`
