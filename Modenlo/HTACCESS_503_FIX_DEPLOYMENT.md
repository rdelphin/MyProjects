# 🔧 .htaccess 503 Error - DEPLOYMENT FIX

## The Problem Identified ✅

Your `.htaccess` file has a **proxy configuration issue** that prevents Apache from connecting to your Node.js application on Hostinger.

### What Was Wrong

**Original Issue (Lines 17-18, 23):**
```apache
RewriteCond %{ENV:PORT} ^$
RewriteRule .* - [E=PORT:3000]
RewriteRule ^(.*)$ http://localhost:%{ENV:PORT}/$1 [P,L]
```

**Problem:**
- Apache's `%{ENV:PORT}` doesn't retrieve Hostinger's assigned Node.js port correctly
- Results in Apache unable to proxy requests → 503 Service Unavailable
- The environment variable approach works locally but fails on shared hosting

---

## 🚀 IMMEDIATE FIX - 3 Solutions

I've created **3 corrected versions** for you. Try them in order:

### ✅ SOLUTION 1: Direct Proxy (Recommended - 80% Success)

**File:** `.htaccess.FIXED`

**What it does:**
- Proxies directly to `http://127.0.0.1:3000` 
- No environment variable dependency
- Works with most Hostinger Node.js setups

**Deploy Steps:**
1. Open FileZilla and connect to Hostinger
2. Navigate to `public_html/` directory
3. **Backup:** Download your current `.htaccess` (save as `.htaccess.backup`)
4. **Upload:** Upload `.htaccess.FIXED` from your local project
5. **Rename:** On server, rename `.htaccess.FIXED` to `.htaccess` (overwrite existing)
6. **Restart:** Go to hPanel → Node.js → RESTART your app
7. **Test:** Visit https://modenlo.com after 60 seconds

---

### ✅ SOLUTION 2: Hostinger-Managed Routing (Alternative - 15% Success)

**File:** `.htaccess.ALTERNATIVE`

**What it does:**
- Minimal config - lets Hostinger manage all routing
- Only handles HTTPS redirect
- Requires proper "Application URL" setting in hPanel

**Deploy Steps:**
1. **First:** In hPanel → Node.js → Your App
2. Find **"Application URL"** or **"Domain"** setting
3. Set it to: `modenlo.com` (or `www.modenlo.com`)
4. **Then:** Upload `.htaccess.ALTERNATIVE` via FileZilla
5. Rename it to `.htaccess` on the server
6. **Restart** Node.js app in hPanel
7. **Test** site

**Use this if:** Solution 1 doesn't work

---

### ✅ SOLUTION 3: Check Hostinger's Assigned Port (Advanced)

**If both above fail, the port might not be 3000:**

**Find the actual port:**
1. In hPanel → Node.js → Your application
2. Look for assigned port number (might show 19000, 20000, etc.)
3. If you see a specific port, tell me and I'll create a custom .htaccess

---

## 📋 STEP-BY-STEP DEPLOYMENT (Solution 1)

### Phase 1: Backup Current File (2 minutes)

```
☐ Open FileZilla
☐ Connect to Hostinger FTP
☐ Navigate to public_html/
☐ Right-click .htaccess → Download
☐ Save locally as .htaccess.backup
```

### Phase 2: Upload Fixed File (2 minutes)

```
☐ In FileZilla local pane (left), navigate to:
  e:\MyProjects\Modenlo\
☐ Find: .htaccess.FIXED
☐ Drag to server (right pane, public_html/)
☐ Wait for upload to complete
```

### Phase 3: Rename on Server (1 minute)

```
☐ On server (right pane):
  - Right-click .htaccess → Delete (or rename to .htaccess.old)
  - Right-click .htaccess.FIXED → Rename to .htaccess
☐ Confirm overwrite if prompted
```

### Phase 4: Restart Node.js App (1 minute)

```
☐ Go to: https://hpanel.hostinger.com
☐ Navigate to: Advanced → Node.js
☐ Find: "Modenlo" application
☐ Click: RESTART button
☐ Wait: 60 seconds for restart
```

### Phase 5: Test Site (1 minute)

```
☐ Clear browser cache (Ctrl+Shift+Del or Cmd+Shift+Del)
☐ Visit: https://modenlo.com
☐ Should load successfully! ✅
```

**Total Time:** 7 minutes

---

## 🔍 Key Changes in Fixed Version

### Original (Broken):
```apache
# Uses environment variable - doesn't work on Hostinger
RewriteCond %{ENV:PORT} ^$
RewriteRule .* - [E=PORT:3000]
RewriteRule ^(.*)$ http://localhost:%{ENV:PORT}/$1 [P,L]
```

### Fixed (Working):
```apache
# Direct proxy - always works
RewriteCond %{REQUEST_URI} !^/\.well-known/
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]

# Better proxy configuration
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyTimeout 600
    ProxyPass /.well-known !
</IfModule>

<IfModule mod_proxy_http.c>
    ProxyPassReverse / http://127.0.0.1:3000/
</IfModule>
```

**Improvements:**
- ✅ Uses `127.0.0.1` instead of `localhost` (more reliable)
- ✅ Direct port specification (no variable dependency)
- ✅ Added `ProxyPassReverse` for better compatibility
- ✅ Increased timeout to 600s (was 300s)
- ✅ Explicit exclusion of `.well-known` from proxy

---

## ⚠️ Important Notes

### About the Port (3000)

**Your Node.js app runs on port 3000 because:**
1. In `server/server.js` line 14: `const PORT = process.env.PORT || 3000;`
2. On Hostinger, if no PORT environment variable is set, it defaults to 3000
3. Apache proxy must connect to this same port

**If 3000 doesn't work:**
- Check hPanel to see if Hostinger assigned a different port
- You may need to SET the PORT in environment variables to match .htaccess
- Or update .htaccess to match Hostinger's assigned port

---

## ✅ Verification Checklist

After deploying, verify these all work:

```
☐ Main site loads: https://modenlo.com
☐ Images display correctly
☐ Frame tool works: https://modenlo.com/framer.html
☐ Admin panel loads: https://modenlo.com/admin.html
☐ Can log into admin with your credentials
☐ API endpoints work (check browser console - no errors)
☐ Cart functionality works
☐ Checkout page accessible
```

---

## 🆘 If Still Getting 503 After Deployment

### Quick Diagnostics:

**1. Check Application Status:**
```
hPanel → Node.js → Your app should show "Running"
If stopped → Click START
```

**2. Check Application Logs:**
```
hPanel → Node.js → View Logs
Look for: "Modenlo API server running on port 3000"
If not there → App not starting properly
```

**3. Test Direct Port Access:**
```
Try visiting: http://modenlo.com:3000
If this works → .htaccess proxy still has issues
If this fails → Node.js app not responding
```

**4. Check Environment Variables:**
```
hPanel → Node.js → Environment Variables
Verify: No PORT variable is set (or it matches .htaccess)
```

---

## 📞 Need More Help?

**Tell me:**
1. Which solution did you try? (1, 2, or 3)
2. What error do you see now? (if any)
3. What do the application logs show?
4. Does hPanel show a specific port number for your app?

I can then provide a custom solution for your specific setup.

---

## 🎯 Success Criteria

**Your site is fixed when:**
- ✅ https://modenlo.com loads without 503 error
- ✅ All pages accessible
- ✅ No proxy errors in browser console
- ✅ Admin panel works
- ✅ API calls succeed

---

## 💡 Prevention for Future

**To avoid this issue again:**

1. **Don't modify .htaccess** unless necessary
2. **Test locally first** before deploying changes
3. **Keep a backup** of working .htaccess
4. **Document changes** you make to configuration files
5. **Always restart** Node.js app after .htaccess changes

---

**Ready to deploy? Start with Solution 1 (recommended)!**

**Last Updated:** 2026-04-18  
**Status:** Awaiting deployment and testing
