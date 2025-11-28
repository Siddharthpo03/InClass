# Biometric System Bug Fixes

## Issues Fixed

### 1. WebAuthn Registration 500 Error
**Problem:** Server returned 500 Internal Server Error when requesting registration options.

**Root Causes:**
- Missing error logging with stack traces
- Potential database table missing errors not handled gracefully
- Challenge serialization issues
- Missing proper error responses

**Fixes Applied:**
- ✅ Added comprehensive error logging with full stack traces
- ✅ Added graceful handling for missing database tables
- ✅ Fixed challenge serialization (ensure string format)
- ✅ Improved error responses with detailed messages
- ✅ Added client-side ArrayBuffer ↔ base64url conversion helpers
- ✅ Enhanced error messages to guide debugging

**Files Modified:**
- `backend/routes/biometrics.js` - Enhanced `/webauthn/register/options` and `/webauthn/register/complete` endpoints
- `frontend/src/pages/Onboard/OnboardBiometrics.jsx` - Added conversion helpers and better error handling

### 2. Face-api.js TinyYolov2 Model Mismatch Error
**Problem:** Console showed "TinyYolov2 - load model before inference" because code loaded SSD models but used TinyFaceDetector.

**Root Causes:**
- Model loading used `ssdMobilenetv1` but detection used `TinyFaceDetectorOptions`
- Missing guards to prevent capture until models fully loaded
- No check for model loaded state before detection

**Fixes Applied:**
- ✅ Changed model loading to use `tinyFaceDetector` (matches detection method)
- ✅ Added `modelsLoaded` state check before all face detection calls
- ✅ Added `faceapi.nets.tinyFaceDetector.isLoaded` check before detection
- ✅ Disabled "Capture Picture" button until models loaded
- ✅ Enhanced error messages for model loading failures
- ✅ Updated model manifest check to use `tiny_face_detector_model-weights_manifest.json`

**Files Modified:**
- `frontend/src/utils/faceModels.js` - Changed to load TinyFaceDetector models
- `frontend/src/pages/Onboard/OnboardBiometrics.jsx` - Added model loading guards and checks

## Testing Steps

### Prerequisites
1. **Backend Setup:**
   ```bash
   cd InClass/backend
   npm install
   # Ensure database tables exist (run schema.sql)
   node index.js
   ```

2. **Frontend Setup:**
   ```bash
   cd InClass/frontend
   npm install
   # Download face-api.js models (see below)
   npm run dev
   ```

3. **Download Face Models:**
   ```bash
   # Option 1: Use Node script
   cd InClass/frontend
   npm run download-models
   
   # Option 2: Use PowerShell (Windows)
   cd InClass/frontend
   .\scripts\download-models.ps1
   
   # Option 3: Manual download
   # Create folder: frontend/public/models/
   # Download from: https://github.com/justadudewhohacks/face-api.js-models
   # Required files:
   # - tiny_face_detector_model-weights_manifest.json
   # - tiny_face_detector_model-shard1
   # - face_landmark_68_model-weights_manifest.json
   # - face_landmark_68_model-shard1
   # - face_recognition_model-weights_manifest.json
   # - face_recognition_model-shard1
   ```

### Test 1: WebAuthn Registration Flow
1. **Start Backend:**
   ```bash
   cd InClass/backend
   node index.js
   ```
   - Watch console for `[WebAuthn]` log messages
   - Note any errors with full stack traces

2. **Start Frontend:**
   ```bash
   cd InClass/frontend
   npm run dev
   ```

3. **Navigate to Onboarding:**
   - Go to `http://localhost:5173/onboard/biometrics?userId=4` (replace 4 with actual userId)
   - Or register a new user and you'll be redirected

4. **Test WebAuthn Enrollment:**
   - ✅ Check consent checkbox
   - ✅ Click "Register Device Biometric"
   - ✅ Check Network tab (F12) - should see:
     - `POST /api/biometrics/webauthn/register/options` → **200 OK** (not 500)
     - Response should contain `challenge`, `rp`, `user`, `pubKeyCredParams`
   - ✅ Browser should prompt for biometric (fingerprint/face)
   - ✅ After biometric prompt, should see:
     - `POST /api/biometrics/webauthn/register/complete` → **201 Created**
   - ✅ Success message: "✅ Device biometric enrolled successfully!"

5. **If 500 Error Occurs:**
   - Check backend console for full stack trace
   - Common issues:
     - Database table `webauthn_credentials` doesn't exist → Run `schema.sql`
     - `RP_ID` or `ORIGIN` mismatch → Check `.env` file
     - User not found → Verify `userId` exists in database

### Test 2: Face Recognition Model Loading
1. **Verify Models Are Accessible:**
   - Open browser DevTools (F12) → Network tab
   - Navigate to `http://localhost:5173/models/tiny_face_detector_model-weights_manifest.json`
   - Should return **200 OK** with JSON content (not HTML 404 page)

2. **Test Model Loading:**
   - Navigate to onboarding page
   - Watch console for: "Face-api.js models loaded successfully (TinyFaceDetector + Landmarks + Recognition)"
   - UI should show: "⏳ Loading face recognition models..." → "✅ Camera and models ready"

3. **If Models Fail to Load:**
   - Check Network tab for failed requests (404 errors)
   - Verify `frontend/public/models/` directory exists
   - Verify all 6 model files are present
   - Check console for specific error messages

### Test 3: Face Enrollment Flow
1. **Prerequisites:**
   - Models must be loaded (see Test 2)
   - Camera must be available
   - Consent checkbox must be checked

2. **Test Face Capture:**
   - ✅ Click "Enroll Face"
   - ✅ Camera should start (video preview visible)
   - ✅ "Capture Picture" button should be **enabled** (only if models loaded)
   - ✅ Click "Capture Picture"
   - ✅ Should see progress: "Captecting image..." → "Detecting face..." → "Processing face data..."
   - ✅ Captured image should appear with "Retake Picture" and "Confirm & Enroll" buttons
   - ✅ No "TinyYolov2" errors in console

3. **Test Enrollment:**
   - ✅ Click "Confirm & Enroll"
   - ✅ Should see: "Sending to server..." → "Finalizing..."
   - ✅ Success message: "✅ Face enrolled successfully!"
   - ✅ Status should update to "✅ Enrolled"

4. **Test Retake:**
   - ✅ After capturing, click "Retake Picture"
   - ✅ Camera should restart
   - ✅ Can capture again

### Test 4: Error Handling
1. **WebAuthn Errors:**
   - Try with invalid `userId` → Should show clear error message
   - Check backend console for stack trace
   - Frontend should display helpful error message

2. **Face Model Errors:**
   - Delete one model file → Should show error with retry button
   - Check Network tab to see which file failed
   - Error message should guide user to fix

3. **Camera Errors:**
   - Deny camera permission → Should show "Failed to access camera"
   - No camera available → Should show "Camera not detected"

## Verification Checklist

### Backend
- [ ] `/api/biometrics/webauthn/register/options` returns 200 (not 500)
- [ ] Backend console shows `[WebAuthn]` log messages
- [ ] Error responses include `success: false` and `message` fields
- [ ] Stack traces printed to console on errors (development mode)

### Frontend
- [ ] Face models load without errors
- [ ] No "TinyYolov2" errors in console
- [ ] "Capture Picture" button disabled until models loaded
- [ ] WebAuthn enrollment completes successfully
- [ ] Face enrollment completes successfully
- [ ] Error messages are user-friendly and actionable

### Database
- [ ] `webauthn_credentials` table exists
- [ ] `biometric_face` table exists
- [ ] `biometric_consent` table exists
- [ ] Can query enrolled credentials after enrollment

## Common Issues & Solutions

### Issue: "Models directory not found"
**Solution:**
1. Create `frontend/public/models/` directory
2. Download all 6 model files (see Prerequisites)
3. Verify files are accessible at `http://localhost:5173/models/`

### Issue: "Database table does not exist"
**Solution:**
1. Run `backend/schema.sql` against your PostgreSQL database
2. Verify tables exist: `\dt` in psql

### Issue: "RP_ID or ORIGIN mismatch"
**Solution:**
1. Check `backend/.env`:
   ```
   WEBAUTHN_RP_ID=localhost
   WEBAUTHN_ORIGIN=http://localhost:5173
   ```
2. For production, use actual domain and HTTPS

### Issue: "TinyYolov2 - load model before inference"
**Solution:**
1. Ensure `tinyFaceDetector` models are loaded (not SSD)
2. Check `faceapi.nets.tinyFaceDetector.isLoaded === true` before detection
3. Wait for models to load before clicking "Capture Picture"

## Files Changed

1. **Backend:**
   - `backend/routes/biometrics.js` - Enhanced error handling and logging

2. **Frontend:**
   - `frontend/src/pages/Onboard/OnboardBiometrics.jsx` - Added conversion helpers, model guards, better errors
   - `frontend/src/utils/faceModels.js` - Changed to load TinyFaceDetector models

## Next Steps

1. Test both flows end-to-end
2. Verify database entries after enrollment
3. Test on different devices/browsers
4. Monitor backend logs for any remaining issues
5. Consider adding unit tests for conversion helpers

