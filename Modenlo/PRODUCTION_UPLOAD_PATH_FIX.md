# 🔧 Production Upload Path Fix Guide

**Issue:** Images are not being uploaded to `/public_html/uploads/originals` on the live server.

**Date:** April 23, 2026  
**Status:** Fix Ready for Deployment

---

## 🔍 Problem Analysis

### What's Happening:
- ✅ **Local:** Images save correctly to `uploads/originals/`
- ❌ **Production:** Images fail to upload (directory doesn't exist or no write permissions)
- **Error:** Multer fails silently when destination directory is missing

### Root Causes:
1. **Missing Directory:** `uploads/originals/` was never created on production server
2. **Permission Issues:** Node.js doesn't have write access to create directories
3. **Silent Failure:** Multer doesn't return clear error messages

---

## ✅ Solution Implemented

### Code Improvements (Already Done):

1. **Enhanced Error Logging** in multer configuration
2. **Startup Validation** - Automatically creates directories on server start
3. **Diagnostic Endpoint** - `/api/check-uploads` to verify configuration
4. **Better Error Messages** - Clear logging at every upload step

---

## 🚀 Quick Fix (Do This First)

### Manual Directory Creation on Hostinger:

**Step 1: Connect via FTP**
1. Open FileZilla
2. Connect to your Hostinger account
3. Navigate to `public_html/`

**Step 2: Create Directory Structure**
1. Right-click in `public_html/` → **Create Directory**
2. Name it: `uploads` (if it doesn't exist)
3. Enter the `uploads/` folder
4. Right-click → **Create Directory**
5. Name it: `originals`

**Step 3: Set Permissions**
1. Right-click `originals` folder → **File permissions**
2. Set to: **755**
   - Owner: Read, Write, Execute
   - Group: Read, Execute
   - Public: Read, Execute
3. Click **OK**

**Step 4: Verify Structure**
```
public_html/
├── server/
├── images/
├── uploads/
│   ├── mounts/        (should already exist)
│   └── originals/     (newly created)
└── (other files...)
```

**Step 5: Restart Node.js App**
1. Go to hPanel
2. Navigate to **Node.js** section
3. Find your **Modenlo** application
4. Click **Restart**

**Result:** Uploads should now work! 🎉

---

## 📤 Deploy Code Updates

### Files to Upload:

**1. Updated server/server.js**
- Location: `e:\MyProjects\Modenlo\server\server.js`
- Upload to: `public_html/server/server.js`
- Changes:
  - Enhanced error logging in multer config
  - Startup directory validation
  - New `/api/check-uploads` diagnostic endpoint

### Deployment Steps:

**Via FileZilla:**
1. Connect to Hostinger FTP
2. Navigate to `public_html/server/`
3. Upload `server/server.js` (overwrite existing)
4. Wait for upload to complete

**Restart Application:**
1. Go to hPanel → Node.js
2. Find **Modenlo** application
3. Click **Restart**
4. Wait for status: **Running**

---

## 🧪 Testing & Verification

### Test 1: Check Diagnostic Endpoint

Visit: `https://modenlo.com/api/check-uploads`

**Expected Response (Healthy):**
```json
{
  "success": true,
  "timestamp": "2026-04-23T05:23:00.000Z",
  "environment": "production",
  "directories": {
    "mounts": {
      "path": "/home/username/public_html/uploads/mounts",
      "exists": true,
      "isDirectory": true,
      "writable": true
    },
    "originals": {
      "path": "/home/username/public_html/uploads/originals",
      "exists": true,
      "isDirectory": true,
      "writable": true,
      "fileCount": 0
    }
  },
  "status": "healthy",
  "message": "All upload directories are properly configured"
}
```

**If Issues Detected:**
```json
{
  "status": "issues_detected",
  "directories": {
    "originals": {
      "exists": false,  // ← Directory missing!
      "writable": false
    }
  }
}
```

### Test 2: Upload an Image

1. Go to `https://modenlo.com/framer.html`
2. Upload a test image
3. Customize it
4. Click **Add to Cart**
5. Check browser console for errors
6. Verify success message appears

### Test 3: Check Server Logs

In hPanel → Node.js → Application Logs, look for:

**Success:**
```
[UPLOAD] Creating directory: /home/username/public_html/uploads/originals
[UPLOAD] Directory ready: /home/username/public_html/uploads/originals
[UPLOAD] Directory is writable
[UPLOAD] Generated filename: original-1713396543-abc123.png
[IMAGE UPLOAD] Saved to disk: original-1713396543-abc123.png (12.34MB)
```

**Failure (Before Fix):**
```
[UPLOAD] Error setting up destination: Error: ENOENT: no such file or directory
[UPLOAD] Attempted path: /home/username/public_html/uploads/originals
```

### Test 4: Verify File on Server

Via FTP:
1. Navigate to `public_html/uploads/originals/`
2. Should see PNG files like: `original-1713396543-abc123.png`
3. File size should be 8-20MB (high quality)

---

## 📊 Startup Validation

After restarting, check logs for:

```
📁 Validating upload directories...
✓ Mounts directory exists: /home/username/public_html/uploads/mounts
✓ Mounts directory is writable
✓ Originals directory exists: /home/username/public_html/uploads/originals
✓ Originals directory is writable
📁 Upload directories validation complete
```

**If directories don't exist:**
```
✗ Originals directory not found, creating...
✓ Originals directory created successfully: /home/.../uploads/originals
```

---

## 🔧 Troubleshooting

### Issue 1: Directory Creation Fails

**Symptoms:**
```
✗ Failed to create Originals directory
Path attempted: /home/username/public_html/uploads/originals
This may cause upload failures!
```

**Solution:**
- Create directory manually via FTP (see Quick Fix above)
- Check parent folder permissions (`uploads/` must be writable)
- Contact Hostinger support if permissions issues persist

### Issue 2: Permission Denied

**Symptoms:**
```
[UPLOAD] Error setting up destination: Error: EACCES: permission denied
```

**Solution:**
1. Via FTP, right-click `uploads/` folder
2. File permissions → Set to **755**
3. Check "Apply to subdirectories"
4. Inside `originals/`, also set to **755**

### Issue 3: Wrong Path on Production

**Symptoms:**
```
[UPLOAD] Attempted path: /path/that/doesnt/exist
```

**Solution:**
The path is calculated relative to `server/` directory:
```javascript
path.join(__dirname, '..', 'uploads', 'originals')
```

This should resolve to: `public_html/uploads/originals`

If your structure is different, adjust the path in server.js.

### Issue 4: Uploads Still Fail After Fix

**Checklist:**
- [ ] Directory `uploads/originals/` exists on production
- [ ] Permissions set to **755**
- [ ] server.js uploaded and Node.js restarted
- [ ] Check `/api/check-uploads` shows "healthy"
- [ ] Clear browser cache and retry
- [ ] Check server logs for specific errors

---

## 🎯 Prevention for Future Deployments

### Always Include in Deployment:

**1. Create Upload Directories Before Deployment:**
```bash
# Via SSH (if available)
mkdir -p uploads/originals
mkdir -p uploads/mounts
chmod 755 uploads/originals
chmod 755 uploads/mounts
```

**2. Check Diagnostic Endpoint After Each Deployment:**
```bash
curl https://modenlo.com/api/check-uploads
```

**3. Monitor First Upload:**
- Place test order immediately after deployment
- Check logs to confirm upload success
- Verify file appears in `uploads/originals/`

**4. Update Deployment Checklist:**
Add to `PRODUCTION_CHECKLIST.md`:
- [ ] `uploads/originals/` directory created
- [ ] Directory permissions set to 755
- [ ] `/api/check-uploads` returns healthy status
- [ ] Test image upload successful

---

## 📝 Verification Checklist

After completing the fix:

### Pre-Deployment
- [x] Code changes made to server.js
- [x] Enhanced error logging added
- [x] Startup validation function created
- [x] Diagnostic endpoint added

### Manual Fix on Production
- [ ] Connected to Hostinger via FTP
- [ ] Created `uploads/originals/` directory
- [ ] Set permissions to 755
- [ ] Verified directory structure correct

### Deployment
- [ ] Uploaded server/server.js to production
- [ ] Restarted Node.js application
- [ ] Application status shows "Running"

### Testing
- [ ] Visited `/api/check-uploads` - shows "healthy"
- [ ] Uploaded test image successfully
- [ ] Image file appears in `uploads/originals/`
- [ ] Server logs show successful upload
- [ ] No errors in browser console

### Final Verification
- [ ] Completed full order workflow
- [ ] Customer email received
- [ ] Admin email received
- [ ] Image quality preserved (8-20MB file)
- [ ] Download from admin panel works

---

## 🎉 Success Criteria

Your fix is successful when:

1. ✅ `/api/check-uploads` returns `"status": "healthy"`
2. ✅ Images upload without errors
3. ✅ Files appear in `public_html/uploads/originals/`
4. ✅ File sizes are 8-20MB (full quality)
5. ✅ Server logs show successful upload messages
6. ✅ Complete order workflow functions end-to-end

---

## 📞 Support

**If issues persist:**

1. **Check Server Logs:**
   - hPanel → Node.js → Application Logs
   - Look for [UPLOAD] and [IMAGE UPLOAD] messages

2. **Test Diagnostic Endpoint:**
   - Visit `https://modenlo.com/api/check-uploads`
   - Check what the response shows

3. **Verify File Structure:**
   - Use FTP to browse `public_html/uploads/`
   - Confirm `originals/` folder exists

4. **Contact Hostinger:**
   - If permission issues persist
   - Mention: "Node.js app needs write access to uploads directory"

---

## 📚 Related Documentation

- `DISK_STORAGE_IMPLEMENTATION.md` - How the upload system works
- `HOSTINGER_DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- `TROUBLESHOOTING.md` - General troubleshooting guide
- `PRODUCTION_CHECKLIST.md` - Pre-deployment checklist

---

**Last Updated:** April 23, 2026  
**Status:** ✅ Ready for Production Deployment
