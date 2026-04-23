# 🚀 Hostinger Shared Hosting - Image Upload Fix

**Problem:** Browser upload fails with "Failed to upload image to server. Please check your connection and try again."

**Root Cause:** Current .htaccess blocks API requests instead of routing them to Node.js.

**Solution:** Configure .htaccess to route `/api/*` requests to your Node.js port.

---

## ⚡ Quick Fix (5 Minutes)

### Step 1: Find Your Node.js Port

1. Log in to **Hostinger hPanel**
2. Go to **Advanced** → **Node.js** (or find Node.js in sidebar)
3. Click on your **Modenlo** application
4. Look for **Port** or **Application Details**
5. You'll see something like:
   - `Port: 20045` 
   - `Application URL: http://127.0.0.1:20045`
   - Or similar format with a port number

**Common Hostinger Ports:**
- 3000 (rare on shared hosting)
- 20000-20099
- 40000-40099

**Write down your port number!** Example: `20045`

---

### Step 2: Configure .htaccess

1. Open the file: `.htaccess.HOSTINGER_UPLOAD_FIX`
2. Find this line (around line 30):
   ```apache
   RewriteRule ^api/(.*)$ http://127.0.0.1:YOUR_PORT_HERE/api/$1 [L]
   ```

3. Replace `YOUR_PORT_HERE` with your actual port:
   ```apache
   # Example if your port is 20045:
   RewriteRule ^api/(.*)$ http://127.0.0.1:20045/api/$1 [L]
   ```

4. Save the file

---

### Step 3: Deploy via FTP

1. **Rename the file:**
   - From: `.htaccess.HOSTINGER_UPLOAD_FIX`
   - To: `.htaccess`

2. **Upload via FileZilla:**
   - Connect to your Hostinger FTP
   - Navigate to `public_html/`
   - Upload `.htaccess` (overwrite the old one)
   - Confirm upload completed

---

### Step 4: Verify Node.js is Running

1. In Hostinger hPanel → Node.js
2. Find your **Modenlo** application
3. **Status** should show: **Running** or **Active**
4. If not, click **Start** or **Restart**

---

### Step 5: Test API Connection

Open your browser and visit:
```
https://modenlo.com/api/health
```

**✅ Success - You should see:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-04-23T17:00:00.000Z"
}
```

**❌ If you see 404:**
- Port number is wrong, double-check in hPanel
- .htaccess wasn't uploaded correctly
- Node.js app isn't running

**❌ If you see 502 Bad Gateway:**
- Port number is incorrect
- Node.js app is stopped, restart it in hPanel

---

### Step 6: Test Image Upload

1. Go to: `https://modenlo.com/framer.html`
2. Upload a test image
3. Customize it (zoom, position)
4. Click **"ADD TO CART"**
5. Button should say "Uploading..." briefly
6. You should see success message: "✅ Item added to cart!"

**Check browser console (F12):**
```
[ADD TO CART] Generating full-resolution image...
[ADD TO CART] Image dimensions: 2400x3000px
[ADD TO CART] Full-res blob size: 5.51MB
[ADD TO CART] Uploading to server...
[ADD TO CART] Upload successful, imageId: original-1713396543-abc123
```

---

### Step 7: Verify File on Server

**Via FTP:**
1. Connect to Hostinger FTP
2. Navigate to `public_html/uploads/originals/`
3. You should see PNG files like: `original-1713396543-abc123.png`
4. File size should be 8-20MB (high-res quality) ✅

**If folder doesn't exist:**
1. Create it manually: `public_html/uploads/originals/`
2. Set permissions to **755**
3. Restart Node.js app in hPanel

---

## 🔧 Advanced Troubleshooting

### Issue: Still Getting 404 on /api/health

**Check 1: Verify .htaccess Syntax**
```apache
# Make sure there are NO spaces in the port
RewriteRule ^api/(.*)$ http://127.0.0.1:20045/api/$1 [L]
# NOT: http://127.0.0.1: 20045 (space before port)
```

**Check 2: Verify .htaccess is Active**
- Some hosts disable .htaccess
- Try adding this line at the top and visit site:
  ```apache
  # TEST - Should cause error if .htaccess works
  ThisIsATestLine
  ```
- If you DON'T see an error, .htaccess isn't being read
- Contact Hostinger support to enable .htaccess

**Check 3: Check ModRewrite**
- .htaccess requires mod_rewrite module
- Usually enabled on Hostinger by default
- If not, contact support

---

### Issue: 502 Bad Gateway

**Cause:** Port is wrong or Node.js isn't running

**Fix:**
1. Go to hPanel → Node.js → Modenlo
2. Verify **Status: Running**
3. Check **Port** matches your .htaccess
4. Click **Restart** if unsure
5. Wait 10-20 seconds for restart
6. Try again

---

### Issue: Upload Works But File Not Saved

**Check 1: Directory Exists**
```
Via FTP, verify this structure:
public_html/
├── uploads/
│   ├── mounts/
│   └── originals/    ← Must exist!
```

**Check 2: Permissions**
- Right-click `originals/` folder in FTP
- File permissions → Set to **755**
- Owner: Read, Write, Execute ✓
- Group: Read, Execute ✓
- Public: Read, Execute ✓

**Check 3: Server Logs**
1. hPanel → Node.js → Application Logs
2. Look for errors like:
   - `ENOENT: no such file or directory`
   - `EACCES: permission denied`
3. If found, create directory or fix permissions

---

### Issue: Upload Succeeds But Cart Empty

**This is a different issue** - means upload works but cart storage doesn't.

**Check:**
- Browser localStorage quota
- Try different browser
- Clear browser cache/data
- See: `CART_TROUBLESHOOTING.md`

---

## 📊 What Happens When Upload Works

### The Flow:

```
Browser (framer.html)
    ↓
Sends FormData to: https://modenlo.com/api/upload-image
    ↓
Apache receives request
    ↓
.htaccess: "This is /api/* route, forward to Node.js"
    ↓
Forwards internally to: http://127.0.0.1:PORT/api/upload-image
    ↓
Node.js Express Server (server.js)
    ↓
Multer processes multipart/form-data
    ↓
Saves file to: public_html/uploads/originals/original-xxx.png
    ↓
Returns JSON: {"success": true, "imageId": "original-xxx"}
    ↓
Browser stores imageId in cart
    ↓
✅ SUCCESS!
```

---

## 🎯 Why This Fix Works on Shared Hosting

### Key Points:

1. **No ProxyPass [P] flag needed**
   - Shared hosting may not have mod_proxy enabled
   - Simple RewriteRule works without it
   - Just forwards the request

2. **127.0.0.1 is internal only**
   - Browser never sees this
   - Apache uses it to talk to Node.js
   - Completely safe and standard

3. **Files save to correct location**
   - Node.js runs from `public_html/`
   - Saves to `../uploads/originals`
   - Resolves to `public_html/uploads/originals` ✅

4. **Works with CORS**
   - Same domain (modenlo.com)
   - No cross-origin issues
   - Standard HTTPS

---

## 📝 Verification Checklist

After deploying, verify:

- [ ] Node.js app status: **Running** in hPanel
- [ ] Port number configured in .htaccess
- [ ] .htaccess uploaded to public_html/
- [ ] `https://modenlo.com/api/health` returns JSON ✅
- [ ] Test image upload in framer tool works
- [ ] Success message appears after upload
- [ ] File appears in `uploads/originals/` via FTP
- [ ] File size is 8-20MB (high-res)
- [ ] No errors in browser console
- [ ] No errors in Node.js application logs

---

## 🔒 Security Notes

- ✅ 127.0.0.1 is localhost only (secure)
- ✅ Port is not exposed to internet
- ✅ All traffic goes through Apache (HTTPS)
- ✅ Static files served directly (no Node.js needed)
- ✅ Only /api/* requests go to Node.js

---

## 🚀 Post-Fix: Complete Order Test

Once upload works, test the full workflow:

1. **Upload & Customize:**
   - Go to framer tool
   - Upload image
   - Add to cart ✅

2. **View Cart:**
   - Go to cart page
   - Verify item appears
   - Preview should be visible

3. **Checkout:**
   - Fill in shipping details
   - Complete order
   - Check for success page

4. **Verify Emails:**
   - Customer confirmation email
   - Admin notification email
   - Image attachment works

5. **Admin Panel:**
   - Check order appears
   - Download button works
   - Full-res image downloads

---

## 📞 Still Need Help?

### Hostinger Support:
- Live chat in hPanel
- Mention: "Need help routing /api requests to Node.js on port [YOUR_PORT]"

### Check These Files:
- `TROUBLESHOOTING.md` - General issues
- `HOSTINGER_DEPLOYMENT_GUIDE.md` - Full setup
- `UPLOAD_CODE_EXPLANATION.md` - How upload code works

### Diagnostic Endpoint:
```bash
# Test from command line
curl https://modenlo.com/api/health

# Test upload endpoint exists
curl https://modenlo.com/api/upload-image
# (Will fail without data, but shouldn't be 404)
```

---

## ✅ Success Criteria

Your fix is complete when:

1. ✅ `/api/health` returns JSON (not 404)
2. ✅ Image upload in framer tool succeeds
3. ✅ Files appear in `public_html/uploads/originals/`
4. ✅ File sizes are 8-20MB (full quality preserved)
5. ✅ Cart shows items with previews
6. ✅ Complete checkout workflow functions
7. ✅ Admin receives email with downloadable images

---

**Last Updated:** April 23, 2026  
**Status:** ✅ Ready for Deployment  
**Estimated Time:** 5-10 minutes  
**Difficulty:** Easy (just need to find port number)
