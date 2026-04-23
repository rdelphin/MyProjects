# 🔧 Hostinger Node.js API Routing Fix

**Date:** April 23, 2026  
**Issue:** `/api/upload-image` returning 404 errors  
**Status:** ✅ FIXED

---

## Problem Summary

The upload endpoint `POST /api/upload-image` was returning 404 errors because the `.htaccess` file was blocking API requests from reaching the Express server.

### Root Cause

The previous `.htaccess` contained this rule:
```apache
# Leave API paths untouched
RewriteRule ^api/ - [L]
```

This told Apache: **"Don't process /api/ requests, treat them as static files"**

Since there was no physical `/api/` folder, Apache returned 404 errors.

---

## Solution

### Understanding Hostinger's Node.js Architecture

On Hostinger Business hosting:

1. **Hostinger assigns a port** via `process.env.PORT` (not hardcoded 3000)
2. **Domain routes directly to Node.js** - Hostinger's internal routing handles this
3. **Express serves everything** - Both static files (via `express.static`) AND API routes

### The Fix

**Updated `.htaccess` to be minimal/empty:**

```apache
# Hostinger Node.js Deployment Configuration
# The Express server handles ALL requests (static files + API routes)
# No special .htaccess rules needed - Hostinger routes domain directly to Node.js app

# Optional: Force HTTPS (if not already handled by Hostinger)
# RewriteEngine On
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

**Key change:** Removed the blocking rule that prevented API requests from reaching Express.

---

## How It Works Now

### Request Flow for `/api/upload-image`:

```
User Browser: fetch('https://modenlo.com/api/upload-image', {...})
    ↓
Hostinger Internal Routing (managed by Hostinger)
    ↓
Node.js Express Server (on process.env.PORT)
    ↓
Express Router: app.post('/api/upload-image', uploadOriginal.single('image'), ...)
    ↓
Multer Middleware: Processes FormData, saves to /uploads/originals/
    ↓
Response: { success: true, imageId: "original-xxx", ... }
    ↓
✅ Upload Success!
```

### Request Flow for Static Files:

```
User Browser: fetch('https://modenlo.com/style.css')
    ↓
Hostinger Internal Routing
    ↓
Node.js Express Server
    ↓
express.static() Middleware (line 164 in server.js)
    ↓
Serves: /public_html/style.css
    ↓
✅ Static file served!
```

---

## Code References

### Express Server Configuration (server.js)

**Line 14:** Port assignment
```javascript
const PORT = process.env.PORT || 3000;
```

**Line 164:** Static file serving
```javascript
app.use(express.static(path.join(__dirname, '..')));
```

**Line ~1036:** Upload endpoint
```javascript
app.post('/api/upload-image', uploadOriginal.single('image'), async (req, res) => {
    // Multer handles the file upload
    // Saves to ORIGINALS_DIR: /uploads/originals/
    // Returns imageId for reference
});
```

### Client-Side Request (script.js)

**Line 5:** API base URL
```javascript
var API_BASE = `${window.location.origin}/api`;
```

**Line 1568:** Upload request
```javascript
const uploadResponse = await fetch(`${API_BASE}/upload-image`, {
    method: 'POST',
    body: formData
});
```

---

## Why This Approach Works

### 1. **No Proxy Needed**
- Traditional setups require Apache to proxy `/api/` to Node.js on a different port
- Hostinger handles this automatically when you configure a Node.js application
- No `ProxyPass` or `RewriteRule [P]` directives needed

### 2. **Express Handles Everything**
- Express can serve both static files AND API routes
- `express.static()` efficiently serves HTML, CSS, JS, images
- API routes are handled by explicit route handlers

### 3. **Environment-Based Configuration**
- `process.env.PORT` - Hostinger assigns the port
- No hardcoded ports or URLs needed
- Works seamlessly in production

---

## Deployment Checklist

When deploying to Hostinger, ensure:

- ✅ Upload this **new `.htaccess`** file (not old versions)
- ✅ Node.js application configured in hPanel
- ✅ `process.env.PORT` is available (Hostinger provides this)
- ✅ Domain points to Node.js application
- ✅ Application Status shows "Running"
- ✅ No proxy rules in .htaccess

---

## Testing the Fix

### 1. Test Upload Endpoint:
```bash
# Should return JSON, not 404
curl -X POST https://modenlo.com/api/upload-image \
  -F "image=@test.png" \
  -F "itemId=12345"
```

### 2. Test Static Files:
```bash
# Should return HTML content
curl https://modenlo.com/index.html
```

### 3. Test API Routes:
```bash
# Should return frames JSON
curl https://modenlo.com/api/frames
```

### 4. Browser Test:
1. Go to https://modenlo.com/framer.html
2. Upload an image
3. Click "Add to Cart"
4. Check browser console - should see:
   ```
   [ADD TO CART] Uploading to server...
   [ADD TO CART] Upload successful, imageId: original-xxx
   ```

---

## Related Files

- **`.htaccess`** - Updated configuration (minimal rules)
- **`server/server.js`** - Express server with API routes
- **`script.js`** - Client-side upload code
- **`UPLOAD_CODE_EXPLANATION.md`** - Detailed upload flow
- **`HOSTINGER_DEPLOYMENT_GUIDE.md`** - Full deployment steps

---

## Important Notes

### ⚠️ Do NOT Revert to Old .htaccess

Previous `.htaccess` versions had rules that blocked API requests:
- `.htaccess.ALTERNATIVE`
- `.htaccess.FIXED`
- `.htaccess.HOSTINGER_*`

**These will break API routes!** Always use the current minimal `.htaccess`.

### ✅ This Setup is Production-Ready

- No hardcoded ports or IPs
- Works with Hostinger's managed Node.js hosting
- HTTPS handled by Hostinger
- SSL certificate managed by Hostinger
- Scalable and maintainable

---

## Summary

**The upload request does NOT point to a real PHP file** - it's handled by an Express route handler in Node.js.

**The architecture:**
- Hostinger routes all requests to Node.js/Express
- Express handles both static files and API endpoints
- No Apache proxy rules needed
- `.htaccess` kept minimal to avoid interference

**Result:** `/api/upload-image` now works correctly on the live server! 🎉

---

## Questions?

If you see 404 errors on API routes:
1. Check Node.js application status in hPanel
2. Verify `.htaccess` matches this document
3. Check application logs for errors
4. Ensure `process.env.PORT` is available
5. Restart Node.js application in hPanel

**For additional help, see `TROUBLESHOOTING.md`**
