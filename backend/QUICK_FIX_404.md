# Quick Fix for 404 Error on /api/biometrics/status

## The Problem:
The route exists in the code but returns 404, which means the backend server hasn't loaded the new route.

## Solution:

### Step 1: Restart Backend Server
**IMPORTANT**: You must restart your backend server after adding new routes.

```bash
# In your backend terminal:
# 1. Stop the server (Press Ctrl+C)
# 2. Start it again:
cd InClass/backend
npm start
```

### Step 2: Verify Route is Loaded
Check the backend console output when server starts. You should see:
```
✅ Server running on port 4000
```

If you see any errors about `routes/biometrics.js`, that means there's a problem loading the file.

### Step 3: Test the Route
After restarting, test in browser:
```
http://localhost:4000/api/biometrics/status?userId=4
```

You should get JSON response, not 404.

### Step 4: If Still 404 - Check for Errors

1. **Check backend console** for any errors when server starts
2. **Verify database tables exist** - Run schema.sql if you haven't
3. **Check if route file has syntax errors**:
   ```bash
   cd InClass/backend
   node -c routes/biometrics.js
   ```
   (Should return nothing if no syntax errors)

### Common Causes:
- ✅ Server not restarted (most common)
- ❌ Missing database tables (run schema.sql)
- ❌ Syntax error in route file
- ❌ Missing npm dependencies

## After Fixing:
Once the route works, the frontend should be able to check biometric status without 404 errors.

