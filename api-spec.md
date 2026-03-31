# InClass API Specification

**Last Updated:** 2024-12-19  
**Base URL:** `http://localhost:4000/api` (development)  
**Authentication:** JWT Bearer token in `Authorization` header

## Status Legend
- ✅ **Working** - Endpoint confirmed working
- ⚠️ **Partial** - Endpoint exists but may have issues
- ❌ **404/Missing** - Endpoint returns 404 or not implemented
- 🔄 **Needs Review** - Endpoint exists but contract needs verification

---

## Authentication Endpoints

### POST `/api/auth/login`
**Status:** ✅ Working  
**Auth:** None  
**Description:** User login with email/password  
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "student|faculty|admin",
  "embedding": [0.1, 0.2, ...] // Optional: face verification embedding
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful.",
  "user": { "id": 1, "name": "John Doe", "role": "student" },
  "token": "jwt_token_here",
  "role": "student"
}
```

### POST `/api/auth/register`
**Status:** ✅ Working  
**Auth:** None  
**Description:** User registration with file uploads  
**Request:** `multipart/form-data`  
**Fields:**
- `name`, `email`, `password`, `role`, `roll_no`
- `passportPhoto` (file)
- `faceImage` (file)
- `college_id`, `department_id`
- `mobile_number`, `country_code`

### GET `/api/auth/profile`
**Status:** ✅ Working  
**Auth:** Required (all roles)  
**Description:** Get authenticated user's profile  
**Response:**
```json
{
  "name": "John Doe",
  "role": "student",
  "id": "ROLL123",
  "userId": 1,
  "hasFingerprint": false,
  "email": "user@example.com",
  "college_id": 1,
  "department_id": 1
}
```

### GET `/api/auth/check-email`
**Status:** ✅ Working  
**Auth:** None  
**Description:** Check if email exists and return role  
**Query Params:** `?email=user@example.com`  
**Response:**
```json
{
  "exists": true,
  "role": "student"
}
```

### GET `/api/auth/colleges`
**Status:** ✅ Working  
**Auth:** None  
**Description:** Get list of colleges  
**Query Params:** `?search=MIT` (optional)

### GET `/api/auth/departments`
**Status:** 🔄 Needs Review  
**Auth:** None  
**Description:** Get list of departments

---

## Faculty Endpoints

### GET `/api/faculty/my-courses`
**Status:** ✅ Working  
**Auth:** Required (faculty)  
**Description:** Get faculty's courses  
**Response:**
```json
[
  {
    "id": 1,
    "course_code": "CS401",
    "title": "Database Systems",
    "has_active_session": false,
    "student_count": 25
  }
]
```

### GET `/api/faculty/courses/:courseId`
**Status:** ✅ Working  
**Auth:** Required (faculty)  
**Description:** Get single course details

### GET `/api/faculty/course-roster/:courseId`
**Status:** ✅ Working  
**Auth:** Required (faculty)  
**Description:** Get course roster (enrolled students)  
**Response:**
```json
{
  "roster": [
    {
      "id": 1,
      "student_id": 1,
      "name": "Student Name",
      "roll_no": "ROLL123"
    }
  ]
}
```

### GET `/api/faculty/sessions`
**Status:** ✅ Working  
**Auth:** Required (faculty)  
**Description:** Get all sessions for faculty  
**Response:**
```json
[
  {
    "id": 1,
    "code": "ABC123",
    "class_id": 1,
    "expires_at": "2024-12-19T10:00:00Z",
    "is_active": true,
    "created_at": "2024-12-19T09:00:00Z"
  }
]
```

### GET `/api/faculty/sessions/:sessionId`
**Status:** ✅ Working  
**Auth:** Required (faculty)  
**Description:** Get session details

### GET `/api/faculty/sessions/:sessionId/attendance`
**Status:** ✅ Working  
**Auth:** Required (faculty)  
**Description:** Get attendance for a session

### POST `/api/faculty/sessions/:sessionId/end`
**Status:** ✅ Working  
**Auth:** Required (faculty)  
**Description:** End a session

### POST `/api/faculty/start-session`
**Status:** ✅ Working  
**Auth:** Required (faculty)  
**Body:**
```json
{
  "courseId": 1,
  "duration": 30
}
```

### POST `/api/faculty/manual-attendance`
**Status:** ✅ Working  
**Auth:** Required (faculty)  
**Body:**
```json
{
  "student_id": 1,
  "session_id": 1,
  "reason": "Manual override reason",
  "status": "Present|Absent"
}
```

### GET `/api/faculty/list`
**Status:** ✅ Working  
**Auth:** None (public)  
**Query Params:** `?collegeId=1&departmentId=1`  
**Description:** Get faculty list filtered by college/department

### GET `/api/faculty/:facultyId/courses`
**Status:** ✅ Working  
**Auth:** None (public)  
**Description:** Get courses offered by a faculty

### POST `/api/faculty/registrations/:registrationId/approve`
**Status:** ✅ Working  
**Auth:** Required (faculty)  
**Description:** Approve course registration request

### POST `/api/faculty/registrations/:registrationId/reject`
**Status:** ✅ Working  
**Auth:** Required (faculty)  
**Body:**
```json
{
  "reason": "Rejection reason"
}
```

---

## Student Endpoints

### POST `/api/registrations`
**Status:** ✅ Working  
**Auth:** Required (student)  
**Description:** Register for a course  
**Body:**
```json
{
  "courseId": 1
}
```

### GET `/api/registrations/my-registrations`
**Status:** ✅ Working  
**Auth:** Required (student)  
**Description:** Get student's course registrations

### GET `/api/registrations/pending`
**Status:** ❌ 404/Missing  
**Auth:** Required (faculty)  
**Description:** Get pending course registrations for faculty  
**Note:** Endpoint not yet implemented - frontend handles 404 gracefully

---

## Biometrics Endpoints

### GET `/api/biometrics/status`
**Status:** ✅ Working  
**Auth:** Required (student/faculty)  
**Query Params:** `?userId=1`  
**Response:**
```json
{
  "webauthn": true,
  "face": true,
  "consent": true,
  "consentMethod": "both"
}
```

### GET `/api/biometrics/assist`
**Status:** ⚠️ Partial  
**Auth:** Required (faculty)  
**Query Params:** `?college_id=1&department_id=1&status=pending&assigned_faculty_id=1`  
**Description:** Get fingerprint assist requests  
**Note:** Uses `expired_code_reports` table with fingerprint filter

### POST `/api/biometrics/assist/assign`
**Status:** ✅ Working  
**Auth:** Required (faculty)  
**Body:**
```json
{
  "requestId": 1,
  "facultyId": 1
}
```

### POST `/api/biometrics/assist/complete`
**Status:** ✅ Working  
**Auth:** Required (faculty)  
**Body:**
```json
{
  "requestId": 1
}
```

### POST `/api/biometrics/need-fingerprint-assist`
**Status:** ✅ Working  
**Auth:** Required (student)  
**Body:**
```json
{
  "faculty_id": 1,
  "message": "Need help with fingerprint",
  "device_info": {}
}
```

### POST `/api/biometrics/webauthn/register/start`
**Status:** ✅ Working  
**Auth:** Required (student/faculty)  
**Description:** Start WebAuthn registration

### POST `/api/biometrics/webauthn/register/finish`
**Status:** ✅ Working  
**Auth:** Required (student/faculty)  
**Description:** Complete WebAuthn registration

### POST `/api/biometrics/webauthn/authenticate/start`
**Status:** ✅ Working  
**Auth:** Required (student/faculty)  
**Description:** Start WebAuthn authentication

### POST `/api/biometrics/webauthn/authenticate/finish`
**Status:** ✅ Working  
**Auth:** Required (student/faculty)  
**Description:** Complete WebAuthn authentication

---

## Attendance Endpoints

### POST `/api/attendance/mark`
**Status:** ✅ Working  
**Auth:** Required (student)  
**Body:**
```json
{
  "sessionCode": "ABC123",
  "fingerprintVerified": true,
  "faceVerified": true
}
```

---

## Reports Endpoints

### POST `/api/reports/duplicate-detection`
**Status:** ✅ Working  
**Auth:** Required (faculty)  
**Body:**
```json
{
  "session_id": 1
}
```

### POST `/api/reports/expired-code`
**Status:** ⚠️ Partial  
**Auth:** Required (student)  
**Description:** Report expired code (also used for fingerprint assist)

---

## Face Recognition Endpoints

### POST `/api/face/enroll`
**Status:** ✅ Working  
**Auth:** Required (student/faculty)  
**Description:** Enroll face for recognition

### POST `/api/face/verify`
**Status:** ✅ Working  
**Auth:** Required (student/faculty)  
**Description:** Verify face during login/attendance

---

## Known Issues & Mismatches

### 1. `/api/registrations/pending` - 404
- **Frontend:** Calls this endpoint in `PendingCourseRegistrations.jsx`
- **Backend:** Route exists but may not be registered properly
- **Status:** Frontend handles 404 gracefully with fallback UI
- **Action:** Verify route is mounted correctly in `backend/index.js`

### 2. Fingerprint Assist Query
- **Issue:** Query filters by `report_reason LIKE '%fingerprint%'` which may not match all requests
- **Status:** Fixed with case-insensitive query
- **Action:** Verify requests are stored with correct format

### 3. Course Registration Status
- **Issue:** Status may be stored as 'Pending' (capital P) vs 'pending' (lowercase)
- **Status:** Fixed with `LOWER(sr.status) = 'pending'` in query
- **Action:** Verify database consistency

---

## Environment Configuration

### Frontend
- **Base URL:** `VITE_API_BASE_URL` or defaults to `http://localhost:4000/api`
- **Socket URL:** `VITE_SOCKET_URL` or defaults to `http://localhost:4000`

### Backend
- **Port:** `PORT` or defaults to `4000`
- **Database:** PostgreSQL connection via `db.js`
- **JWT Secret:** `JWT_SECRET` in `.env`

---

## Socket.io Events

### Client → Server
- `join:session` - Join session room
- `join:faculty` - Join faculty room
- `join:college` - Join college room
- `join:department` - Join department room
- `join:student` - Join student room

### Server → Client
- `attendance:marked` - Attendance was marked
- `attendance:updated` - Attendance was updated
- `session:ended` - Session ended
- `fingerprint:assist:created` - New fingerprint assist request
- `fingerprint:assist:assigned` - Assist was assigned
- `fingerprint:assist:completed` - Assist was completed
- `registration:created` - New course registration
- `registration:approved` - Registration approved
- `registration:rejected` - Registration rejected

---

## Next Steps

1. ✅ Frontend defensive handling added
2. ⏳ Verify all endpoints are properly mounted
3. ⏳ Run smoke test to confirm all endpoints
4. ⏳ Update this spec as endpoints are fixed
5. ⏳ Add OpenAPI/Swagger generation if needed

