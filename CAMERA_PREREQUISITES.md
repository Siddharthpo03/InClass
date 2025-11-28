# Camera/Face Capture Prerequisites

## Browser Requirements

### ✅ Supported Browsers:
- **Chrome/Edge** (Chromium) - Version 60+
- **Firefox** - Version 55+
- **Safari** - Version 11+ (macOS/iOS)

### ❌ Not Supported:
- Internet Explorer (any version)
- Very old browsers

## HTTPS Requirement

**IMPORTANT:** `getUserMedia()` (camera access) requires HTTPS in production!

### ✅ Works on:
- `https://` URLs
- `http://localhost` (development)
- `http://127.0.0.1` (development)
- `http://*.local` (local network)

### ❌ Does NOT work on:
- `http://` URLs in production (except localhost)
- Non-secure contexts

## Camera Permissions

1. **Browser will prompt** for camera permission on first use
2. **Click "Allow"** when prompted
3. If denied, go to browser settings:
   - **Chrome/Edge**: `chrome://settings/content/camera`
   - **Firefox**: `about:preferences#privacy` → Permissions → Camera
   - **Safari**: System Preferences → Security & Privacy → Camera

## Testing Checklist

1. ✅ Open browser console (F12)
2. ✅ Navigate to registration page
3. ✅ Click "Start Camera"
4. ✅ Allow camera permission if prompted
5. ✅ Check console for logs:
   - Should see: "📹 startCamera called"
   - Should see: "✅ Camera access granted"
   - Should see: "✅ Video metadata loaded"
   - Should see: "✅ Video is ready for capture!"
6. ✅ Look for green "Ready to capture" indicator
7. ✅ Click "Capture" button
8. ✅ Check console for capture logs

## Common Issues

### Issue: "Camera access denied"
**Solution**: 
- Check browser permissions
- Clear site data and try again
- Use `https://` or `localhost`

### Issue: "No camera found"
**Solution**:
- Check if camera is connected
- Check if another app is using the camera
- Try a different browser

### Issue: "Video not ready"
**Solution**:
- Wait a few seconds after clicking "Start Camera"
- Check console for error messages
- Refresh the page and try again

### Issue: No console output at all
**Solution**:
- Check if JavaScript is enabled
- Check browser console for errors
- Try a different browser
- Check if React DevTools shows the component

## Development Setup

If running locally with Vite:
```bash
npm run dev
```
This runs on `http://localhost:5173` (or similar) which works for camera access.

## Production Setup

For production, you MUST use HTTPS:
- Use a service like Vercel, Netlify, or AWS
- Or set up SSL certificate on your server
- Or use a reverse proxy (nginx) with SSL

