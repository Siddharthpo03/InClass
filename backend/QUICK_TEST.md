# Quick Testing Guide

## Prerequisites Check

1. **Database Connection**: Make sure PostgreSQL is running and accessible
2. **Environment Variables**: Check `.env` file has:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Secret key for JWT tokens
   - `PORT` - Server port (default: 4000)

## Step-by-Step Testing

### 1. Start the Server

```bash
cd backend
npm start
```

**Expected Output:**
```
✅ PostgreSQL connected successfully. Date: ...
✅ Server running on port 4000
✅ Socket.io initialized and ready for connections
```

**If you see errors:**
- Database connection failed → Check DATABASE_URL in .env
- Port already in use → Change PORT in .env or stop other services
- Missing dependencies → Run `npm install`

### 2. Test Basic Endpoints

#### Test 1: Health Check
```bash
curl http://localhost:4000/health
```
**Expected:** `{"status":"ok","timestamp":"..."}`

#### Test 2: Root Endpoint
```bash
curl http://localhost:4000/
```
**Expected:** Server welcome message

### 3. Test Authentication

#### Register a User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!",
    "role": "student",
    "roll_no": "TEST001"
  }'
```

**Expected:** 201 Created with token

#### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "role": "student"
  }'
```

**Expected:** 200 OK with token

#### Get Profile (replace TOKEN with actual token)
```bash
curl http://localhost:4000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with user profile

### 4. Test with Automated Script

Once server is running, in another terminal:

```bash
cd backend
node test-server.js
```

This will run automated tests for:
- Server health
- User registration
- User login
- Profile retrieval
- Error handling

## Common Issues

### Issue: "Database connection failed"
**Solution:**
1. Check PostgreSQL is running: `pg_isready` or check services
2. Verify DATABASE_URL in .env is correct
3. Check database exists: `psql -l` should list databases

### Issue: "Port 4000 already in use"
**Solution:**
1. Change PORT in .env to another port (e.g., 4001)
2. Or stop the service using port 4000

### Issue: "Cannot find module"
**Solution:**
```bash
npm install
```

### Issue: Canvas installation failed (Windows)
**Solution:**
- Canvas is optional for face recognition
- Face recognition will use fallback mode
- Other features work without canvas

## Manual Testing with Postman/Insomnia

1. Import the endpoints from `TESTING_GUIDE.md`
2. Set up environment variables:
   - `base_url`: `http://localhost:4000`
   - `token`: (get from login response)
3. Test endpoints in order:
   - Register → Login → Profile → Faculty/Course → Attendance

## Next Steps

After basic tests pass:
1. Test faculty endpoints (register course, start session)
2. Test attendance marking
3. Test face recognition (requires models)
4. Test fingerprint recognition (requires browser)
5. Test Socket.io real-time updates

See `TESTING_GUIDE.md` for comprehensive test cases.

