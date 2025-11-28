# Biometric Onboarding API Specification

This document outlines the API endpoints expected by the frontend biometric onboarding flow.

## Overview

The biometric onboarding system allows users to enroll device biometrics (WebAuthn/fingerprint) and/or face recognition after registration. The frontend handles all UI/UX, device detection, and WebAuthn client-side operations. The backend is responsible for storing consent records, managing WebAuthn credentials, and processing face enrollment.

---

## API Endpoints

### 1. Registration Response Update

**Endpoint:** `POST /api/auth/register`

**Expected Response:**
```json
{
  "success": true,
  "userId": 123,
  "token": "jwt_token_here",  // Optional: if provided, stored for authenticated requests
  "requireBiometric": true    // Optional: defaults to true if not present
}
```

**Notes:**
- `userId` is required for redirecting to `/onboard/biometrics?userId=<id>`
- `requireBiometric` can be set to `false` to skip biometric onboarding (fallback to `/login`)

---

### 2. Submit Biometric Consent

**Endpoint:** `POST /api/biometrics/consent`

**Request Body:**
```json
{
  "userId": 123,
  "method": "webauthn",  // or "face"
  "ip": "",              // Optional: can be filled by backend
  "userAgent": "Mozilla/5.0..."
}
```

**Expected Response:**
```json
{
  "success": true,
  "consentId": 456,
  "timestamp": "2025-01-20T10:00:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "User not found"  // or other error message
}
```

**Notes:**
- This endpoint should record consent in a `biometric_consents` table with:
  - `user_id`, `method`, `ip_address`, `user_agent`, `consent_timestamp`
- Consent is required before any enrollment can proceed

---

### 3. Get WebAuthn Registration Options

**Endpoint:** `POST /api/biometrics/webauthn/register/options`

**Request Body:**
```json
{
  "userId": 123
}
```

**Expected Response:**
```json
{
  "challenge": "base64url_encoded_challenge",
  "rp": {
    "id": "example.com",
    "name": "InClass Attendance System"
  },
  "user": {
    "id": "base64url_encoded_user_id",
    "name": "user@example.com",
    "displayName": "John Doe"
  },
  "pubKeyCredParams": [
    { "alg": -7, "type": "public-key" }
  ],
  "authenticatorSelection": {
    "authenticatorAttachment": "platform",
    "userVerification": "required"
  },
  "timeout": 60000,
  "attestation": "direct"
}
```

**Notes:**
- `challenge` and `user.id` should be base64url-encoded (frontend will convert to Uint8Array)
- If endpoint doesn't exist, frontend will use mock options for UI testing
- Use `@simplewebauthn/server` or similar library to generate options

---

### 4. Complete WebAuthn Registration

**Endpoint:** `POST /api/biometrics/webauthn/register/complete`

**Request Body:**
```json
{
  "userId": 123,
  "credentialId": "base64url_encoded_credential_id",
  "clientDataJSON": "base64url_encoded_client_data",
  "attestationObject": "base64url_encoded_attestation"
}
```

**Expected Response:**
```json
{
  "success": true,
  "credentialId": "stored_credential_id"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid attestation"
}
```

**Notes:**
- Verify the attestation using WebAuthn library
- Store credential ID and public key in `webauthn_credentials` table:
  - `user_id`, `credential_id`, `public_key`, `counter`, `created_at`
- Associate with the consent record

---

### 5. Face Enrollment

**Endpoint:** `POST /api/biometrics/face/enroll`

**Request Body:**
```json
{
  "userId": 123,
  "images": [
    "base64_encoded_image_1",
    "base64_encoded_image_2"
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "templateId": "face_template_123",
  "message": "Face enrolled successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to process face images"
}
```

**Notes:**
- Images are base64-encoded JPEG strings (without `data:image/jpeg;base64,` prefix)
- Backend should:
  1. Decode base64 images
  2. Extract face features/templates (using face recognition library)
  3. Store encrypted templates (NOT raw images) in `face_templates` table:
     - `user_id`, `template_data` (encrypted), `created_at`
  4. Delete raw images after processing
- Associate with the consent record

---

### 6. Get Biometric Status

**Endpoint:** `GET /api/biometrics/status?userId=123`

**Expected Response:**
```json
{
  "webauthn": true,
  "face": false
}
```

**Error Response:**
- If endpoint doesn't exist, frontend will gracefully handle (no error thrown)
- If user not found, return 404

**Notes:**
- Check `webauthn_credentials` table for user's WebAuthn enrollment
- Check `face_templates` table for user's face enrollment
- Return boolean flags for each method

---

### 7. Face Verification (for testing)

**Endpoint:** `POST /api/biometrics/face/verify`

**Request Body:**
```json
{
  "userId": 123
}
```

**Expected Response:**
```json
{
  "success": true,
  "verified": true,
  "confidence": 0.95
}
```

**Notes:**
- This is optional for the "Test Biometric" flow
- Can prompt user to capture a new image and compare with enrolled template
- If not implemented, frontend will simulate success

---

## Database Schema Recommendations

### `biometric_consents` Table
```sql
CREATE TABLE biometric_consents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  method VARCHAR(50) NOT NULL,  -- 'webauthn' or 'face'
  ip_address VARCHAR(45),
  user_agent TEXT,
  consent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `webauthn_credentials` Table
```sql
CREATE TABLE webauthn_credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `face_templates` Table
```sql
CREATE TABLE face_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  template_data BYTEA NOT NULL,  -- Encrypted face template
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Frontend Implementation Notes

1. **Consent is Mandatory**: Users must check the consent checkbox before enrollment buttons become active.

2. **Device Detection**: Frontend uses `PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()` to detect fingerprint sensors.

3. **WebAuthn Flow**:
   - Frontend calls `/api/biometrics/webauthn/register/options`
   - Uses `navigator.credentials.create()` with the options
   - Sends attestation to `/api/biometrics/webauthn/register/complete`

4. **Face Enrollment**:
   - Frontend captures 2 images with liveness checks (blink, head turn)
   - Sends base64 images to `/api/biometrics/face/enroll`
   - Images are NOT stored in localStorage (only sent over HTTPS)

5. **Skip Option**: Users can skip enrollment, which sets `biometricSkipped=true` in localStorage. Faculty can manually mark attendance for skipped users.

6. **Attendance Blocking**: Student dashboard checks biometric status before allowing attendance marking. If not enrolled and not skipped, shows modal with "Go to Biometric Enrollment" button.

---

## Security Considerations

1. **HTTPS Required**: All biometric data must be transmitted over HTTPS.

2. **No Raw Image Storage**: Backend should NOT store raw face images. Only encrypted templates or device-managed credentials.

3. **Consent Records**: Maintain audit trail of all consent submissions.

4. **WebAuthn Security**: Follow WebAuthn best practices:
   - Verify attestation signatures
   - Store credential IDs securely
   - Implement replay attack prevention (challenge validation)

5. **Face Template Encryption**: Encrypt face templates at rest using strong encryption (AES-256).

---

## Testing

- Frontend gracefully handles missing endpoints (simulates success for UI flow)
- Backend can implement endpoints incrementally
- Test with real devices (fingerprint sensors, cameras)
- Test consent flow and enrollment blocking

---

## Next Steps for Backend Team

1. Create database tables for consents, WebAuthn credentials, and face templates
2. Implement `/api/biometrics/consent` endpoint
3. Implement WebAuthn registration endpoints (options + complete)
4. Implement face enrollment endpoint
5. Implement biometric status check endpoint
6. Add face verification endpoint (optional)
7. Update `/api/auth/register` to return `userId` and `requireBiometric` flag

