# Fingerprint Recognition Setup Guide

## Overview
The InClass backend includes WebAuthn-based fingerprint recognition for secure attendance marking. This uses the browser's built-in WebAuthn API to access platform authenticators (fingerprint readers, Face ID, etc.).

## Prerequisites
- Node.js 22.x
- PostgreSQL database
- Modern browser with WebAuthn support (Chrome, Firefox, Safari, Edge)
- Device with fingerprint reader or Face ID/Touch ID

## Installing Dependencies
The required packages are already in `package.json`. Install them with:
```bash
npm install
```

Required packages:
- `@simplewebauthn/server` - WebAuthn server implementation
- All other dependencies from package.json

## Environment Variables

Add these to your `.env` file:

```env
# WebAuthn Configuration
WEBAUTHN_RP_ID=localhost                    # Relying Party ID (domain name)
WEBAUTHN_RP_NAME=InClass Attendance System  # Relying Party Name
WEBAUTHN_ORIGIN=http://localhost:5173       # Frontend origin (HTTPS in production)
```

**Important for Production:**
- `WEBAUTHN_RP_ID` must match your domain (e.g., `inclass.example.com`)
- `WEBAUTHN_ORIGIN` must use HTTPS in production
- Both must match exactly what the browser sees

## API Endpoints

### 1. Start Fingerprint Enrollment
**POST** `/api/fingerprint/enroll/start`

Start the fingerprint enrollment process. Returns registration options for the frontend.

**Response:**
```json
{
  "rp": {
    "name": "InClass Attendance System",
    "id": "localhost"
  },
  "user": {
    "id": "base64url-encoded-user-id",
    "name": "user@example.com",
    "displayName": "User Name"
  },
  "challenge": "base64url-encoded-challenge",
  "pubKeyCredParams": [...],
  "timeout": 60000,
  "excludeCredentials": [],
  "authenticatorSelection": {
    "authenticatorAttachment": "platform",
    "userVerification": "required"
  }
}
```

### 2. Complete Fingerprint Enrollment
**POST** `/api/fingerprint/enroll/complete`

Complete enrollment by verifying the registration response from the browser.

**Request Body:**
```json
{
  "registrationResponse": {
    "id": "credential-id",
    "rawId": "base64url-encoded-credential-id",
    "response": {
      "attestationObject": "...",
      "clientDataJSON": "..."
    },
    "type": "public-key"
  },
  "deviceName": "iPhone 15 Pro" // Optional
}
```

**Response:**
```json
{
  "message": "Fingerprint enrolled successfully.",
  "credentialId": "credential-id"
}
```

### 3. Start Fingerprint Verification
**POST** `/api/fingerprint/verify/start`

Start the fingerprint verification process. Returns authentication options.

**Response:**
```json
{
  "challenge": "base64url-encoded-challenge",
  "timeout": 60000,
  "rpId": "localhost",
  "allowCredentials": [
    {
      "id": "credential-id",
      "type": "public-key",
      "transports": ["internal"]
    }
  ],
  "userVerification": "required"
}
```

### 4. Complete Fingerprint Verification
**POST** `/api/fingerprint/verify/complete`

Complete verification by verifying the authentication response.

**Request Body:**
```json
{
  "authenticationResponse": {
    "id": "credential-id",
    "rawId": "base64url-encoded-credential-id",
    "response": {
      "authenticatorData": "...",
      "clientDataJSON": "...",
      "signature": "...",
      "userHandle": "..."
    },
    "type": "public-key"
  }
}
```

**Response:**
```json
{
  "verified": true,
  "message": "Fingerprint verified successfully.",
  "credentialId": "credential-id"
}
```

### 5. Check Fingerprint Status
**GET** `/api/fingerprint/status`

Get user's fingerprint enrollment status.

**Response:**
```json
{
  "enrolled": true,
  "credentials": [
    {
      "id": 1,
      "deviceName": "iPhone 15 Pro",
      "enrolledAt": "2025-01-20T10:30:00Z",
      "lastUsedAt": "2025-01-20T11:00:00Z",
      "counter": 5
    }
  ],
  "count": 1
}
```

### 6. Delete Fingerprint Enrollment
**DELETE** `/api/fingerprint/enroll/:credentialId`

Delete a specific fingerprint enrollment.

**Response:**
```json
{
  "message": "Fingerprint enrollment deleted successfully."
}
```

## Attendance with Fingerprint Verification

### Mark Attendance with Fingerprint
**POST** `/api/attendance/mark`

Mark attendance with optional fingerprint verification.

**Request Body:**
```json
{
  "code": "ABC123",
  "fingerprintAuthResponse": {
    "id": "credential-id",
    "rawId": "...",
    "response": {...},
    "type": "public-key"
  },
  "fingerprintChallenge": "challenge-from-verify-start"
}
```

**Response:**
```json
{
  "message": "Attendance marked successfully.",
  "attendanceId": 123,
  "timestamp": "2025-01-20T10:30:00Z",
  "fingerprintVerified": true,
  "fingerprintCredentialId": "credential-id"
}
```

## Frontend Integration

### Enrollment Flow

```javascript
// 1. Start enrollment
const enrollStartResponse = await apiClient.post('/api/fingerprint/enroll/start');
const options = enrollStartResponse.data;

// 2. Call WebAuthn API
const credential = await navigator.credentials.create({
  publicKey: options
});

// 3. Complete enrollment
await apiClient.post('/api/fingerprint/enroll/complete', {
  registrationResponse: credential,
  deviceName: 'iPhone 15 Pro'
});
```

### Verification Flow

```javascript
// 1. Start verification
const verifyStartResponse = await apiClient.post('/api/fingerprint/verify/start');
const options = verifyStartResponse.data;

// 2. Call WebAuthn API
const assertion = await navigator.credentials.get({
  publicKey: options
});

// 3. Complete verification
await apiClient.post('/api/fingerprint/verify/complete', {
  authenticationResponse: assertion
});
```

### Attendance with Fingerprint

```javascript
// 1. Start verification
const verifyStartResponse = await apiClient.post('/api/fingerprint/verify/start');
const challenge = verifyStartResponse.data.challenge;

// 2. Get fingerprint
const assertion = await navigator.credentials.get({
  publicKey: verifyStartResponse.data
});

// 3. Mark attendance
await apiClient.post('/api/attendance/mark', {
  code: 'ABC123',
  fingerprintAuthResponse: assertion,
  fingerprintChallenge: challenge
});
```

## Security Features

- **Public Key Cryptography**: Uses public/private key pairs (never stored on server)
- **Challenge-Response**: Prevents replay attacks
- **Signature Counter**: Tracks usage to detect cloned credentials
- **User Verification**: Requires fingerprint/Face ID/Touch ID
- **Platform Authenticators**: Uses device's secure enclave

## Troubleshooting

### "NotSupportedError"
- Browser doesn't support WebAuthn
- Device doesn't have fingerprint reader
- Not using HTTPS in production

### "InvalidStateError"
- Credential already exists (for enrollment)
- No credentials found (for verification)

### "NotAllowedError"
- User cancelled the operation
- Fingerprint scan failed multiple times
- Device locked

### Challenge Expired
- Challenges expire after 5 minutes
- Start a new verification if expired

## Production Considerations

1. **HTTPS Required**: WebAuthn requires HTTPS in production
2. **Domain Matching**: `WEBAUTHN_RP_ID` must match your domain exactly
3. **Challenge Storage**: Use Redis or database instead of in-memory Map
4. **Error Handling**: Implement proper error messages for users
5. **Fallback**: Provide alternative authentication methods
6. **Rate Limiting**: Implement rate limiting on verification endpoints

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 13+, macOS 10.15+)
- Opera: ✅ Full support

## Device Support

- **Fingerprint Readers**: Windows Hello, Touch ID, Android fingerprint sensors
- **Face Recognition**: Face ID, Windows Hello Face
- **Other**: Any platform authenticator supported by the device

## Performance

- Enrollment: ~1-2 seconds (user interaction)
- Verification: ~500ms-1s (user interaction)
- Server processing: ~50-100ms per request

## Security Notes

- Private keys never leave the device
- Server only stores public keys
- Signature verification prevents tampering
- Counter prevents replay attacks
- User verification ensures physical presence

