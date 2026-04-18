# 🚀 .htaccess Deployment Guide for Hostinger

Complete guide to deploy and configure .htaccess for hybrid Node.js deployment on Hostinger.

---

## 📋 Overview

This deployment method uses **Apache + Node.js hybrid approach**:
- Apache serves static files (HTML, CSS, JS, images) - FAST ⚡
- Node.js handles API requests only - EFFICIENT 🎯
- .htaccess proxies `/api/*` requests to Node.js application

---

## 🎯 Choose Your .htaccess Version

We've created 3 versions. Pick the one that matches your situation:

### **Option A: `.htaccess.HOSTINGER_AUTO`** (Try This First!)
- ✅ **Best for**: Most Hostinger setups
- ✅ **Assumes**: Port 3000 (most common)
- ✅ **Difficulty**: Easiest
- ✅ **Setup time**: 2 minutes
- ✅ **No configuration needed** - just upload and test

**Use this if:**
- You don't know your Node.js port
- Your Node.js app uses default port 3000
- You want the quickest solution

---

### **Option B: `.htaccess.HOSTINGER_PORT`** (Most Reliable)
- ✅ **Best for**: Known port configuration
- ✅ **Requires**: Finding your port number first
- ✅ **Difficulty**: Easy (one-line edit)
- ✅ **Setup time**: 5 minutes
- ✅ **Most reliable** - no guessing

**Use this if:**
- Option A didn't work
- You know your port number
- You want guaranteed success
- You followed FIND_NODEJS_PORT_HOSTINGER.md

---

### **Option C: `.htaccess.HOSTINGER_ADVANCED`** (Power Users)
- ✅ **Best for**: Complex setups
- ✅ **Includes**: Caching, compression, security
- ✅ **Difficulty**: Moderate
- ✅ **Setup time**: 10 minutes
- ✅ **Optimized** for performance

**Use this if:**
- Options A & B didn't work
- You want performance optimizations
- You need advanced debugging
- You want security headers

---

## 📝 Step-by-Step Deployment

### **STEP 1: Prepare Your Environment**

#### 1.1: Ensure Node.js App is Running
1. Log in to Hostinger hPanel
2. Go to **Node.js** section
3. Find your "Modenlo" application
4. Check status - must show **"Running"** (green)
5. If stopped/failed, click **"Start"** or **"Restart"**

#### 1.2: Check Environment Variables (Critical!)
Ensure these are set in hPanel → Node.js → Environment Variables:
```
NODE_ENV=production
EMAIL_USER=prints.modenlo@gmail.com
EMAIL_PASS=qdghzupmjoancpaq
ADMIN_EMAIL=prints.modenlo@gmail.com
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_secure_password
SESSION_SECRET=your_32_char_secret
APP_URL=https://modenlo.com
```

---

### **STEP 2: Configure .htaccess File**

#### **For Option A (AUTO):**
1. Locate `.htaccess.HOSTINGER_AUTO` in your project
2. Rename it to just `.htaccess`
3. No editing needed - ready to upload!

#### **For Option B (PORT):**
1. Locate `.htaccess.HOSTINGER_PORT` in your project
2. **Find your port number** (follow FIND_NODEJS_PORT_HOSTINGER.md)
3. Open `.htaccess.HOSTINGER_PORT` in a text editor
4. Find this line:
   ```apache
   RewriteRule .* - [E=NODEJS_PORT:XXXXX]
   ```
5. Replace `XXXXX` with your port number:
   ```apache
   RewriteRule .* - [E=NODEJS_PORT:20045]
   ```
6. Save the file
7. Rename it to just `.htaccess`

#### **For Option C (ADVANCED):**
1. Locate `.htaccess.HOSTINGER_ADVANCED`
2. Open in text editor
3. Find the "MANUAL OVERRIDE" section
4. Uncomment and set your port if needed:
   ```apache
   # Method 3: MANUAL OVERRIDE - Uncomment and set if auto-detection fails
   RewriteRule .* - [E=NODEJS_PORT:20045]
   ```
5. Save the file
6. Rename it to just `.htaccess`

---

### **STEP 3: Upload via FTP (FileZilla)**

#### 3.1: Connect to Hostinger FTP
1. Open FileZilla
2. Get credentials from hPanel → Files → FTP Accounts
3. Connect:
   - **Host**: ftp.modenlo.com (or your FTP host)
   - **Username**: Your FTP username
   - **Password**: Your FTP password
   - **Port**: 21

#### 3.2: Navigate to Correct Directory
- In FileZilla, navigate to: `public_html/` or `modenlo.com/`
- This is where your website files are

#### 3.3: Upload .htaccess
1. In FileZilla left pane (local), find your `.htaccess` file
2. Drag it to the right pane (remote) into `public_html/`
3. If asked to overwrite, click **Yes**
4. **Important**: Make sure the file is named exactly `.htaccess` (with the dot!)

#### 3.4: Set Permissions
1. Right-click `.htaccess` in FileZilla
2. Select **File Permissions**
3. Set to **644** or check:
   - Owner: Read + Write
   - Group: Read
   - Public: Read
4. Click OK

---

### **STEP 4: Test the Configuration**

#### 4.1: Clear Browser Cache
- Chrome/Edge: `Ctrl + Shift + Delete`
- Firefox: `Ctrl + Shift + Del`
- Safari: `Cmd + Option + E`
- Select "Last hour" and clear

#### 4.2: Test API Endpoint Directly
Visit in browser: `https://modenlo.com/api/health`

**Expected Result:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-04-18T06:23:00.000Z",
  "tempImagesCount": 0
}
```

**If you see this**: ✅ **SUCCESS!** Your .htaccess is working!

**If you see error**: ❌ See troubleshooting section below

#### 4.3: Use Diagnostic Tool
1. Upload `api-diagnostic.html` to your server
2. Visit: `https://modenlo.com/api-diagnostic.html`
3. Click "Run Diagnostic Tests"
4. Review results

#### 4.4: Test Full Site
1. Visit: `https://modenlo.com/`
2. Go to framer tool: `https://modenlo.com/framer.html`
3. Check if frame sizes load (this uses API)
4. Try adding item to cart
5. Open browser console (F12) - no errors should appear

---

## 🔧 Troubleshooting

### **Issue: 502 Bad Gateway**

**Cause**: Wrong port configured or Node.js not running

**Solution:**
1. Check Node.js app status in hPanel (must be "Running")
2. Verify port number in .htaccess matches hPanel
3. Try restarting Node.js app in hPanel
4. Use Option B with correct port number

---

### **Issue: 404 Not Found on /api/***

**Cause**: .htaccess not uploaded or not being read

**Solution:**
1. Verify .htaccess exists in public_html/
2. Check file name is exactly `.htaccess` (with dot)
3. Check file permissions (should be 644)
4. Check if mod_rewrite is enabled (contact Hostinger)

---

### **Issue: Still "Failed to Fetch"**

**Cause**: Multiple possible causes

**Solution:**
1. Verify Node.js app is running in hPanel
2. Check environment variables are set
3. Test `/api/health` endpoint directly
4. Upload and run `api-diagnostic.html`
5. Check Apache error logs in hPanel
6. Contact Hostinger support for help

---

### **Issue: CORS Errors in Console**

**Cause**: CORS headers not set correctly

**Solution:**
1. Verify `NODE_ENV=production` is set in hPanel
2. Check .htaccess has CORS header section
3. Use Option C (ADVANCED) which has better CORS handling

---

### **Issue: Static Files (CSS/JS) Not Loading**

**Cause**: .htaccess might be proxying everything

**Solution:**
1. Check your .htaccess has static file rules:
   ```apache
   RewriteCond %{REQUEST_URI} \.(html|css|js|jpg|png|gif)$ [NC]
   RewriteRule ^(.*)$ - [L]
   ```
2. This should let Apache serve these files directly

---

### **Issue: Works Locally But Not on Live**

**Cause**: Different port or configuration

**Solution:**
1. Find your exact port using FIND_NODEJS_PORT_HOSTINGER.md
2. Use Option B with that specific port
3. Ensure NODE_ENV=production is set
4. Check all environment variables match

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Node.js app shows "Running" in hPanel
- [ ] `.htaccess` uploaded to `public_html/`
- [ ] `/api/health` returns JSON response
- [ ] Homepage loads with styling
- [ ] Framer tool shows frame size options
- [ ] Can add items to cart
- [ ] No "failed to fetch" errors in console
- [ ] Admin panel login works
- [ ] Images load correctly
- [ ] Can place test order

---

## 🔄 Rollback (If Something Goes Wrong)

### **Quick Rollback:**
1. In FileZilla, delete or rename `.htaccess`
2. Site will go back to previous state
3. API won't work, but static pages will load

### **Emergency Backup:**
Before uploading new .htaccess:
1. Download current `.htaccess` (if exists)
2. Save as `.htaccess.backup`
3. Keep on your local machine
4. Can restore anytime by re-uploading

---

## 📞 Support

### **If All Else Fails:**

**Hostinger Support:**
- Live Chat: https://www.hostinger.com/contact
- 24/7 availability
- They can check: Apache config, mod_proxy status, port assignments

**What to tell them:**
> "I'm running a Node.js application and trying to use Apache as a reverse proxy via .htaccess. I need to proxy /api/* requests to my Node.js app. Can you verify that mod_proxy and mod_rewrite are enabled, and confirm what port my Node.js application is running on?"

---

## 🎯 Success Indicators

You'll know everything is working when:

✅ No 502/503 errors
✅ `/api/health` returns JSON
✅ Framer tool loads frame options
✅ Cart functionality works
✅ Orders can be placed
✅ Admin panel accessible
✅ No console errors

**Congratulations! Your site is now live!** 🎉

---

## 📚 Related Documentation

- `FIND_NODEJS_PORT_HOSTINGER.md` - How to find your port
- `api-diagnostic.html` - Testing tool
- `PRODUCTION_CHECKLIST.md` - Complete deployment checklist
- `TROUBLESHOOTING.md` - General troubleshooting
- `HOSTINGER_DEPLOYMENT_GUIDE.md` - Full deployment guide

---

**Need help?** All three .htaccess versions include detailed inline comments explaining every configuration option!
