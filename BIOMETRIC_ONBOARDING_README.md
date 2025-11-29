# InClass Biometric Onboarding System

Complete implementation of biometric onboarding and verification system with OTP flow, face recognition, and WebAuthn fingerprint support.

## Overview

This system implements:
- **OTP Verification**: Email-based OTP for student face enrollment
- **Face Recognition**: Client-side face detection using face-api.js with liveness checks
- **WebAuthn Fingerprint**: Device biometric enrollment (faculty/admin only)
- **Course Registration**: Student course registration with faculty approval
- **Fingerprint Templates**: Skeleton endpoints for vendor-specific fingerprint integration

## Database Setup

### 1. Run Schema Migration

Execute the updated `schema.sql` file in your PostgreSQL database:

```sql
-- Run InClass/backend/schema.sql in pgAdmin or psql
```

This will create/update:
- `users` table with `college_id`, `department_id`, `face_enrolled`, `fingerprint_enrolled` columns
- `otps` table for OTP storage
- `courses` table for course catalog
- `student_registrations` table for registration requests
- `fingerprint_templates` table for vendor-specific templates
- Existing `colleges` and `departments` tables (already seeded)

### 2. Environment Variables

Add to your `.env` file:

```env
# Existing variables
JWT_SECRET=your_jwt_secret
DATABASE_URL=postgresql://user:password@localhost:5432/inclass
FRONTEND_URL=http://localhost:5173

# New variables for biometrics
BIOMETRIC_ENCRYPTION_KEY=your_32_byte_hex_key  # Generate with: openssl rand -hex 32
FACE_SIMILARITY_THRESHOLD=0.62  # Cosine similarity threshold (0.0-1.0)

# Email configuration for OTP
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# WebAuthn configuration
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=InClass Attendance System
WEBAUTHN_ORIGIN=http://localhost:5173
```

## Backend Setup

### 1. Install Dependencies

```bash
cd InClass/backend
npm install
```

Required packages (already in package.json):
- `@simplewebauthn/server` - WebAuthn server implementation
- `bcrypt` - Password and OTP hashing
- `nodemailer` - Email sending for OTP
- `crypto` - Encryption utilities

### 2. Start Backend Server

```bash
npm start
# or
node index.js
```

Server runs on `http://localhost:4000` by default.

## Frontend Setup

### 1. Install Dependencies

```bash
cd InClass/frontend
npm install
```

Required packages:
- `@simplewebauthn/browser` - WebAuthn browser implementation
- `face-api.js` - Face recognition models

### 2. Download Face Recognition Models

Download face-api.js models and place them in `frontend/public/models/`:

```bash
cd InClass/frontend/public
mkdir -p models
cd models

# Download models from: https://github.com/vladmandic/face-api/tree/master/model
# Required files:
# - ssd_mobilenetv1_model-weights_manifest.json
# - ssd_mobilenetv1_model-shard1
# - face_landmark_68_model-weights_manifest.json
# - face_landmark_68_model-shard1
# - face_recognition_model-weights_manifest.json
# - face_recognition_model-shard1
# - face_recognition_model-shard2
```

Or use a script:

```bash
# Create download script (optional)
curl -O https://raw.githubusercontent.com/vladmandic/face-api/master/model/ssd_mobilenetv1_model-weights_manifest.json
# ... download other files
```

### 3. Start Frontend Dev Server

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## API Endpoints

### Authentication & OTP

- `POST /api/auth/register` - Register new user (returns `userId` and `token`)
- `POST /api/auth/send-otp` - Send OTP to user's email
- `POST /api/auth/verify-otp` - Verify OTP code
- `GET /api/auth/colleges` - List colleges (with optional `?search=...`)
- `GET /api/auth/departments` - List departments (with optional `?search=...`)

### Biometrics

- `POST /api/biometrics/consent` - Record biometric consent
- `POST /api/biometrics/face/enroll` - Enroll face embedding
- `POST /api/biometrics/face/verify` - Verify face against stored enrollment
- `POST /api/biometrics/webauthn/register/options` - Get WebAuthn registration options
- `POST /api/biometrics/webauthn/register/complete` - Complete WebAuthn registration
- `POST /api/biometrics/webauthn/auth/options` - Get WebAuthn authentication options
- `POST /api/biometrics/webauthn/auth/complete` - Complete WebAuthn authentication
- `GET /api/biometrics/status?userId=...` - Get enrollment status

### Course Registration

- `POST /api/registrations` - Student registers for a course
- `GET /api/registrations/my-registrations` - Get student's registrations
- `GET /api/faculty/courses/:courseId/registrations` - Get pending registrations (faculty)
- `POST /api/faculty/registrations/:id/approve` - Approve registration (faculty)
- `POST /api/faculty/registrations/:id/reject` - Reject registration (faculty)

### Faculty Courses

- `POST /api/faculty/courses` - Create new course
- `GET /api/faculty/:facultyId/courses` - List courses by faculty
- `GET /api/faculty/list?collegeId=...&departmentId=...` - List faculty by college/department

### Fingerprint Templates (Skeleton)

- `POST /api/fingerprint/register/options` - Start fingerprint registration session (faculty-only)
- `POST /api/fingerprint/register/complete` - Complete fingerprint registration (faculty-only)

## Testing Flow

### 1. Student Registration & Onboarding

1. **Register Student**:
   - Navigate to `/register`
   - Select role: "Student"
   - Fill in details (name, email, mobile, password, roll_no)
   - Select college and department from dropdowns
   - Submit → Redirects to `/onboard/biometrics?userId=<id>`

2. **Biometric Onboarding**:
   - Check consent checkbox
   - **OTP Flow** (students only):
     - Click "Send OTP to Email"
     - Check email for 6-digit OTP
     - Enter OTP and click "Verify OTP"
   - **Face Enrollment**:
     - Click "Enroll Face"
     - Allow camera access
     - Position face in frame
     - Click "Capture Picture"
     - Review and click "Confirm & Enroll"
   - Click "Test Face" to verify enrollment
   - Click "Continue to Login" when done

3. **Course Registration**:
   - Login as student
   - Navigate to course registration page
   - Select faculty from list (filtered by college/department)
   - View courses by selected faculty
   - Select courses and submit registration requests
   - Wait for faculty approval

### 2. Faculty Registration & Course Management

1. **Register Faculty**:
   - Navigate to `/register`
   - Select role: "Faculty"
   - Fill in details (including college and department)
   - Submit → Redirects to `/onboard/biometrics?userId=<id>`

2. **Biometric Onboarding** (Faculty):
   - Check consent checkbox
   - **WebAuthn Enrollment**:
     - Click "Register Device Biometric"
     - Use device fingerprint/Face ID/Windows Hello
   - **Face Enrollment**:
     - Click "Enroll Face"
     - Complete face capture
   - Both biometrics required for faculty

3. **Create Course**:
   - Login as faculty
   - Navigate to faculty dashboard
   - Create new course (course code, name, description, credits, etc.)
   - Course appears in course list

4. **Approve Student Registrations**:
   - View pending registrations for each course
   - Approve or reject requests
   - Optionally register student fingerprint (skeleton endpoint)

### 3. Testing OTP Flow

```bash
# Test OTP generation
curl -X POST http://localhost:4000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"userId": 1}'

# Test OTP verification
curl -X POST http://localhost:4000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"userId": 1, "otp": "123456"}'
```

### 4. Testing Face Enrollment

```bash
# Test face enrollment
curl -X POST http://localhost:4000/api/biometrics/face/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": 1,
    "embedding": [0.1, 0.2, ...]  # 128-dimensional array
  }'

# Test face verification
curl -X POST http://localhost:4000/api/biometrics/face/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": 1,
    "embedding": [0.1, 0.2, ...]
  }'
```

## Security Considerations

1. **HTTPS Required**: WebAuthn requires HTTPS (use mkcert for local development)
2. **Encryption**: Face embeddings are encrypted using AES-256-GCM before storage
3. **OTP Security**: OTPs are hashed with bcrypt and expire after 5 minutes
4. **Rate Limiting**: Implement rate limiting on OTP endpoints (recommended)
5. **Consent Logging**: Biometric consent is logged with IP and user agent

## Fingerprint Vendor Integration

The fingerprint template endpoints (`/api/fingerprint/register/*`) are skeleton implementations. To integrate with a vendor SDK:

1. Replace the skeleton endpoints with vendor-specific code
2. Update `fingerprint_templates` table schema if needed
3. Implement vendor-specific enrollment and verification flows
4. Update faculty dashboard UI to use vendor SDK

Example vendors:
- Suprema
- ZKTeco
- Custom hardware

## Troubleshooting

### Face Models Not Loading

- Ensure models are in `frontend/public/models/`
- Check browser console for 404 errors
- Verify dev server is running
- Check Network tab in DevTools

### OTP Not Sending

- Verify `EMAIL_USER` and `EMAIL_PASS` in `.env`
- Check nodemailer configuration
- Verify email service allows "less secure apps" or use app password
- Check backend logs for email errors

### WebAuthn Not Working

- Ensure HTTPS (or localhost for development)
- Check `WEBAUTHN_RP_ID` matches your domain
- Verify `WEBAUTHN_ORIGIN` matches frontend URL
- Check browser console for WebAuthn errors

### Database Errors

- Run `schema.sql` to ensure all tables exist
- Check PostgreSQL connection in `db.js`
- Verify foreign key constraints are satisfied

## File Structure

```
InClass/
├── backend/
│   ├── routes/
│   │   ├── auth.js          # OTP endpoints, registration
│   │   ├── biometrics.js    # Face & WebAuthn endpoints
│   │   ├── registrations.js # Course registration endpoints
│   │   ├── faculty.js       # Course creation, faculty listing
│   │   └── fingerprintRecognition.js  # Skeleton fingerprint endpoints
│   ├── utils/
│   │   ├── otp.js           # OTP generation & hashing
│   │   ├── crypto.js        # AES-256 encryption
│   │   └── mailer.js        # Email sending
│   └── schema.sql           # Database schema
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Register/
    │   │   │   └── InClassRegister.jsx  # Updated with college_id/department_id
    │   │   ├── Onboard/
    │   │   │   └── OnboardBiometrics.jsx  # OTP flow, conditional fingerprint
    │   │   ├── JoinCourse/
    │   │   │   └── JoinCourse.jsx  # Course registration UI
    │   │   └── Faculty/
    │   │       └── InClassFaculty.jsx  # Course creation & approvals
    │   ├── hooks/
    │   │   └── useDeviceChecks.js  # Device capability detection
    │   └── utils/
    │       └── faceModels.js  # Face-api.js model loading
    └── public/
        └── models/  # Face recognition models (download separately)
```

## Next Steps

1. **Production Deployment**:
   - Set up HTTPS with valid SSL certificate
   - Configure production email service (SendGrid, AWS SES, etc.)
   - Use Redis for OTP storage (instead of database)
   - Implement rate limiting
   - Set up monitoring and logging

2. **Fingerprint Vendor Integration**:
   - Choose vendor SDK
   - Implement enrollment flow
   - Implement verification flow
   - Update UI for vendor-specific features

3. **Attendance Enforcement**:
   - Update attendance routes to check `face_enrolled` and `fingerprint_enrolled`
   - Require face verification for all users
   - Require fingerprint verification for users with `fingerprint_enrolled = true`
   - Fallback to OTP for students without fingerprint

## Support

For issues or questions, check:
- Backend logs: `console.log` output
- Frontend console: Browser DevTools
- Database: pgAdmin or psql queries
- Network: DevTools Network tab

