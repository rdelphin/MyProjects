# File Protocol (file://) API Access Fix ✅

## Problem
When opening HTML files directly from Windows Explorer (double-clicking), they open with the `file://` protocol instead of through the web server at `http://localhost:3000`. This causes "Failed to fetch" errors because:

```
file:///E:/MyProjects/Modenlo/checkout.html
```

The JavaScript tries to make API calls to `/api/health`, which becomes:
```
file:///E:/MyProjects/Modenlo/api/health  ❌ DOES NOT EXIST
```

Instead of:
```
http://localhost:3000/api/health  ✅ CORRECT
```

## Solution Implemented ✅

Modified all scripts that make API calls to automatically detect the `file://` protocol and redirect API requests to `http://localhost:3000/api`.

### Code Pattern Applied

**Before:**
```javascript
const API_BASE = `${window.location.origin}/api`;
```

**After:**
```javascript
// API Configuration - works on localhost, mobile devices, production, AND file:// protocol
const API_BASE = window.location.protocol === 'file:' 
    ? 'http://localhost:3000/api'  // Use localhost when opened as file://
    : `${window.location.origin}/api`;  // Use current origin when via web server
```

### Files Updated

1. ✅ **checkout-script.js** - Main checkout functionality with health check
2. ✅ **admin-script.js** - Admin panel frames management
3. ✅ **admin-categories-script.js** - Categories management
4. ✅ **admin-clocks-script.js** - Clocks management
5. ✅ **admin-mounts-script.js** - Mounts management
6. ✅ **admin-orders-script.js** - Orders management
7. ✅ **clock-script.js** - Clock page functionality

## How It Works

### Detection Logic
```javascript
window.location.protocol === 'file:'
```

When this condition is true, the script knows it's being opened directly from the file system.

### Automatic Fallback
- **file:// protocol detected** → Use `http://localhost:3000/api`
- **http:// or https:// protocol** → Use current origin `/api`

### Example Flow

#### Opening from File Explorer:
1. User double-clicks `checkout.html`
2. Browser opens: `file:///E:/MyProjects/Modenlo/checkout.html`
3. Script detects: `window.location.protocol === 'file:'`
4. API_BASE becomes: `http://localhost:3000/api`
5. Health check calls: `http://localhost:3000/api/health` ✅

#### Opening from Web Server:
1. User navigates to: `http://localhost:3000/checkout.html`
2. Script detects: `window.location.protocol === 'http:'`
3. API_BASE becomes: `http://localhost:3000/api`
4. Health check calls: `http://localhost:3000/api/health` ✅

#### Production Server:
1. User navigates to: `https://modenlo.com/checkout.html`
2. Script detects: `window.location.protocol === 'https:'`
3. API_BASE becomes: `https://modenlo.com/api`
4. Health check calls: `https://modenlo.com/api/health` ✅

## Benefits

✅ **Works both ways** - Open files directly OR via web server
✅ **No manual configuration** - Automatically detects the environment
✅ **Development friendly** - Developers can double-click files during development
✅ **Production ready** - Still works correctly on live servers
✅ **Backward compatible** - No breaking changes

## Requirements

⚠️ **Important:** The Node.js server MUST be running for this to work!

```bash
cd E:\MyProjects\Modenlo\server
node server.js
```

Even when opening files via `file://`, the server must be running to handle API requests.

## Testing

### Test 1: File Protocol
1. Ensure server is running: `node server.js`
2. Double-click `checkout.html` from Windows Explorer
3. Open browser console (F12)
4. Look for:
   ```
   [CONFIG] Protocol: file:
   [CONFIG] API_BASE: http://localhost:3000/api
   [HEALTH CHECK] Testing API connectivity...
   [HEALTH CHECK] API is accessible: {success: true, message: "API is running", ...}
   ```

### Test 2: HTTP Protocol
1. Ensure server is running: `node server.js`
2. Open browser and navigate to `http://localhost:3000/checkout.html`
3. Open browser console (F12)
4. Look for:
   ```
   [CONFIG] Protocol: http:
   [CONFIG] API_BASE: http://localhost:3000/api
   [HEALTH CHECK] Testing API connectivity...
   [HEALTH CHECK] API is accessible: {success: true, message: "API is running", ...}
   ```

## Troubleshooting

### Still Getting "Failed to fetch"?

**Check 1: Is the server running?**
```bash
netstat -ano | findstr :3000
```
Should show: `LISTENING` on port 3000

**Check 2: Test the health endpoint directly**
```bash
curl http://localhost:3000/api/health
```
Should return: `{"success":true,"message":"API is running",...}`

**Check 3: Browser console**
Press F12 and look for:
- Red CORS errors → Server not responding
- `[CONFIG]` logs → Shows which protocol and API_BASE is being used
- `[HEALTH CHECK]` logs → Shows API connectivity status

### Server Not Running
```
Error: Failed to fetch
```
**Solution:** Start the server:
```bash
cd E:\MyProjects\Modenlo\server
node server.js
```

### Wrong Port
If your server runs on a different port (not 3000), update the fallback:
```javascript
const API_BASE = window.location.protocol === 'file:' 
    ? 'http://localhost:YOUR_PORT/api'  // Change 3000 to your port
    : `${window.location.origin}/api`;
```

## Technical Details

### Why This Approach?

**Alternative 1: Always use localhost**
```javascript
const API_BASE = 'http://localhost:3000/api';  // ❌ Breaks in production
```
Problem: Won't work on production servers like `modenlo.com`

**Alternative 2: Hardcode production URL**
```javascript
const API_BASE = 'https://modenlo.com/api';  // ❌ Breaks in development
```
Problem: Won't work on `localhost` during development

**Our Solution: Dynamic detection** ✅
```javascript
const API_BASE = window.location.protocol === 'file:' 
    ? 'http://localhost:3000/api'  // Development fallback
    : `${window.location.origin}/api`;  // Production/localhost via web server
```
Works everywhere!

### Security Considerations

- File protocol detection doesn't pose security risks
- The server still enforces authentication and authorization
- CORS is handled at the server level
- Production deployments are unaffected

## Summary

✅ **Problem:** Opening files via `file://` protocol couldn't reach the API server
✅ **Solution:** Automatically detect `file://` protocol and redirect API calls to `localhost:3000`
✅ **Files Modified:** 7 JavaScript files that make API calls
✅ **Result:** Application works seamlessly whether opened via file explorer or web server

---
**Status:** FIXED ✅  
**Date:** April 20, 2026  
**Files Modified:** 7  
**Testing:** Verified working in both file:// and http:// modes
