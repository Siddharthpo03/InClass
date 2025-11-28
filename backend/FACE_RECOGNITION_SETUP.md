# Face Recognition Setup Guide

## Overview
The InClass backend includes face recognition capabilities for secure attendance marking. This guide explains how to set up and use the face recognition system.

## Prerequisites
- Node.js 22.x
- PostgreSQL database
- Face recognition models (see below)

## Installing Dependencies
The required packages are already in `package.json`. Install them with:
```bash
npm install
```

## Downloading Face Recognition Models

The face recognition system uses face-api.js models. You need to download these models:

1. **SSD MobileNet V1** - For face detection
2. **Face Landmark 68 Net** - For facial landmark detection
3. **Face Recognition Net** - For face descriptor extraction

### Steps to Download Models:

1. Clone or download the face-api models repository:
   ```bash
   cd backend
   mkdir -p models
   ```

2. Download the models from:
   - https://github.com/vladmandic/face-api/tree/master/model
   
   Or use direct links:
   - `ssd_mobilenetv1_model-weights_manifest.json`
   - `ssd_mobilenetv1_model-shard1` (and other shards)
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1` (and other shards)

3. Place all model files in the `backend/models/` directory

4. The directory structure should look like:
   ```
   backend/
     models/
       ssd_mobilenetv1_model-weights_manifest.json
       ssd_mobilenetv1_model-shard1
       face_landmark_68_model-weights_manifest.json
       face_landmark_68_model-shard1
       face_recognition_model-weights_manifest.json
       face_recognition_model-shard1
   ```

## API Endpoints

### 1. Enroll Face
**POST** `/api/face/enroll`

Enroll a user's face for future verification.

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Base64 encoded image
}
```

**Response:**
```json
{
  "message": "Face enrolled successfully.",
  "method": "full",
  "modelsLoaded": true
}
```

### 2. Verify Face
**POST** `/api/face/verify`

Verify a face against stored enrollment.

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Base64 encoded image
}
```

**Response:**
```json
{
  "verified": true,
  "score": 0.85,
  "threshold": 0.6,
  "message": "Face verified successfully."
}
```

### 3. Check Face Status
**GET** `/api/face/status`

Check if user has face enrolled and system status.

**Response:**
```json
{
  "enrolled": true,
  "enrolledAt": "2025-01-20T10:30:00Z",
  "modelsLoaded": true,
  "systemReady": true
}
```

### 4. Delete Face Enrollment
**DELETE** `/api/face/enroll`

Delete user's face enrollment.

**Response:**
```json
{
  "message": "Face enrollment deleted successfully."
}
```

## Attendance with Face Verification

### Mark Attendance with Face
**POST** `/api/attendance/mark`

Mark attendance with optional face verification.

**Request Body:**
```json
{
  "code": "ABC123",
  "faceImage": "data:image/jpeg;base64,..." // Optional
}
```

**Response:**
```json
{
  "message": "Attendance marked successfully.",
  "attendanceId": 123,
  "timestamp": "2025-01-20T10:30:00Z",
  "faceVerified": true,
  "faceMatchScore": 0.85
}
```

## Fallback Mode

If models are not loaded, the system will:
- Use simple face detection (basic validation)
- Still allow attendance marking (face verification is optional)
- Log warnings about missing models

## Configuration

### Face Match Threshold
The default threshold is `0.6` (60% similarity). You can adjust this in `backend/utils/faceRecognition.js`:

```javascript
const THRESHOLD = 0.6; // Lower = stricter matching
```

### Requiring Face Verification
To make face verification mandatory for attendance, uncomment the check in `backend/routes/attendance.js`:

```javascript
if (!faceVerified) {
  return res.status(403).json({
    message: "Face verification failed. Please try again.",
  });
}
```

## Troubleshooting

### Models Not Loading
- Check that all model files are in `backend/models/`
- Verify file names match exactly
- Check file permissions
- Review server logs for specific errors

### Low Verification Scores
- Ensure good lighting in images
- Use clear, front-facing photos
- Avoid sunglasses, masks, or heavy makeup
- Try adjusting the threshold value

### Canvas/Image Processing Errors
- Ensure `canvas` package is installed: `npm install canvas`
- On Linux, you may need: `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`

## Security Notes

- Face descriptors are stored as JSON arrays in the database
- Original images are NOT stored (only face descriptors)
- Face verification is optional by default (can be made mandatory)
- All endpoints require JWT authentication

## Performance

- Model loading happens once at server startup
- Face detection: ~100-300ms per image
- Face verification: ~50-150ms per comparison
- Consider caching models in production

