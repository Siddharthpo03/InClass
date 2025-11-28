# Backend Testing Summary

## ✅ What's Ready

1. **All Dependencies Installed** (except canvas - optional)
2. **Test Script Created** (`test-server.js`)
3. **Testing Guide Created** (`TESTING_GUIDE.md`)
4. **Quick Test Guide Created** (`QUICK_TEST.md`)

## 🚀 How to Test

### Option 1: Automated Testing

1. **Start the server:**
   ```bash
   cd backend
   npm start
   ```

2. **In another terminal, run tests:**
   ```bash
   cd backend
   node test-server.js
   ```

### Option 2: Manual Testing with curl

1. **Health Check:**
   ```bash
   curl http://localhost:4000/health
   ```

2. **Register User:**
   ```bash
   curl -X POST http://localhost:4000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@test.com","password":"Test123!","role":"student","roll_no":"TEST001"}'
   ```

3. **Login:**
   ```bash
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"Test123!","role":"student"}'
   ```

### Option 3: Postman/Insomnia

Import endpoints from `TESTING_GUIDE.md` and test manually.

## 📋 Pre-Testing Checklist

- [ ] PostgreSQL database is running
- [ ] `.env` file exists with correct DATABASE_URL
- [ ] `.env` file has JWT_SECRET set
- [ ] Port 4000 is available (or change PORT in .env)
- [ ] All npm packages installed (`npm install`)

## 🔍 Troubleshooting

### Server Won't Start

**Check:**
1. Database connection - verify DATABASE_URL in .env
2. Port availability - check if port 4000 is free
3. Dependencies - run `npm install`
4. Node version - should be Node 22.x

**Common Errors:**
- `Database connection failed` → Check PostgreSQL is running and DATABASE_URL is correct
- `Port already in use` → Change PORT in .env or stop conflicting service
- `Cannot find module` → Run `npm install`

### Tests Fail

**Check:**
1. Server is actually running (check process list)
2. Server is on correct port (check .env PORT)
3. Database has tables (run schema.sql)
4. Network connectivity (try `curl http://localhost:4000/health`)

## 📊 Test Coverage

The test script (`test-server.js`) covers:
- ✅ Server health check
- ✅ Root endpoint
- ✅ User registration
- ✅ User login
- ✅ Profile retrieval
- ✅ Error handling
- ✅ Face recognition status (if enrolled)

## 🎯 Next Steps After Basic Tests Pass

1. Test faculty endpoints (register course, start session)
2. Test attendance marking
3. Test face recognition enrollment/verification
4. Test fingerprint recognition (requires browser)
5. Test Socket.io real-time updates
6. Test error scenarios
7. Test security (SQL injection, XSS, etc.)

## 📚 Documentation

- **TESTING_GUIDE.md** - Comprehensive test cases for all endpoints
- **QUICK_TEST.md** - Quick start testing guide
- **FACE_RECOGNITION_SETUP.md** - Face recognition setup
- **FINGERPRINT_RECOGNITION_SETUP.md** - Fingerprint setup

## 💡 Tips

1. **Start Simple**: Test health check first, then authentication
2. **Use Tokens**: Save JWT tokens from login for authenticated requests
3. **Check Logs**: Server console shows detailed error messages
4. **Database First**: Make sure database schema is set up correctly
5. **One at a Time**: Test endpoints in logical order (register → login → use)

## 🐛 Known Issues

1. **Canvas on Windows**: Requires Visual Studio build tools. Face recognition will use fallback mode without it.
2. **WebAuthn Testing**: Requires actual browser with fingerprint reader/Face ID
3. **Face Models**: Face recognition models need to be downloaded separately

---

**Ready to test!** Start the server and run the test script, or follow the manual testing guide.

