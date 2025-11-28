# Troubleshooting Guide

## Login Issues

### Issue: "Login failed due to network error"

**Possible Causes:**
1. Backend server not running
2. CORS configuration issue
3. Wrong API URL in frontend
4. Error format mismatch (now fixed)

**Solutions:**

#### 1. Check if Backend is Running
```bash
curl http://localhost:4000/health
# Should return: {"status":"ok","timestamp":"..."}
```

#### 2. Check Browser Console
Open browser DevTools (F12) → Console tab
- Look for CORS errors
- Look for network errors
- Check the actual error response

#### 3. Verify API Base URL
Check `frontend/src/utils/apiClient.js`:
- Should be: `http://localhost:4000/api` for local development
- Or set `VITE_API_BASE_URL` in frontend `.env`

#### 4. Check CORS Configuration
Backend should allow frontend origin:
```javascript
// backend/index.js
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));
```

#### 5. Test Login Directly
```powershell
# Register a user first
$body = @{
  name = "Test User"
  email = "test@test.com"
  password = "Test123!"
  role = "student"
  roll_no = "TEST001"
} | ConvertTo-Json

Invoke-WebRequest -Uri 'http://localhost:4000/api/auth/register' `
  -Method POST -Body $body -ContentType 'application/json'

# Then login
$loginBody = @{
  email = "test@test.com"
  password = "Test123!"
  role = "student"
} | ConvertTo-Json

Invoke-WebRequest -Uri 'http://localhost:4000/api/auth/login' `
  -Method POST -Body $loginBody -ContentType 'application/json'
```

### Issue: "Invalid email or password" (but credentials are correct)

**Possible Causes:**
1. Password hash mismatch
2. User not in database
3. Role mismatch

**Solutions:**
1. Check database - verify user exists:
   ```sql
   SELECT * FROM users WHERE email = 'your-email@example.com';
   ```
2. Verify password was hashed correctly during registration
3. Check role matches exactly (case-sensitive: 'student', 'faculty', 'admin')

### Issue: CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
1. Check `FRONTEND_URL` in backend `.env`:
   ```
   FRONTEND_URL=http://localhost:5173
   ```
2. Restart backend server after changing `.env`
3. Verify frontend is running on the URL specified

### Issue: "Network Error" or "ERR_CONNECTION_REFUSED"

**Possible Causes:**
1. Backend server not running
2. Wrong port
3. Firewall blocking connection

**Solutions:**
1. Start backend: `cd backend && npm start`
2. Check port: Verify backend is on port 4000 (or check `.env` PORT)
3. Check firewall: Allow Node.js through Windows Firewall

## Common Error Messages

### Backend Error Format
New error format (after error handling update):
```json
{
  "success": false,
  "error": {
    "message": "Error message here",
    "code": "ERROR_CODE"
  }
}
```

Frontend now handles both formats:
- New: `error.response.data.error.message`
- Old: `error.response.data.message`

## Debugging Steps

1. **Check Server Logs**
   - Look at backend console for errors
   - Check for database connection issues
   - Verify JWT_SECRET is set

2. **Check Browser Network Tab**
   - Open DevTools → Network tab
   - Try to login
   - Check the login request:
     - Status code (200 = success, 401 = auth error, 500 = server error)
     - Response body
     - Request headers

3. **Check Console Errors**
   - Browser console (F12)
   - Look for JavaScript errors
   - Check API client errors

4. **Verify Database**
   ```sql
   -- Check if user exists
   SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
   
   -- Check password (should be hashed)
   SELECT password FROM users WHERE email = 'your-email@example.com';
   ```

5. **Test with curl/Postman**
   - Test endpoints directly
   - Verify backend is working
   - Check response format

## Quick Fixes

### Restart Everything
```bash
# Stop all Node processes
Get-Process node | Stop-Process -Force

# Start backend
cd backend
npm start

# Start frontend (in another terminal)
cd frontend
npm run dev
```

### Clear Browser Cache
- Clear localStorage
- Hard refresh (Ctrl+Shift+R)
- Clear browser cache

### Check Environment Variables
Backend `.env`:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Secret key
- `PORT` - Server port (default: 4000)
- `FRONTEND_URL` - CORS origin

Frontend `.env` (optional):
- `VITE_API_BASE_URL` - Backend URL

