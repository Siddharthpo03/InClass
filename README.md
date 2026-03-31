# InClass

InClass is a web-based attendance management system for educational institutions.

## Project Structure

```
InClass/
├── frontend/          # React + Vite frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/           # Express.js backend API
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── package.json
│   └── server.js
└── inclass.db         # SQLite database
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

### Environment Configuration

#### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inclass
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Socket.io
# Uses same port as server

# Optional: Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Optional: Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid
```

#### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory (optional - has defaults):

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

**Note:** If not set, frontend defaults to:
- API: `http://localhost:4000/api` (dev) or `/api` (production)
- Socket: `http://localhost:4000`

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up the database:

```bash
# Run the schema.sql file in your PostgreSQL database
# Using psql:
psql -U your_user -d inclass -f schema.sql

# Or using pgAdmin: Open Query Tool and run schema.sql
```

4. Start the server:

```bash
npm start
# or
npm run server
```

The backend server will run on `http://localhost:4000` (or the port specified in your `.env`).

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend application will be available at `http://localhost:5173` (or the port shown in the terminal).

## API Testing

### Smoke Test

Run the smoke test to verify all API endpoints:

```bash
# From project root
node smoke-test.js

# With custom token (if testing authenticated endpoints)
TOKEN=your_jwt_token node smoke-test.js

# With custom base URL
API_BASE_URL=http://localhost:4000/api node smoke-test.js
```

Results are saved to `smoke-test-report.json`.

### API Documentation

See `api-spec.md` for complete API documentation including:
- All endpoints with request/response formats
- Authentication requirements
- Known issues and mismatches
- Socket.io events

## Features

- User authentication and authorization
- Student, Faculty, and Admin dashboards
- Real-time attendance tracking
- Biometric authentication (WebAuthn/Fingerprint + Face Recognition)
- Course registration system
- Fingerprint assistance workflow
- Geolocation-based attendance verification
- Email notifications

## Technologies Used

### Frontend

- React 19
- Vite
- React Router
- Axios

### Backend

- Node.js
- Express.js
- SQLite
- JWT Authentication
- bcrypt
- Nodemailer
- Googleapis
