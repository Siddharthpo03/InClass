# Backend Testing Guide

## Overview
This guide provides comprehensive testing instructions for all backend endpoints and features.

## Prerequisites
1. Backend server running on port 4000
2. PostgreSQL database connected
3. Environment variables configured (.env file)
4. Postman, Insomnia, or curl for API testing
5. Frontend running (for WebAuthn fingerprint testing)

## Test Environment Setup

### 1. Database Setup
```sql
-- Run schema.sql to create all tables
psql -U your_user -d your_database -f schema.sql
```

### 2. Environment Variables
Create `.env` file with:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/inclass
JWT_SECRET=your-secret-key-here
PORT=4000
FRONTEND_URL=http://localhost:5173
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=InClass Attendance System
WEBAUTHN_ORIGIN=http://localhost:5173
```

### 3. Install Dependencies
```bash
cd backend
npm install
```

### 4. Start Server
```bash
npm start
# or for development
npm run server
```

## Test Cases

### Authentication Endpoints

#### 1. User Registration
**POST** `/api/auth/register`

**Test Case 1.1: Successful Registration (Student)**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "role": "student",
  "roll_no": "STU001"
}
```
**Expected:** 201 Created, returns user and token

**Test Case 1.2: Successful Registration (Faculty)**
```json
{
  "name": "Dr. Jane Smith",
  "email": "jane.smith@example.com",
  "password": "SecurePass123!",
  "role": "faculty",
  "roll_no": "FAC001"
}
```
**Expected:** 201 Created

**Test Case 1.3: Duplicate Email**
```json
{
  "name": "Duplicate User",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "role": "student",
  "roll_no": "STU002"
}
```
**Expected:** 409 Conflict, error message about duplicate email

**Test Case 1.4: Invalid Email Format**
```json
{
  "name": "Invalid Email",
  "email": "not-an-email",
  "password": "SecurePass123!",
  "role": "student",
  "roll_no": "STU003"
}
```
**Expected:** 400 Bad Request, validation error

**Test Case 1.5: Missing Required Fields**
```json
{
  "name": "Missing Fields",
  "email": "missing@example.com"
}
```
**Expected:** 400 Bad Request, validation error

#### 2. User Login
**POST** `/api/auth/login`

**Test Case 2.1: Successful Login**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "role": "student"
}
```
**Expected:** 200 OK, returns token and user info

**Test Case 2.2: Invalid Password**
```json
{
  "email": "john.doe@example.com",
  "password": "WrongPassword",
  "role": "student"
}
```
**Expected:** 401 Unauthorized, authentication error

**Test Case 2.3: Role Mismatch**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "role": "faculty"
}
```
**Expected:** 401 Unauthorized, role mismatch error

**Test Case 2.4: Non-existent User**
```json
{
  "email": "nonexistent@example.com",
  "password": "SecurePass123!",
  "role": "student"
}
```
**Expected:** 401 Unauthorized, authentication error

#### 3. Get User Profile
**GET** `/api/auth/profile`
**Headers:** `Authorization: Bearer <token>`

**Test Case 3.1: Valid Token**
**Expected:** 200 OK, returns user profile

**Test Case 3.2: Invalid Token**
**Headers:** `Authorization: Bearer invalid-token`
**Expected:** 401 Unauthorized

**Test Case 3.3: Missing Token**
**Expected:** 401 Unauthorized

### Faculty Endpoints

#### 4. Register Course
**POST** `/api/faculty/register-course`
**Headers:** `Authorization: Bearer <faculty-token>`

**Test Case 4.1: Successful Course Registration**
```json
{
  "course_code": "CS401",
  "title": "Database Systems",
  "total_classes": 40
}
```
**Expected:** 201 Created, returns course info

**Test Case 4.2: Duplicate Course Code**
```json
{
  "course_code": "CS401",
  "title": "Another Database Course",
  "total_classes": 30
}
```
**Expected:** 400 Bad Request, duplicate course code error

**Test Case 4.3: Invalid Class Count**
```json
{
  "course_code": "CS402",
  "title": "Algorithms",
  "total_classes": 0
}
```
**Expected:** 400 Bad Request, validation error

#### 5. Get My Courses
**GET** `/api/faculty/my-courses`
**Headers:** `Authorization: Bearer <faculty-token>`

**Test Case 5.1: Faculty with Courses**
**Expected:** 200 OK, returns array of courses

**Test Case 5.2: Faculty without Courses**
**Expected:** 200 OK, returns empty array

#### 6. Start Attendance Session
**POST** `/api/faculty/start-session`
**Headers:** `Authorization: Bearer <faculty-token>`

**Test Case 6.1: Successful Session Start**
```json
{
  "class_id": 1
}
```
**Expected:** 200 OK, returns session with code and expiration

**Test Case 6.2: Invalid Class ID**
```json
{
  "class_id": 99999
}
```
**Expected:** 400 Bad Request or 500 Error

#### 7. Get Course Roster
**GET** `/api/faculty/course-roster/:classId`
**Headers:** `Authorization: Bearer <faculty-token>`

**Test Case 7.1: Course with Enrolled Students**
**Expected:** 200 OK, returns array of students

**Test Case 7.2: Course without Students**
**Expected:** 200 OK, returns empty array

### Attendance Endpoints

#### 8. Mark Attendance
**POST** `/api/attendance/mark`
**Headers:** `Authorization: Bearer <student-token>`

**Test Case 8.1: Successful Attendance Marking**
```json
{
  "code": "ABC123"
}
```
**Expected:** 200 OK, attendance marked successfully

**Test Case 8.2: Invalid Code**
```json
{
  "code": "INVALID"
}
```
**Expected:** 400 Bad Request, invalid code error

**Test Case 8.3: Expired Code**
```json
{
  "code": "EXPIRED"
}
```
**Expected:** 400 Bad Request, code expired error

**Test Case 8.4: Not Enrolled in Class**
**Expected:** 403 Forbidden, not enrolled error

**Test Case 8.5: Duplicate Attendance**
**Expected:** 400 Bad Request, already marked error

**Test Case 8.6: Attendance with Face Verification**
```json
{
  "code": "ABC123",
  "faceImage": "data:image/jpeg;base64,..."
}
```
**Expected:** 200 OK, includes faceVerified and faceMatchScore

**Test Case 8.7: Attendance with Fingerprint**
```json
{
  "code": "ABC123",
  "fingerprintAuthResponse": {...},
  "fingerprintChallenge": "challenge-string"
}
```
**Expected:** 200 OK, includes fingerprintVerified

### Face Recognition Endpoints

#### 9. Enroll Face
**POST** `/api/face/enroll`
**Headers:** `Authorization: Bearer <token>`

**Test Case 9.1: Successful Enrollment**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```
**Expected:** 201 Created, enrollment successful

**Test Case 9.2: No Face Detected**
```json
{
  "image": "data:image/jpeg;base64,..." // Image without face
}
```
**Expected:** 400 Bad Request, no face detected error

**Test Case 9.3: Multiple Faces**
```json
{
  "image": "data:image/jpeg;base64,..." // Image with multiple faces
}
```
**Expected:** 400 Bad Request, multiple faces error

#### 10. Verify Face
**POST** `/api/face/verify`
**Headers:** `Authorization: Bearer <token>`

**Test Case 10.1: Successful Verification**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```
**Expected:** 200 OK, verified: true, score > threshold

**Test Case 10.2: Failed Verification**
```json
{
  "image": "data:image/jpeg;base64,..." // Different person's face
}
```
**Expected:** 200 OK, verified: false, score < threshold

**Test Case 10.3: Not Enrolled**
**Expected:** 404 Not Found, no enrollment error

#### 11. Face Status
**GET** `/api/face/status`
**Headers:** `Authorization: Bearer <token>`

**Test Case 11.1: Enrolled User**
**Expected:** 200 OK, enrolled: true

**Test Case 11.2: Not Enrolled User**
**Expected:** 200 OK, enrolled: false

### Fingerprint Recognition Endpoints

#### 12. Start Fingerprint Enrollment
**POST** `/api/fingerprint/enroll/start`
**Headers:** `Authorization: Bearer <token>`

**Test Case 12.1: Successful Start**
**Expected:** 200 OK, returns registration options

**Note:** Requires browser with WebAuthn support for full testing

#### 13. Complete Fingerprint Enrollment
**POST** `/api/fingerprint/enroll/complete`
**Headers:** `Authorization: Bearer <token>`

**Test Case 13.1: Successful Enrollment**
```json
{
  "registrationResponse": {...},
  "deviceName": "iPhone 15 Pro"
}
```
**Expected:** 201 Created, enrollment successful

**Note:** Requires actual WebAuthn credential from browser

#### 14. Start Fingerprint Verification
**POST** `/api/fingerprint/verify/start`
**Headers:** `Authorization: Bearer <token>`

**Test Case 14.1: Successful Start**
**Expected:** 200 OK, returns authentication options

#### 15. Complete Fingerprint Verification
**POST** `/api/fingerprint/verify/complete`
**Headers:** `Authorization: Bearer <token>`

**Test Case 15.1: Successful Verification**
```json
{
  "authenticationResponse": {...}
}
```
**Expected:** 200 OK, verified: true

### Socket.io Testing

#### 16. Real-time Attendance Updates

**Test Setup:**
1. Connect to Socket.io server
2. Join a session room
3. Have another user mark attendance
4. Verify real-time event received

**Test Case 16.1: Join Session Room**
```javascript
socket.emit('joinSession', { sessionId: 1, userRole: 'faculty' });
```
**Expected:** Receives 'sessionJoined' event

**Test Case 16.2: Receive Attendance Event**
**Expected:** Receives 'attendanceMarked' event when student marks attendance

## Error Handling Tests

### Test Error Responses

All errors should follow this format:
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

**Test Cases:**
1. 400 Bad Request - Validation errors
2. 401 Unauthorized - Authentication errors
3. 403 Forbidden - Authorization errors
4. 404 Not Found - Resource not found
5. 409 Conflict - Duplicate resources
6. 500 Internal Server Error - Server errors

## Performance Testing

### Load Testing
Use tools like Apache Bench or Artillery:

```bash
# Test login endpoint
ab -n 1000 -c 10 -p login.json -T application/json http://localhost:4000/api/auth/login
```

### Database Query Performance
- Check query execution times
- Verify indexes are being used
- Monitor connection pool usage

## Security Testing

### Test Cases:
1. **SQL Injection:** Attempt SQL injection in all input fields
2. **XSS:** Test for cross-site scripting vulnerabilities
3. **Token Validation:** Test with expired, invalid, and tampered tokens
4. **Rate Limiting:** Test for brute force protection (if implemented)
5. **CORS:** Verify CORS headers are correct

## Integration Testing

### Complete Flow Tests

**Test Flow 1: Full Attendance Flow**
1. Faculty registers course
2. Faculty starts session
3. Student enrolls face
4. Student marks attendance with face verification
5. Faculty receives real-time update

**Test Flow 2: Fingerprint Flow**
1. Student enrolls fingerprint
2. Student marks attendance with fingerprint
3. Verify attendance record includes fingerprint data

## Automated Testing

### Using Jest (Example)

```javascript
// Example test file
const request = require('supertest');
const app = require('../index');

describe('Authentication', () => {
  test('POST /api/auth/register - should register user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test123!',
        role: 'student',
        roll_no: 'TEST001'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
  });
});
```

## Test Checklist

- [ ] All authentication endpoints tested
- [ ] All faculty endpoints tested
- [ ] All attendance endpoints tested
- [ ] Face recognition endpoints tested
- [ ] Fingerprint recognition endpoints tested
- [ ] Error handling verified
- [ ] Socket.io real-time updates tested
- [ ] Security vulnerabilities checked
- [ ] Performance benchmarks met
- [ ] Integration flows tested

## Notes

1. **WebAuthn Testing:** Requires actual browser with fingerprint reader or Face ID
2. **Face Recognition:** Requires face-api.js models to be downloaded
3. **Database:** Ensure test database is separate from production
4. **Environment:** Use test environment variables
5. **Cleanup:** Clean up test data after testing

## Troubleshooting

### Common Issues:
1. **Database Connection:** Check DATABASE_URL in .env
2. **JWT Secret:** Ensure JWT_SECRET is set
3. **Port Conflicts:** Check if port 4000 is available
4. **Model Loading:** Check face recognition models are in correct location
5. **CORS Errors:** Verify FRONTEND_URL in .env matches frontend origin

