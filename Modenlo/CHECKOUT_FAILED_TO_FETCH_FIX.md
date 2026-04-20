# Checkout "Failed to Fetch" Error - SOLVED ✅

## Problem
You're seeing this error in checkout-script.js:
```
[HEALTH CHECK] Failed to reach API: TypeError: Failed to fetch
[CHECKOUT] API health check failed
```

## Root Cause
The page is being opened using the **file:// protocol** (e.g., `file:///E:/MyProjects/Modenlo/checkout.html`) instead of through the **web server** (e.g., `http://localhost:3000/checkout.html`).

### Why This Happens
- When you open HTML files directly from Windows Explorer (double-clicking), they open with `file://` protocol
- Browsers **block** JavaScript fetch requests from `file://` to `http://localhost` for security (CORS policy)
- This causes all API calls to fail with "Failed to fetch"

## Solution ✅

### Always Access the Site Through the Web Server

**❌ WRONG WAY:**
- Opening files directly from Windows Explorer
- URL shows: `file:///E:/MyProjects/Modenlo/checkout.html`

**✅ CORRECT WAY:**
- Access through the running Node.js server
- URL shows: `http://localhost:3000/checkout.html`

### How to Access Correctly

1. **Ensure the server is running:**
   ```bash
   cd E:\MyProjects\Modenlo\server
   node server.js
   ```
   You should see:
   ```
   Modenlo API server running on port 3000
   Landing Page: http://localhost:3000/
   ```

2. **Open your browser and navigate to:**
   - Homepage: `http://localhost:3000/`
   - Framer Tool: `http://localhost:3000/framer.html`
   - Cart: `http://localhost:3000/cart.html`
   - Checkout: `http://localhost:3000/checkout.html`
   - Admin: `http://localhost:3000/admin.html`

3. **Bookmark these URLs** for easy access

## Verification

To verify the API is working correctly:

1. **Test the health endpoint:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "message": "API is running",
     "timestamp": "2026-04-20T21:57:40.480Z",
     "tempImagesCount": 0
   }
   ```

2. **Open browser console** (F12) and check:
   - No CORS errors
   - Network tab shows successful API calls
   - Console shows: `[HEALTH CHECK] API is accessible`

## Technical Details

### What the Health Check Does
```javascript
// From checkout-script.js line 5-27
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            return false;
        }
        
        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('[HEALTH CHECK] Failed to reach API:', error);
        return false;
    }
}
```

### Server Health Endpoint
```javascript
// From server.js line 1084-1091
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API is running',
        timestamp: new Date().toISOString(),
        tempImagesCount: tempImageStore.size
    });
});
```

### API Base Configuration
```javascript
// From checkout-script.js line 2
const API_BASE = `${window.location.origin}/api`;
```

When accessed via:
- ✅ `http://localhost:3000` → API_BASE = `http://localhost:3000/api` → **Works!**
- ❌ `file:///E:/MyProjects/Modenlo` → API_BASE = `file:///E:/MyProjects/Modenlo/api` → **Fails!**

## Common Mistakes to Avoid

1. **❌ Opening files from Windows Explorer** - Always use the browser with http://localhost:3000
2. **❌ Forgetting to start the server** - Run `node server.js` first
3. **❌ Using wrong port** - Must be port 3000 (or whatever PORT is in .env)
4. **❌ Mixing file:// and http://** - Stay consistent with http://localhost:3000

## Quick Reference

### Start Development Server
```bash
cd E:\MyProjects\Modenlo\server
node server.js
```

### Access Application
```
http://localhost:3000/
```

### Stop Server
```
Ctrl + C (in the terminal running the server)
```

## Status: RESOLVED ✅

The API endpoint exists and is working correctly. The issue was accessing the page via `file://` instead of `http://localhost:3000`. No code changes were needed.

---
**Last Updated:** April 20, 2026
**Issue Status:** RESOLVED
**Resolution:** Use http://localhost:3000 instead of file:// protocol
