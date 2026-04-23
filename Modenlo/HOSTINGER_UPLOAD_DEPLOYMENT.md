# 📤 Complete Hostinger Upload Fix - Deployment Steps

**Quick Reference:** Step-by-step deployment guide for fixing image uploads on Hostinger shared hosting.

---

## 🎯 Pre-Deployment

### What You Need:
- ✅ FileZilla FTP client installed
- ✅ Hostinger hPanel login credentials
- ✅ 10 minutes of focused time

### What Will Be Fixed:
- ❌ **Before:** "Failed to upload image to server" error
- ✅ **After:** Images upload successfully to `public_html/uploads/originals/`

---

## 📋 Deployment Steps

### Step 1: Find Your Node.js Port (2 minutes)

1. **Log in to Hostinger hPanel:**
   - Go to [hostinger.com](https://hostinger.com)
   - Log in to your account
   - Select your hosting plan for modenlo.com

2. **Access Node.js Settings:**
   - Find **Advanced** section in sidebar
   - Click **Node.js**
   - You should see your application listed

3. **Find the Port:**
   - Click on your application (might be named "Modenlo" or "modenlo.com")
   - Look for **Port** field
   - Example: `Port: 20045` or `http://127.0.0.1:20045`

4. **Write it down:**
   ```
   My Node.js Port: _________
   ```

**Common Hostinger ports:** 3000, 20000-20099, 40000-40099

---

### Step 2: Configure .htaccess Locally (1 minute)

1. **Open this file in your editor:**
   ```
   e:\MyProjects\Modenlo\.htaccess.HOSTINGER_UPLOAD_FIX
   ```

2. **Find line 30 (approximately):**
   ```apache
   RewriteRule ^api/(.*)$ http://127.0.0.1:YOUR_PORT_HERE/api/$1 [L]
   ```

3. **Replace `YOUR_PORT_HERE` with your port:**
   ```apache
   # Example if your port is 20045:
   RewriteRule ^api/(.*)$ http://127.0.0.1:20045/api/$1 [L]
   ```

4. **Save the file**

5. **Rename the file:**
   - From: `.htaccess.HOSTINGER_UPLOAD_FIX`
   - To: `.htaccess`

---

### Step 3: Upload via FTP (2 minutes)

1. **Open FileZilla**

2. **Connect to Hostinger:**
   - Host: `ftp.modenlo.com` (or your FTP host)
   - Username: Your FTP username
   - Password: Your FTP password
   - Port: 21
   - Click **Quickconnect**

3. **Navigate on Remote (right side):**
   - Go to `public_html/` directory

4. **Navigate on Local (left side):**
   - Go to `e:\MyProjects\Modenlo\`

5. **Upload .htaccess:**
   - Drag `.htaccess` from left to right
   - If asked to overwrite, click **Yes**
   - Wait for upload to complete (should be instant, small file)

---

### Step 4: Verify Node.js is Running (1 minute)

1. **In hPanel → Node.js:**
   - Find your application
   - Check **Status**
   - Should show: **Running** or **Active**

2. **If status is Stopped:**
   - Click **Start** button
   - Wait 10-20 seconds
   - Verify status changes to **Running**

3. **If you want to be safe, restart anyway:**
   - Click **Restart** button
   - Wait for status to return to **Running**

---

### Step 5: Test API Connection (1 minute)

1. **Open your browser**

2. **Visit:**
   ```
   https://modenlo.com/api/health
   ```

3. **Expected Result:**
   ```json
   {
     "success": true,
     "message": "API is running",
     "timestamp": "2026-04-23T17:30:00.000Z"
   }
   ```

4. **If you see this ✅ - API is connected! Continue to Step 6**

5. **If you see 404 ❌:**
   - Port number is wrong, go back to Step 1
   - .htaccess has a typo, check Step 2
   - Node.js isn't running, check Step 4

6. **If you see 502 Bad Gateway ❌:**
   - Port number doesn't match your app
   - Node.js crashed, restart in hPanel
   - Wait 30 seconds and try again

---

### Step 6: Create Upload Directory (if needed) (1 minute)

**Check if directory exists via FTP:**

1. In FileZilla, navigate to: `public_html/uploads/`
2. Do you see a folder named `originals/`?

**If YES:** Skip to Step 7 ✅

**If NO:** Create it now:
1. Right-click in `public_html/uploads/`
2. Click **Create directory**
3. Name it: `originals`
4. Press Enter
5. Right-click the new `originals/` folder
6. Click **File permissions**
7. Set to: **755** (or check: Owner: rwx, Group: rx, Public: rx)
8. Click **OK**

---

### Step 7: Test Image Upload (2 minutes)

1. **Go to your framer tool:**
   ```
   https://modenlo.com/framer.html
   ```

2. **Upload a test image:**
   - Click upload area
   - Select any JPEG or PNG image
   - Image should load in canvas ✅

3. **Customize (optional):**
   - Adjust zoom
   - Reposition image
   - Select frame size

4. **Add to cart:**
   - Click **"ADD TO CART"** button
   - Button should briefly say "Uploading..."
   - Should see: **"✅ Item added to cart!"** notification

5. **Open browser console (F12):**
   - Press F12 key
   - Go to **Console** tab
   - Look for these messages:
   ```
   [ADD TO CART] Uploading to server...
   [ADD TO CART] Upload successful, imageId: original-1713396543-abc123
   ```

6. **If you see upload successful ✅ - It works! Continue to Step 8**

7. **If you see error ❌:**
   - Check browser console for specific error
   - Verify /api/health still works (Step 5)
   - Check Node.js logs in hPanel

---

### Step 8: Verify File Saved on Server (1 minute)

1. **In FileZilla, navigate to:**
   ```
   public_html/uploads/originals/
   ```

2. **You should see files like:**
   ```
   original-1713396543-abc123.png
   original-1713396544-def456.png
   ```

3. **Check file size:**
   - Right-click file → Properties
   - Size should be **8-20MB** (varies by image)
   - This confirms high-res quality is preserved ✅

4. **If file exists with correct size ✅ - Upload is working perfectly!**

---

## ✅ Deployment Complete!

### What You Fixed:
- ✅ Configured .htaccess to route API requests to Node.js
- ✅ Tested API connectivity
- ✅ Verified upload directory exists with correct permissions
- ✅ Tested image upload functionality
- ✅ Confirmed files save to `public_html/uploads/originals/`

### Next Steps:
1. Test complete order workflow (see below)
2. Clear your browser cache
3. Test from mobile device
4. Have someone else test it

---

## 🧪 Full Workflow Test

Now test the complete customer journey:

### Test 1: Add Multiple Items to Cart
1. Go to framer tool
2. Upload 3 different images
3. Add each to cart
4. Verify cart shows 3 items
5. Check all previews load

### Test 2: Complete Checkout
1. Go to cart
2. Click checkout
3. Fill in shipping details
4. Place order
5. Verify success page appears

### Test 3: Check Emails
1. Check your email (customer address you used)
2. Should receive order confirmation
3. Check admin email (prints.modenlo@gmail.com)
4. Should receive order notification with images

### Test 4: Admin Panel
1. Log in to admin panel
2. Go to Orders page
3. Find your test order
4. Click **Download** button
5. Should download high-res image ZIP file

---

## 🚨 Common Issues & Fixes

### Issue: 404 on /api/health

**Cause:** Port configuration is wrong or .htaccess didn't upload

**Fix:**
1. Double-check port number in hPanel
2. Re-upload .htaccess via FTP
3. Clear browser cache
4. Try again

---

### Issue: Upload button stays "Uploading..." forever

**Cause:** Request is timing out or Node.js crashed

**Fix:**
1. Check hPanel → Node.js → Status
2. If stopped, restart application
3. Check application logs for errors
4. Verify /api/health works

---

### Issue: Files not appearing in uploads/originals/

**Cause:** Directory doesn't exist or no write permissions

**Fix:**
1. Via FTP, verify directory exists
2. Create it if missing (Step 6)
3. Set permissions to 755
4. Restart Node.js app in hPanel

---

### Issue: 502 Bad Gateway

**Cause:** Wrong port or Node.js not responding

**Fix:**
1. Verify port in hPanel matches .htaccess
2. Restart Node.js application
3. Wait 30 seconds for restart
4. Check application logs for crash errors

---

### Issue: Upload works locally but not in production

**Cause:** Different configurations or CORS issues

**Fix:**
1. Clear browser cache completely
2. Try incognito/private window
3. Check browser console for CORS errors
4. Verify API_BASE is set correctly in script.js

---

## 📊 Verification Checklist

Use this to confirm everything works:

### API Connectivity:
- [ ] https://modenlo.com/api/health returns JSON
- [ ] Status code is 200 (not 404 or 502)
- [ ] Response shows "success": true

### Node.js Application:
- [ ] hPanel shows Status: Running
- [ ] Port number matches .htaccess
- [ ] No errors in application logs

### Upload Directory:
- [ ] public_html/uploads/originals/ exists
- [ ] Permissions set to 755
- [ ] Directory is writable

### Frontend Upload:
- [ ] Can upload image in framer tool
- [ ] Add to cart button works
- [ ] Success message appears
- [ ] No errors in browser console

### Backend Storage:
- [ ] Files appear in uploads/originals/
- [ ] Filenames like: original-xxxxx-xxx.png
- [ ] File sizes are 8-20MB (high resolution)

### Complete Workflow:
- [ ] Can add multiple items to cart
- [ ] Cart displays items correctly
- [ ] Checkout completes successfully
- [ ] Emails are received (customer + admin)
- [ ] Admin can download high-res images

---

## 🎉 Success!

If all checklist items are checked ✅:

**Your image upload is now working on Hostinger shared hosting!**

Images are:
- ✅ Uploaded as multipart/form-data
- ✅ Saved to public_html/uploads/originals/
- ✅ Full resolution preserved (8-20MB files)
- ✅ Accessible by admin for order fulfillment

---

## 📝 Maintenance Notes

### After Deployment:
1. **Monitor first few orders** - Check uploads work consistently
2. **Disk space** - High-res images use 10-15MB each, monitor storage
3. **Backups** - Include uploads/originals/ in backup routine
4. **Cleanup** - Periodically remove old order images (after fulfillment)

### If You Change Port:
1. Node.js port might change after server maintenance
2. Check hPanel if uploads suddenly stop working
3. Update .htaccess with new port
4. Re-upload and test

### If You Update Code:
1. Changes to server.js require restart in hPanel
2. Changes to .htaccess take effect immediately
3. Changes to script.js require browser cache clear

---

## 📞 Support

**If issues persist after following this guide:**

1. **Check logs:**
   - Browser console (F12)
   - hPanel → Node.js → Application Logs

2. **Diagnostic commands:**
   ```bash
   # Test API
   curl https://modenlo.com/api/health
   
   # Check if upload endpoint responds
   curl -I https://modenlo.com/api/upload-image
   ```

3. **Contact Hostinger:**
   - Live chat in hPanel
   - Ask: "Need /api routes forwarded to Node.js on port [YOUR_PORT]"

4. **Review documentation:**
   - `HOSTINGER_UPLOAD_FIX.md` - Troubleshooting guide
   - `TROUBLESHOOTING.md` - General issues
   - `UPLOAD_CODE_EXPLANATION.md` - How it works

---

**Deployment Date:** April 23, 2026  
**Estimated Time:** 10 minutes  
**Difficulty:** Easy  
**Status:** ✅ Ready to Deploy
