# Face-API.js Models Directory

This directory should contain the face-api.js model files required for face recognition.

## Required Files

Download the following files from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

### SSD Mobilenet v1:
- `ssd_mobilenetv1_model-weights_manifest.json`
- `ssd_mobilenetv1_model-shard1`
- `ssd_mobilenetv1_model-shard2`

### Face Landmark 68:
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`

### Face Recognition:
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

## Quick Download (Linux/Mac)

```bash
cd frontend/public/models

# Download SSD Mobilenet v1
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard2

# Download Face Landmark 68
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1

# Download Face Recognition
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2
```

## Windows Download

1. Create the `models` folder: `frontend\public\models\`
2. Visit: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
3. Download each file listed above
4. Place all files in the `models` folder

## Verification

After placing files, verify they're accessible:
- Open browser DevTools (F12) → Network tab
- Navigate to: http://localhost:5173/models/ssd_mobilenetv1_model-weights_manifest.json
- Should return JSON, not HTML/404

