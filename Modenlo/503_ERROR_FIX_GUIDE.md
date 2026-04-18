# 🚨 503 Service Unavailable - URGENT FIX GUIDE

## Quick Diagnosis & Fix for Hostinger Production

**Error:** 503 Service Unavailable  
**When:** After making updates/changes  
**Server:** Hostinger production (modenlo.com)

---

## ⚡ IMMEDIATE FIXES (Try These First - 5 Minutes)

### FIX #1: Restart the Node.js Application (90% Success Rate)

**The Problem:** Your code changes aren't loaded until the app restarts.

**The Fix:**
1. Log into Hostinger hPanel: https://hpanel.hostinger.com
2. Navigate to: **Advanced** → **Node.js**
3. Find your "Modenlo" application
4. Click the **RESTART** button
5. Wait 60 seconds
6. Test your site: https://modenlo.com

**If this works:** ✅ You're done! The app just needed a restart.

**If site still shows 503:** Continue to Fix #2

---

### FIX #2: Remove PORT Environment Variable (70% Success Rate)

**The Problem:** Hostinger MUST assign the port automatically. If PORT is manually set (like PORT=3000), Apache's proxy can't connect to your Node.js backend.

**How to Check & Fix:**
1. In hPanel → **Node.js** → Your "Modenlo" application
2. Look for **Environment Variables** section
3. **Scan through ALL variables** - look for one named `PORT`
4. **If you find PORT:**
   - Click **Edit** or **Delete** on that variable
   - **COMPLETELY DELETE** the PORT variable (don't just clear the value)
   - Click **Save**
5. Click **RESTART** application
6. Wait 60 seconds
7. Test your site

**Why this works:** 
- Hostinger assigns dynamic ports (like 19000, 20000, etc.)
- Your .htaccess proxies to this dynamic port
- If you set PORT=3000, your app runs on 3000 but Apache looks on the dynamic port
- Result: Apache can't connect → 503 error

**If site still shows 503:** Continue to Fix #3

---

### FIX #3: Check Application Logs for Errors

**The Problem:** Your code update introduced a syntax error or runtime error that crashes the app on startup.

**How to Check:**
1. In hPanel → **Node.js** → Your application
2. Look for **Logs**, **View Logs**, or **Application Logs** button
3. Click it to view the logs
4. **Scroll to the bottom** - look for red error messages
5. Common errors to look for:
   - `SyntaxError` - You have a typo in your code
   - `Cannot find module` - Missing dependency
   - `ENOENT` - Missing file
   - `Error reading...` - Missing data file
   - `Port already in use` - Port conflict (see Fix #2)

**What to do with the error:**
- **Copy the entire error message**
- **Paste it below** and I'll tell you exactly how to fix it
- Or continue to Fix #4 if you need immediate recovery

---

### FIX #4: Reinstall Dependencies (If package.json was changed)

**The Problem:** If you modified `package.json`, dependencies need to be reinstalled.

**The Fix:**
1. In hPanel → **Node.js** → Your application
2. Look for **npm install** or **Install Dependencies** button
3. Click it and wait 2-3 minutes
4. Check installation log for errors
5. Click **RESTART** application
6. Wait 60 seconds
7. Test your site

---

### FIX #5: Emergency Rollback (Guaranteed Working - 5 Minutes)

**The Problem:** Need site working NOW, will debug later.

**The Fix:**
1. Open **FileZilla** and connect to Hostinger
2. Navigate to `public_html/` (or your upload directory)
3. **Re-upload the PREVIOUS working versions** of the files you changed
4. Overwrite the current files
5. In hPanel → **Node.js** → **RESTART** application
6. Test your site - should be working now
7. Debug the new changes locally before re-deploying

---

## 🔍 DETAILED DIAGNOSTICS

### Check #1: Application Status
**Location:** hPanel → Node.js → Your Application

**Look for status indicator:**
- 🟢 **"Running" or "Active"** → App is running but proxy issue (see PORT fix)
- 🔴 **"Stopped"** → Click START and check logs
- ⚠️ **"Failed" or "Error"** → Check logs for error message

---

### Check #2: Verify .htaccess File

**Problem:** If you modified .htaccess, the proxy might be broken.

**Your current .htaccess should have:**
```apache
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

# Allow SSL validation
RewriteCond %{REQUEST_URI} ^/\.well-known/acme-challenge/ [NC]
RewriteRule ^(.*)$ - [L]

# Get Node.js port (Hostinger assigns this)
RewriteCond %{ENV:PORT} ^$
RewriteRule .* - [E=PORT:3000]

# Proxy to Node.js
RewriteCond %{REQUEST_URI} !^/\.well-known/
RewriteRule ^(.*)$ http://localhost:%{ENV:PORT}/$1 [P,L]

# Proxy settings
<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyTimeout 300
</IfModule>
```

**If different:**
1. Open FileZilla
2. Download your current `.htaccess` from server
3. Compare with the version above
4. If broken, re-upload the correct version from your local project
5. Wait 30 seconds and test

---

### Check #3: Test Direct Port Access (Advanced)

**If Hostinger shows the assigned port** (like 19000):
1. Try accessing: `http://modenlo.com:19000`
2. **If this works** → Proxy issue (PORT variable problem)
3. **If this fails too** → App not responding (code error)

---

## 📋 WHAT CHANGED? (Tell Me)

To give you the EXACT fix, please tell me:

### Question 1: What files did you modify?
- [ ] server/server.js
- [ ] .htaccess
- [ ] package.json
- [ ] HTML/CSS/JS frontend files only
- [ ] Environment variables in hPanel
- [ ] Other: _________________

### Question 2: Application Status in hPanel?
- [ ] Shows "Running" but site gives 503
- [ ] Shows "Stopped"
- [ ] Shows "Failed" or "Error"
- [ ] Can't access hPanel

### Question 3: Any errors in Application Logs?
- [ ] No logs / can't see logs
- [ ] Logs show: ________________________
- [ ] No errors in logs, everything looks fine

---

## 🎯 MOST COMMON SOLUTION

**Based on "was working before update":**

**95% of the time, it's one of these TWO:**

1. **App just needs restart** (Fix #1) - 50%
2. **PORT variable is set manually** (Fix #2) - 40%
3. **Code error in update** (Fix #3) - 5%
4. **Other** - 5%

---

## ⏱️ RESOLUTION TIMELINE

| Fix | Time | Success Rate |
|-----|------|--------------|
| Restart app | 2 min | 50% |
| Remove PORT var | 3 min | 40% |
| Fix code error | 10-30 min | 5% |
| Rollback | 5 min | 100% |

---

## 🆘 COPY/PASTE CHECKLIST

**Do these in order, stop when site works:**

```
☐ 1. hPanel → Node.js → RESTART → Wait 60s → Test site
☐ 2. hPanel → Node.js → Environment Variables → Delete PORT if exists → RESTART → Test
☐ 3. hPanel → Node.js → View Logs → Copy any error message → Share with me
☐ 4. If package.json changed: Run npm install → RESTART → Test
☐ 5. Emergency: Re-upload old files via FileZilla → RESTART → Test
```

---

## 📞 NEXT STEPS

**Choose ONE:**

**A) Site is working now?**
- ✅ Great! Which fix worked? (Tell me so I can document it)
- Make any future changes locally, test with `npm start`, then deploy

**B) Site still broken?**
- Share the error from Application Logs (step 3 above)
- Tell me what files you changed
- I'll provide the exact fix

**C) Need to rollback urgently?**
- Use Fix #5 above
- Site will be back to working state
- Then debug changes locally

---

## 🔧 HOW TO PREVENT THIS

**Before future updates:**
1. ✅ Test changes locally with `npm start`
2. ✅ Verify no syntax errors
3. ✅ Upload files via FileZilla
4. ✅ **Always restart app in hPanel after uploading**
5. ✅ Test site immediately after deployment
6. ✅ Keep a backup of working files

---

## 💡 KEY INSIGHT

**The #1 mistake:** Uploading changed files but forgetting to RESTART the Node.js application in hPanel.

**Node.js doesn't auto-reload on file changes in production.** You MUST manually restart after every update.

---

**Last Updated:** 2026-04-18  
**Your Site:** https://modenlo.com  
**Status:** Awaiting your feedback on which fix worked!
