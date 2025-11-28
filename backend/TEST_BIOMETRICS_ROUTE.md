# Testing Biometrics Route

## Quick Test Steps:

1. **Restart your backend server:**
   ```bash
   cd InClass/backend
   # Stop current server (Ctrl+C)
   npm start
   ```

2. **Test the route directly in browser or Postman:**
   ```
   GET http://localhost:4000/api/biometrics/status?userId=4
   ```

3. **Check backend console for errors** when server starts - look for:
   - Any errors loading `routes/biometrics.js`
   - Any database connection errors
   - Any module import errors

4. **Verify route is registered** - Check backend console output for:
   ```
   ✅ Server running on port 4000
   ```

## Common Issues:

- **404 Error**: Route not registered - restart server
- **500 Error**: Database tables missing - run schema.sql
- **Module Error**: Missing dependencies - run `npm install`

## Manual Route Test:

If the route still doesn't work, test it manually:

```bash
# In backend directory
node -e "const app = require('./index'); console.log('Server routes loaded');"
```

