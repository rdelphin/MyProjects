# 🔧 .htaccess Deployment Guide - Fix 404 API Errors

**Issue**: All `/api/*` requests return 404 because there's no routing to Node.js server  
**Solution**: Deploy .htaccess file to proxy API requests to Node.js application

---

## 🚀 Quick Deployment Steps

### Step 1: Choose the Right .htaccess File

**Start with the default** (`.htaccess` - uses port 3000):

```apache
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

### Step 2: Upload to Production

1. **Connect to Hostinger via FTP** (FileZilla or hPanel File Manager)
2. **Navigate to**: `/public_html/`
3. **Upload file**: `.htaccess` to `/public_html/.htaccess`
4. **Ensure filename**: Must be exactly `.htaccess` (with the dot at the beginning)

### Step 3: Test API Connectivity

Open your browser and test these URLs:

**Test 1 - Health Check:**
```
https://modenlo.com/api/health
```
**Expected**: `{"success":true,"message":"API is running",...}`

**Test 2 - Frames API:**
```
https://modenlo.com/api/frames
```
**Expected**: JSON with frames data

**Test 3 - Upload Image:**
- Go to `https://modenlo.com/framer.html`
- Upload an image
- Click "Add to Cart"
- **Expected**: "✅ Item added to cart!" message

---

## ⚠️ If Port 3000 Doesn't Work

### Find Your Actual Port

1. Go to **hPanel → Node.js**
2. Click on your Modenlo application
3. Look for "Application URL" or "Port" field
4. Note the port number (e.g., 8080, 35281, etc.)

### Deploy Alternative .htaccess

**If port is 8080:**
Use `.htaccess.PORT_8080` file, rename to `.htaccess` and upload

**If app runs on subdomain:**
1. Use `.htaccess.SUBDOMAIN` file
2. Edit line 5: Replace `YOURAPP` with your actual subdomain
3. Rename to `.htaccess` and upload

---

## 🔍 Troubleshooting

### Issue: Still getting 404

**Check 1: Is .htaccess file in the right location?**
```
/public_html/.htaccess  ✅ Correct
/public_html/server/.htaccess  ❌ Wrong
```

**Check 2: Is Node.js application running?**
- Go to hPanel → Node.js
- Verify status shows "Running" (green)
- If stopped, click "Start" or "Restart"

**Check 3: Is mod_rewrite enabled?**
Hostinger should have this enabled by default, but if not:
- Contact Hostinger support to enable mod_rewrite
- Mention you need ProxyPass support

**Check 4: Wrong port number?**
- Try alternative ports: 8080, 8000, 3001, 35281
- Create custom .htaccess with correct port:
```apache
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^(.*)$ http://127.0.0.1:YOUR_PORT/$1 [P,L]
```

### Issue: 500 Internal Server Error

This means .htaccess has syntax errors or proxy module isn't available.

**Solution A: Check .htaccess syntax**
Ensure no typos, proper spacing

**Solution B: Remove [P] flag if proxy not supported**
```apache
# Instead of [P,L], try redirect:
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [L]
```

**Solution C: Contact Hostinger**
Ask them to enable mod_proxy and mod_proxy_http

---

## 📋 Alternative: Direct Node.js Setup

If .htaccess proxy doesn't work, you may need to configure Node.js to handle everything:

### Update server.js to serve static files

Add after line 164 in `server/server.js`:

```javascript
// Serve static files from parent directory
app.use(express.static(path.join(__dirname, '..')));
```

Then access your site via the Node.js Application URL directly:
`https://modenlo-12345.hostingersite.com`

---

## ✅ Success Checklist

After deployment, verify:

- [ ] `.htaccess` file uploaded to `/public_html/.htaccess`
- [ ] `https://modenlo.com/api/health` returns JSON
- [ ] `https://modenlo.com/api/frames` returns frames data
- [ ] Can upload image and add to cart successfully
- [ ] No 404 errors in browser console
- [ ] Images save to `uploads/originals/` directory

---

## 🎯 Expected Result

**Before Fix:**
```
POST https://modenlo.com/api/upload-image
→ 404 (Not Found)
```

**After Fix:**
```
POST https://modenlo.com/api/upload-image
→ 200 OK
→ {"success":true,"imageId":"original-xxx","sizeMB":"5.23"}
```

---

## 📞 Support

If all solutions fail:

1. **Check Hostinger Node.js logs**: hPanel → Node.js → Application Logs
2. **Verify Node.js is actually installed and running** on your hosting plan
3. **Contact Hostinger support** with this message:
   > "I need help routing `/api/*` requests to my Node.js application. My .htaccess proxy directives return 404. Can you verify mod_proxy is enabled and help configure proper routing?"

---

**Created**: April 23, 2026  
**Status**: Ready for deployment  
**Impact**: Fixes all API 404 errors including image upload failures
