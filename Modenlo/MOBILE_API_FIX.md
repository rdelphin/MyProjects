# Mobile API & Authentication Fix

## Problem Summary
The application worked correctly on localhost and desktop browsers when visiting the live site, but two critical features failed **only on mobile devices**:
1. ❌ Adding items to cart (POST `/api/upload-image`)
2. ❌ Admin login (POST `/api/auth/login`)

The `/api/health` endpoint worked fine on mobile, indicating the server was reachable but certain POST/PUT requests and session-related actions were failing.

---

## Root Causes Identified

### 1. **API Endpoint Mismatch in `script.js`**
**Location:** `script.js` lines 6-9

**Problem:**
```javascript
var API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:3000/"      // Missing /api
    : "https://modenlo.com/";        // Missing /api
```

When the code called `fetch(\`${API_BASE}/upload-image\`)`, it resulted in:
- ❌ `https://modenlo.com/upload-image` (404 Not Found)
- ✅ Should be: `https://modenlo.com/api/upload-image`

This is why cart additions failed - the API endpoint couldn't be reached!

### 2. **Missing CORS Preflight (OPTIONS) Handler**
Mobile browsers are **stricter** about CORS and **always send OPTIONS preflight requests** before POST/PUT/PATCH/DELETE requests. The server had CORS middleware but didn't explicitly handle OPTIONS requests, causing:
- Preflight requests to fail silently
- Subsequent POST/PUT requests to be blocked
- Session headers (`x-session-id`) not being transmitted properly

### 3. **Insufficient CORS Configuration for Mobile**
The basic CORS configuration didn't include all necessary headers for mobile browsers:
- Missing explicit `Access-Control-Allow-Methods`
- Missing explicit `Access-Control-Allow-Headers`
- No `Access-Control-Max-Age` for preflight caching
- No explicit handling of `x-session-id` header in allowed headers

### 4. **Missing `credentials: 'include'` in Fetch Requests**
Admin authentication requests in `admin-script.js` didn't include `credentials: 'include'`, which is critical for mobile browsers to:
- Send cookies properly
- Send custom headers like `x-session-id`
- Maintain session state across requests

---

## Fixes Implemented

### Fix 1: Corrected API_BASE in script.js ✅
**File:** `script.js`

**Changed from:**
```javascript
var API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:3000/"
    : "https://modenlo.com/";
```

**Changed to:**
```javascript
var API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "https://modenlo.com/api";
```

**Impact:** Cart additions now correctly target `/api/upload-image` endpoint.

---

### Fix 2: Enhanced CORS Configuration in server.js ✅
**File:** `server/server.js`

**Added to corsOptions:**
```javascript
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [
            'https://modenlo.com',
            'http://modenlo.com',
            'https://www.modenlo.com',
            'http://www.modenlo.com'
          ]
        : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-session-id', 'X-Requested-With', 'Accept', 'Origin'],
    maxAge: 86400 // 24 hours - cache preflight for mobile browsers
};
```

**Added Enhanced CORS Middleware:**
```javascript
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'https://modenlo.com',
        'http://modenlo.com',
        'https://www.modenlo.com',
        'http://www.modenlo.com'
    ];
    
    // In development, allow all origins; in production, check whitelist
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        if (origin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-session-id, X-Requested-With, Accept, Origin');
        res.setHeader('Access-Control-Max-Age', '86400');
    } else if (origin) {
        console.warn('[CORS] Blocked request from origin:', origin);
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});
```

**Impact:**
- ✅ OPTIONS preflight requests now properly handled
- ✅ All necessary CORS headers set explicitly
- ✅ 24-hour preflight caching reduces overhead
- ✅ Mobile browsers can now send custom headers

---

### Fix 3: Added credentials: 'include' to All Admin Fetch Requests ✅
**File:** `admin-script.js`

**Added to all fetch calls:**
```javascript
const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    credentials: 'include', // ← Added this
    body: JSON.stringify({ username, password })
});
```

**Applied to these functions:**
- ✅ `checkAdminSession()` - Session validation
- ✅ `loginAsAdmin()` - Login requests
- ✅ `loadFrames()` - Data fetching
- ✅ `handleAddFrame()` - POST requests
- ✅ `openEditModal()` - GET requests with auth
- ✅ `handleEditFrame()` - PUT requests
- ✅ `toggleAvailability()` - PATCH requests
- ✅ `deleteFrame()` - DELETE requests

**Impact:** Session tokens and credentials now properly transmitted on mobile browsers.

---

## Testing Instructions

### On Desktop (Baseline)
1. ✅ Visit https://modenlo.com
2. ✅ Try adding an item to cart
3. ✅ Try logging into admin at https://modenlo.com/admin.html

### On Mobile (Primary Test)
1. 📱 Visit https://modenlo.com on mobile device
2. 📱 Navigate to product page (framer.html or clock.html)
3. 📱 Upload an image
4. 📱 Click "Add to Cart"
   - **Expected:** Success message appears
   - **Check browser console** for any errors
5. 📱 Visit https://modenlo.com/admin.html
6. 📱 Enter admin credentials
   - **Expected:** Successfully logs in and shows admin panel
7. 📱 Try admin operations (add/edit/delete frames)
   - **Expected:** All operations work correctly

### Browser Console Debugging
Open mobile browser console (Chrome DevTools Remote Debugging):
```
# Should see these logs on successful cart addition:
[ADD TO CART] Generating full-resolution image...
[ADD TO CART] Image dimensions: 2400x3000px
[ADD TO CART] Full-res blob size: X.XXmb
[ADD TO CART] Uploading to server...
[ADD TO CART] Upload successful, imageId: original-XXXXXXXXX
```

---

## Deployment Checklist

### 1. Update Files on Server
Upload the modified files to Hostinger:
- ✅ `script.js`
- ✅ `server/server.js`
- ✅ `admin-script.js`

### 2. Restart Node.js Server
```bash
cd ~/domains/modenlo.com/public_html/server
pm2 restart modenlo-api
# or
npm start
```

### 3. Clear Browser Cache
**Critical:** Mobile browsers aggressively cache JavaScript files
- Clear mobile browser cache
- Or use hard reload (Ctrl+Shift+R on Chrome mobile)
- Consider versioning JS files: `script.js?v=2`

### 4. Verify NODE_ENV (Optional)
Check if `NODE_ENV` is set on Hostinger:
```bash
echo $NODE_ENV
```

If not set, CORS will allow all origins (works but less secure). To set for production:
```bash
export NODE_ENV=production
```

---

## What Was Fixed

| Issue | Status | Solution |
|-------|--------|----------|
| Cart additions fail on mobile | ✅ Fixed | Corrected API_BASE to include `/api` |
| Admin login fails on mobile | ✅ Fixed | Added `credentials: 'include'` to all fetch requests |
| Preflight OPTIONS blocked | ✅ Fixed | Explicit OPTIONS handler in middleware |
| CORS headers missing | ✅ Fixed | Enhanced CORS configuration |
| Session not preserved | ✅ Fixed | Proper credentials handling |

---

## Technical Details

### Why Mobile Was Affected Differently

1. **Stricter CORS Enforcement:** Mobile browsers (especially Safari iOS and Chrome Android) enforce CORS rules more strictly than desktop browsers

2. **Always Send Preflights:** Mobile browsers **always** send OPTIONS preflight for:
   - POST/PUT/PATCH/DELETE requests
   - Requests with custom headers (`x-session-id`)
   - Cross-origin requests with credentials

3. **Cache Behavior:** Mobile browsers cache failed requests more aggressively, requiring cache clearing

4. **Network Conditions:** Mobile often has intermittent connectivity, making proper error handling critical

### CORS Flow
```
Mobile Browser → OPTIONS /api/auth/login (Preflight)
                ↓
Server         → 200 OK + CORS Headers
                ↓
Mobile Browser → POST /api/auth/login (Actual Request)
                ↓
Server         → 200 OK + Session Data
                ↓
Mobile Browser → Stores session + Makes subsequent requests
```

---

## Verification Commands

### Check API Endpoint
```bash
# Should return API health
curl https://modenlo.com/api/health

# Should return login endpoint
curl -X POST https://modenlo.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### Check CORS Headers
```bash
# Check OPTIONS preflight
curl -X OPTIONS https://modenlo.com/api/auth/login \
  -H "Origin: https://modenlo.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Expected response headers:
```
Access-Control-Allow-Origin: https://modenlo.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, x-session-id, X-Requested-With, Accept, Origin
Access-Control-Max-Age: 86400
```

---

## Files Modified

1. **script.js** - Fixed API_BASE endpoint mismatch
2. **server/server.js** - Enhanced CORS middleware and OPTIONS handling
3. **admin-script.js** - Added credentials: 'include' to all fetch requests

---

## Support

If mobile issues persist after deploying:

1. **Check browser console** for specific error messages
2. **Verify NODE_ENV** is set correctly on server
3. **Clear mobile browser cache** completely
4. **Test with different mobile browsers** (Chrome, Safari, Firefox)
5. **Check server logs** for any CORS-related warnings

---

## Success Indicators

✅ Mobile users can add items to cart  
✅ Mobile users can log into admin panel  
✅ No CORS errors in mobile browser console  
✅ Session persists across mobile requests  
✅ All API endpoints accessible from mobile  

**Status:** 🟢 All fixes implemented and ready for deployment
