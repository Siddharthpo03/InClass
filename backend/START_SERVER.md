# Starting the Server

## Quick Start

```bash
npm start
```

## If Port 4000 is Already in Use

### Option 1: Stop the Existing Process

**Windows PowerShell:**
```powershell
# Find process using port 4000
Get-NetTCPConnection -LocalPort 4000 | Select-Object OwningProcess

# Stop the process (replace PID with actual process ID)
Stop-Process -Id <PID> -Force

# Or stop all Node processes
Get-Process node | Stop-Process -Force
```

**Windows Command Prompt:**
```cmd
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### Option 2: Use a Different Port

Edit `.env` file and change:
```
PORT=4001
```

Then start the server:
```bash
npm start
```

## Expected Output

When the server starts successfully, you should see:

```
✅ PostgreSQL connected successfully. Date: ...
⚠️  TensorFlow.js native addon not available. Face recognition will use fallback mode.
✅ Server running on port 4000
✅ Socket.io initialized and ready for connections
```

## Troubleshooting

### "Database connection failed"
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- Test connection: `psql $DATABASE_URL`

### "Port already in use"
- Use Option 1 or Option 2 above

### "Cannot find module"
- Run: `npm install`

### TensorFlow.js Warning
- This is normal on Windows without Visual Studio build tools
- Server will work fine, face recognition will use fallback mode
- To enable full face recognition, install Visual Studio build tools and run:
  ```bash
  npm rebuild @tensorflow/tfjs-node --build-addon-from-source
  ```

## Testing the Server

Once the server is running, test it:

```bash
# In another terminal
node test-server.js
```

Or manually:
```bash
curl http://localhost:4000/health
```

## Development Mode

For auto-restart on file changes:
```bash
npm run server
```
(Requires nodemon to be installed)

