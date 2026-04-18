# 🔧 API 404 Fix - Deployment Guide

## 🎯 Problem Summary

**Issue**: `/api/*` endpoints returning 404 errors (health check, orders, etc.)  
**Cause**: Apache serving static files directly, not routing API requests to Node.js  
**Solution**: Route ALL traffic through Node.js using `.htaccess` proxy configuration

---

## ✅ Files Created

- ✅ `.htaccess` - Routes all requests through Node.js application

---

## 🚀 Deployment Steps

### Step 1: Upload .htaccess File via FTP

1. **Open FileZilla** and connect to Hostinger
   - Host: `ftp.modenlo.com`
   - Username: [Your FTP username]
   - Port: 21

2. **Navigate to remote directory**:
   - Go to: `public_html/` (your Application Root)

3. **Upload the .htaccess file**:
   - From local: `e:\MyProjects\Modenlo\.htaccess`
   - To remote: `public_html/.htaccess`
   - **IMPORTANT**: The filename starts with a dot (.)
   - You may need to enable "Show hidden files" in FileZilla (Server → Force showing hidden files)

4. **Verify upload**:
   - Check that `.htaccess` appears in `public_html/`
   - File size should be ~900 bytes

### Step 2: Verify Node.js Application Settings

1. **Log into Hostinger hPanel**
   - Go to https://hostinger.com
   - Click on your hosting plan

2. **Navigate to Node.js**:
   - Advanced → Node.js

3. **Verify settings** for your "Modenlo" application:
   ```
   Application Root: public_html
   Application Startup File: server/server.js
   Node.js Version: 18.x or latest
   Application Mode: Production
   ```

4. **Environment Variables** should include:
   ```
   NODE_ENV = production
   EMAIL_USER = prints.modenlo@gmail.com
   EMAIL_PASS = qdghzupmjoancpaq
   ADMIN_EMAIL = prints.modenlo@gmail.com
   ADMIN_USERNAME = [your username]
   ADMIN_PASSWORD = [your password]
   SESSION_SECRET = [your secret]
   APP_URL = https://modenlo.com
   ```
   
   **⚠️ DO NOT SET PORT** - Hostinger assigns this automatically

### Step 3: Restart Node.js Application

1. In hPanel → Node.js → Your Application
2. Click **"Restart Application"** or **"Restart"**
3. Wait 10-20 seconds
4. Status should show **"Running"** or **"Active"**

### Step 4: Test the Fix

Follow the testing checklist below.

---

## 🧪 Testing Checklist

Complete these tests in order:

### Test 1: Health Endpoint ⭐ CRITICAL
```bash
URL: https://modenlo.com/api/health
Expected: {"success":true,"message":"API is running",...}
```

**In Browser:**
1. Open: https://modenlo.com/api/health
2. ✅ Should see JSON response with `success: true`
3. ❌ If you see 404 error → See Troubleshooting below

### Test 2: Static Files
```bash
URL: https://modenlo.com
Expected: Landing page loads normally
```

**In Browser:**
1. Open: https://modenlo.com
2. ✅ Landing page loads
3. ✅ Images display correctly
4. ✅ Navigation works

### Test 3: Complete Checkout Flow ⭐ CRITICAL

**Steps:**
1. Go to: https://modenlo.com
2. Click on a product category (e.g., Wall Displays)
3. Add an item to cart
4. Go to checkout
5. Fill in the form
6. Click "Place Order"

**Expected Behavior:**
- Button shows "Checking connection..." (1 second)
- Button shows "Processing Order..." (2-5 seconds)
- ✅ Redirects to order success page
- ✅ Customer email received
- ✅ Admin email received

**If it fails:**
- Open browser console (F12)
- Check for error messages
- See Troubleshooting section

### Test 4: Test Both URLs

Repeat Test 3 with both:
- ✅ https://modenlo.com
- ✅ https://www.modenlo.com

Both should work identically.

---

## 🔍 How to Check Server Logs

1. **In hPanel**:
   - Go to Node.js → Your Application
   - Click **"View Logs"** or **"Application Logs"**

2. **Look for these SUCCESS indicators**:
   ```
   Server started on port [PORT]
   [HEALTH CHECK] API is accessible
   [ORDER] New order request received
   [ORDER] Generated order ID: ORD-...
   ```

3. **Look for these ERROR indicators**:
   ```
   Error: Cannot find module...
   EADDRINUSE (port already in use)
   CORS policy error
   ```

---

## 🐛 Troubleshooting

### Issue: Health endpoint still returns 404

**Possible Causes:**
1. `.htaccess` not uploaded correctly
2. Node.js application not restarted
3. Application crashed

**Solutions:**

✅ **Check 1: Verify .htaccess uploaded**
- Log into FTP
- Navigate to `public_html/`
- Enable "Show hidden files" (Server menu)
- Confirm `.htaccess` exists

✅ **Check 2: Re-upload .htaccess**
- Delete existing `.htaccess` on server
- Re-upload from local
- Restart Node.js app

✅ **Check 3: Check Application Status**
- hPanel → Node.js
- Status should be "Running"
- If "Stopped", click "Start"
- Check logs for errors

✅ **Check 4: Verify Application Settings**
- Application Root: `public_html` (NOT `public_html/server`)
- Startup File: `server/server.js` (NOT just `server.js`)

### Issue: Static files work but API still 404

**This means .htaccess is not routing correctly:**

1. **Check Apache modules** (contact Hostinger support):
   - `mod_rewrite` must be enabled
   - `mod_proxy` must be enabled
   - `mod_proxy_http` must be enabled

2. **Alternative: Update .htaccess**
   - Try alternative proxy configuration
   - Contact Hostinger support for help

### Issue: "ERR_CONNECTION_REFUSED" or "Too Many Redirects"

**This means proxy loop or port issue:**

1. **Check Environment Variables**:
   - Make sure PORT is NOT set manually
   - Hostinger assigns this automatically

2. **Check Application Root**:
   - Should be `public_html`
   - NOT `public_html/server`

3. **Restart Application**:
   - Stop → Wait 10 seconds → Start

### Issue: Orders work on non-www but fail on www

**This is a CORS issue (already fixed in your server.js):**

1. Verify `server/server.js` includes both:
   ```javascript
   'https://modenlo.com',
   'https://www.modenlo.com'
   ```

2. Restart Node.js application

3. Test again on both URLs

---

## 📊 What Changed

### Before Fix:
```
User Request → Apache → Static Files ✓
User Request → Apache → /api/* → 404 ✗
```

### After Fix:
```
User Request → Apache → .htaccess → Node.js → Static Files ✓
User Request → Apache → .htaccess → Node.js → /api/* ✓
```

**All traffic now flows through Node.js!**

---

## 🎯 Expected Results After Fix

✅ Health endpoint works: `https://modenlo.com/api/health`  
✅ Orders endpoint works: `https://modenlo.com/api/orders`  
✅ Upload endpoint works: `https://modenlo.com/api/upload-image`  
✅ All static files work: `https://modenlo.com/index.html`  
✅ Checkout completes successfully  
✅ Emails sent to customer and admin  
✅ Admin panel works: `https://modenlo.com/admin.html`

---

## ⏱️ Deployment Time

- **Upload .htaccess**: 2 minutes
- **Restart application**: 2 minutes
- **Testing**: 5 minutes
- **Total**: ~10 minutes

---

## 🔒 Security Notes

✅ `.htaccess` only proxies to localhost (secure)  
✅ SSL certificate still enforced (HTTPS redirect)  
✅ No sensitive data exposed  
✅ Let's Encrypt validation still works  

---

## 📞 Need Help?

### If tests fail after deployment:

1. **Check Application Logs** (hPanel → Node.js → Logs)
2. **Check Browser Console** (F12 → Console tab)
3. **Verify .htaccess uploaded** (FTP → Show hidden files)
4. **Contact Hostinger Support** if Apache modules need enabling

### Support Resources:
- **Application Logs**: hPanel → Node.js → View Logs
- **Error Logs**: hPanel → Advanced → Error Logs
- **Hostinger Support**: 24/7 chat at hostinger.com/contact

---

## ✅ Deployment Completion Checklist

After deployment, mark these complete:

- [ ] `.htaccess` uploaded to `public_html/`
- [ ] Node.js application settings verified
- [ ] Application restarted successfully
- [ ] Health endpoint test passed (https://modenlo.com/api/health)
- [ ] Static files loading correctly
- [ ] Test order placed successfully
- [ ] Customer email received
- [ ] Admin email received
- [ ] www.modenlo.com tested and working
- [ ] Server logs show successful orders

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ `https://modenlo.com/api/health` returns JSON (not 404)
2. ✅ Checkout button shows "Checking connection..." → "Processing Order..."
3. ✅ Orders complete without "Failed to fetch" error
4. ✅ Emails arrive in inbox
5. ✅ No CORS errors in browser console

**Congratulations! Your API endpoints are now working! 🎊**
