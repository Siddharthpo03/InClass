# Biometric Onboarding System - Complete Setup Guide

This document provides complete instructions for setting up and using the biometric onboarding and verification system in InClass.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Database Setup](#database-setup)
4. [Face-API.js Models Setup](#face-apijs-models-setup)
5. [HTTPS Setup for WebAuthn](#https-setup-for-webauthn)
6. [Environment Variables](#environment-variables)
7. [Testing the System](#testing-the-system)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The biometric onboarding system provides:

- **WebAuthn (FIDO2) Device Biometrics**: Fingerprint/face recognition using device authenticators
- **Face Recognition**: Client-side face detection using face-api.js with encrypted embeddings
- **Liveness Detection**: Basic blink and head movement checks
- **Biometric Consent Flow**: Required before enrollment
- **Secure Storage**: AES-256 encrypted embeddings + WebAuthn public keys
- **Attendance Enforcement**: Both WebAuthn + Face required to mark attendance

---

## Prerequisites

### Backend Dependencies

The following packages are already in `package.json`:

```json
{
  "@simplewebauthn/server": "^9.0.3",
  "face-api.js": "^0.22.2"  // Note: This is for backend, frontend uses face-api.js directly
}
```

### Frontend Dependencies

The following packages are already in `package.json`:

```json
{
  "@simplewebauthn/browser": "^13.2.2",
  "face-api.js": "^0.22.2"
}
```

### System Requirements

- Node.js 18+ (backend uses Node 22.x)
- PostgreSQL database
- HTTPS (required for WebAuthn in production)
- Modern browser with WebAuthn support (Chrome, Firefox, Edge, Safari)

---

## Database Setup

### Step 1: Run the Migration SQL

Execute the SQL file to create the required tables:

```bash
# Using psql
psql -U your_username -d your_database -f backend/migrations/create_biometric_tables.sql

# Or using pgAdmin
# 1. Open pgAdmin
# 2. Connect to your database
# 3. Right-click on your database -> Query Tool
# 4. Open and execute: backend/migrations/create_biometric_tables.sql
```

This creates three tables:
- `webauthn_credentials` - Stores WebAuthn credential data
- `biometric_face` - Stores encrypted face embeddings
- `biometric_consent` - Records user consent

### Step 2: Verify Tables

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('webauthn_credentials', 'biometric_face', 'biometric_consent');
```

---

## Face-API.js Models Setup

Face-api.js requires pre-trained models to be downloaded and placed in the `public/models` directory.

### Step 1: Create Models Directory

```bash
cd InClass/frontend/public
mkdir -p models
```

### Step 2: Download Models

Download the following model files from the [face-api.js repository](https://github.com/justadudewhohacks/face-api.js/tree/master/weights):

**Required Models:**
1. `tiny_face_detector_model-weights_manifest.json`
2. `tiny_face_detector_model-shard1`
3. `face_landmark_68_model-weights_manifest.json`
4. `face_landmark_68_model-shard1`
5. `face_recognition_model-weights_manifest.json`
6. `face_recognition_model-shard1`
7. `face_recognition_model-shard2`

### Step 3: Download Script (Linux/Mac)

```bash
cd InClass/frontend/public/models

# Download Tiny Face Detector
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1

# Download Face Landmark 68
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1

# Download Face Recognition
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2
```

### Step 4: Verify Models

After downloading, your `public/models` directory should look like:

```
frontend/public/models/
├── tiny_face_detector_model-weights_manifest.json
├── tiny_face_detector_model-shard1
├── face_landmark_68_model-weights_manifest.json
├── face_landmark_68_model-shard1
├── face_recognition_model-weights_manifest.json
├── face_recognition_model-shard1
└── face_recognition_model-shard2
```

### Alternative: Use CDN (Not Recommended for Production)

If you can't download models, you can use a CDN, but this is slower and less reliable:

```javascript
// In OnboardBiometrics.jsx, change model loading to:
await Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'),
  faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'),
  faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'),
]);
```

---

## HTTPS Setup for WebAuthn

WebAuthn requires HTTPS in production. For local development, you can use:

### Option 1: mkcert (Recommended for Local Development)

```bash
# Install mkcert (macOS)
brew install mkcert

# Install mkcert (Windows - using Chocolatey)
choco install mkcert

# Install mkcert (Linux)
# Follow instructions at: https://github.com/FiloSottile/mkcert

# Create local CA
mkcert -install

# Generate certificates for localhost
mkcert localhost 127.0.0.1 ::1

# This creates:
# - localhost+2.pem (certificate)
# - localhost+2-key.pem (private key)
```

Then update your backend to use HTTPS:

```javascript
// In backend/index.js (or create a separate HTTPS server file)
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('localhost+2-key.pem'),
  cert: fs.readFileSync('localhost+2.pem')
};

const server = https.createServer(options, app);
server.listen(PORT, () => {
  console.log(`✅ HTTPS Server running on port ${PORT}`);
});
```

### Option 2: Use ngrok (Quick Testing)

```bash
# Install ngrok
# Download from: https://ngrok.com/download

# Start your backend on HTTP
npm start

# In another terminal, create HTTPS tunnel
ngrok http 4000

# Use the HTTPS URL provided by ngrok
# Update FRONTEND_URL and WEBAUTHN_ORIGIN in .env
```

### Option 3: Production (Let's Encrypt / Cloud Provider)

For production, use:
- Let's Encrypt with Certbot
- Cloud provider SSL (AWS, Azure, GCP)
- Managed SSL services (Cloudflare, etc.)

---

## Environment Variables

Add the following to your `.env` file:

### Backend `.env`

```env
# WebAuthn Configuration
WEBAUTHN_RP_ID=localhost  # Or your domain (e.g., inclass.example.com)
WEBAUTHN_RP_NAME=InClass Attendance System
WEBAUTHN_ORIGIN=https://localhost:5173  # Or your frontend URL

# Biometric Encryption Key (IMPORTANT: Generate a strong random key)
BIOMETRIC_ENCRYPTION_KEY=your-32-byte-hex-key-here  # Generate with: openssl rand -hex 32

# Face Recognition Threshold (0.0 to 1.0, default: 0.62)
FACE_SIMILARITY_THRESHOLD=0.62

# Frontend URL
FRONTEND_URL=https://localhost:5173
```

### Generate Encryption Key

```bash
# Generate a secure 32-byte hex key
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:4000/api
# Or for HTTPS:
# VITE_API_BASE_URL=https://localhost:4000/api
```

---

## Testing the System

### Step 1: Start Backend

```bash
cd InClass/backend
npm install  # If not already done
npm start
```

### Step 2: Start Frontend

```bash
cd InClass/frontend
npm install  # If not already done
npm run dev
```

### Step 3: Complete Registration Flow

1. **Signup** → Navigate to `/register`
   - Fill in registration form
   - Submit
   - Should redirect to `/onboard/biometrics?userId=<id>`

2. **Biometric Onboarding** → `/onboard/biometrics`
   - Check consent checkbox
   - **Enroll Device Biometric**:
     - Click "Register Device Biometric"
     - Browser will prompt for fingerprint/face/Touch ID
     - Complete enrollment
   - **Enroll Face**:
     - Click "Enroll Face"
     - Allow camera access
     - Look at camera and click "Capture & Enroll"
     - System will detect face and compute embedding
   - **Test Both**:
     - Click "Test Fingerprint" to verify WebAuthn
     - Click "Test Face" to verify face recognition

3. **Mark Attendance** → `/student/dashboard`
   - Enter attendance code
   - System will require:
     - Face verification (camera capture)
     - WebAuthn authentication (fingerprint prompt)
   - Both must succeed to mark attendance

### Step 4: Verify Database

```sql
-- Check WebAuthn enrollment
SELECT u.name, u.email, wc.device_name, wc.enrolled_at 
FROM webauthn_credentials wc
JOIN users u ON wc.user_id = u.id
WHERE wc.is_active = TRUE;

-- Check Face enrollment
SELECT u.name, u.email, bf.enrolled_at 
FROM biometric_face bf
JOIN users u ON bf.user_id = u.id
WHERE bf.is_active = TRUE;

-- Check Consent
SELECT u.name, u.email, bc.method, bc.consented_at 
FROM biometric_consent bc
JOIN users u ON bc.user_id = u.id
WHERE bc.is_active = TRUE;
```

---

## Troubleshooting

### WebAuthn Issues

**Problem**: "WebAuthn not supported"
- **Solution**: Ensure you're using HTTPS (or localhost in development)
- **Solution**: Check browser compatibility (Chrome 67+, Firefox 60+, Edge 18+, Safari 13+)

**Problem**: "Registration failed"
- **Solution**: Check `WEBAUTHN_RP_ID` matches your domain
- **Solution**: Verify `WEBAUTHN_ORIGIN` matches frontend URL exactly
- **Solution**: Check browser console for detailed errors

### Face Recognition Issues

**Problem**: "Face recognition models failed to load"
- **Solution**: Verify models are in `public/models` directory
- **Solution**: Check browser console for 404 errors
- **Solution**: Ensure models are served correctly (check Network tab)

**Problem**: "No face detected"
- **Solution**: Ensure good lighting
- **Solution**: Face should be clearly visible and centered
- **Solution**: Remove glasses/hats if possible
- **Solution**: Check camera permissions

**Problem**: "Liveness check failed"
- **Solution**: Ensure eyes are open
- **Solution**: Look directly at camera
- **Solution**: Try again with better lighting

### Database Issues

**Problem**: "Table does not exist"
- **Solution**: Run migration SQL: `backend/migrations/create_biometric_tables.sql`
- **Solution**: Check database connection in `.env`

**Problem**: "Encryption/Decryption error"
- **Solution**: Verify `BIOMETRIC_ENCRYPTION_KEY` is set in `.env`
- **Solution**: Ensure key is 64 hex characters (32 bytes)
- **Solution**: Don't change key after data is encrypted (data will be unreadable)

### Attendance Issues

**Problem**: "Biometric verification required"
- **Solution**: Ensure both WebAuthn and Face are enrolled
- **Solution**: Check enrollment status: `GET /api/biometrics/status?userId=<id>`

**Problem**: "Face verification failed"
- **Solution**: Ensure face embedding is sent correctly
- **Solution**: Check similarity threshold (default 0.62)
- **Solution**: Verify stored embedding is not corrupted

---

## API Endpoints Reference

### WebAuthn Endpoints

- `POST /api/biometrics/webauthn/register/options` - Get registration options
- `POST /api/biometrics/webauthn/register/complete` - Complete registration
- `POST /api/biometrics/webauthn/auth/options` - Get authentication options
- `POST /api/biometrics/webauthn/auth/complete` - Complete authentication

### Face Recognition Endpoints

- `POST /api/biometrics/face/enroll` - Enroll face (send embedding array)
- `POST /api/biometrics/face/verify` - Verify face (send embedding array)

### Consent & Status

- `POST /api/biometrics/consent` - Record consent
- `GET /api/biometrics/status?userId=<id>` - Get enrollment status

---

## Security Notes

1. **Encryption Key**: Never commit `BIOMETRIC_ENCRYPTION_KEY` to version control
2. **HTTPS**: Always use HTTPS in production for WebAuthn
3. **Rate Limiting**: Consider adding rate limiting to verify endpoints
4. **Data Retention**: Implement data deletion policies per GDPR requirements
5. **Consent**: Always record consent before collecting biometric data

---

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs for server errors
3. Verify all environment variables are set
4. Ensure database tables are created
5. Verify face-api.js models are downloaded

---

## Next Steps

After setup:
1. Test full flow: Signup → Onboard → Mark Attendance
2. Test on different devices/browsers
3. Configure production HTTPS
4. Set up monitoring/logging
5. Implement data retention policies

