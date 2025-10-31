# Testing Instructions - Download Restriction Feature

## Setup

The authentication and download restriction feature has been successfully implemented. To test it, you need to restart the server to load the new code.

### Step 1: Stop the Current Server

If the server is running, stop it by:
- Going to the terminal where the server is running
- Press `Ctrl+C` to stop it

### Step 2: Start the Server

```bash
cd Modenlo/server
npm start
```

The server should start at: `http://localhost:3000`

## Testing Scenarios

### Test 1: Regular User (No Download Permission)

1. **Open the main application:**
   - Navigate to `http://localhost:3000/`
   
2. **Upload an image:**
   - Click "Upload Your Photo" or drag & drop an image
   
3. **Adjust the image:**
   - Select frame size
   - Choose orientation
   - Zoom and position the image
   
4. **Try to download:**
   - Click the "Download Image" button
   - You should see a dimmed/disabled button (opacity 0.6)
   - A confirmation dialog should appear: "Only administrators can download high-resolution images. Would you like to login as admin?"
   
5. **Cancel login:**
   - Click "Cancel"
   - Button should remain dimmed
   - No download should occur

### Test 2: Admin Login and Download

1. **Continue from Test 1** (or start fresh)

2. **Click download button:**
   - Should prompt for login
   
3. **Login as admin:**
   - Click "OK" when asked to login
   - Username: `admin`
   - Password: `admin123`
   
4. **Verify successful login:**
   - Alert message: "Successfully logged in as admin!"
   - Download button should now be fully visible (opacity 1.0)
   - Button cursor should change to pointer
   
5. **Download the image:**
   - Click the download button again
   - High-resolution PNG should download successfully
   - Filename format: `photo-{size}-{orientation}-{timestamp}.png`

### Test 3: Admin Panel Access

1. **Open admin panel:**
   - Navigate to `http://localhost:3000/admin.html`
   
2. **Login prompt:**
   - Should automatically prompt: "Admin login required. Enter username:"
   - Username: `admin`
   - Password: `admin123`
   
3. **Verify access:**
   - After successful login, admin panel should load
   - You should see the frame management interface
   - Toast notification: "Successfully logged in as admin!"
   
4. **Test admin operations:**
   - Try adding a new frame
   - Try editing an existing frame
   - All operations should work normally

### Test 4: Session Persistence

1. **Login as admin** (from Test 2 or 3)

2. **Refresh the page:**
   - Press F5 or Ctrl+R
   
3. **Verify session persists:**
   - Should NOT be prompted to login again
   - Download button should still be enabled
   - Admin panel should still be accessible

4. **Check localStorage:**
   - Open browser console (F12)
   - Type: `localStorage.getItem('modenloSession')`
   - Should return a long hexadecimal session ID

### Test 5: Logout and Re-login

1. **While logged in as admin:**
   - Open browser console (F12)
   - Type: `localStorage.removeItem('modenloSession')`
   - Press Enter
   
2. **Refresh the page:**
   - Download button should be dimmed again
   - Admin panel should prompt for login again

## Expected Behavior Summary

### Download Button States

**Non-Admin (Default):**
- Opacity: 0.6 (dimmed)
- Cursor: not-allowed
- Tooltip: "Only administrators can download high-resolution images"
- Click behavior: Prompts for admin login

**Admin (After Login):**
- Opacity: 1.0 (full visibility)
- Cursor: pointer
- Tooltip: "Download high-resolution image"
- Click behavior: Downloads high-res PNG

### API Responses

**Without Authentication:**
```json
GET /api/auth/session
Response: { "success": true, "isAdmin": false, "username": null }

POST /api/download/verify
Response: { 
  "success": true, 
  "canDownload": false, 
  "isAdmin": false,
  "message": "Only administrators can download high-resolution images"
}
```

**With Admin Authentication:**
```json
GET /api/auth/session
Response: { "success": true, "isAdmin": true, "username": "admin" }

POST /api/download/verify
Response: { "success": true, "canDownload": true, "isAdmin": true }
```

## Troubleshooting

### Issue: Download button not dimmed
- **Solution:** Clear browser cache and reload
- **Solution:** Check console for JavaScript errors
- **Solution:** Verify server is running with new code

### Issue: Login not working
- **Solution:** Verify credentials: username=`admin`, password=`admin123`
- **Solution:** Check server console for errors
- **Solution:** Clear localStorage and try again

### Issue: Session not persisting
- **Solution:** Check if localStorage is enabled in browser
- **Solution:** Verify cookies are enabled
- **Solution:** Try in incognito/private mode

### Issue: Admin panel access denied
- **Solution:** Clear localStorage
- **Solution:** Restart server
- **Solution:** Check server logs for authentication errors

## Security Notes

⚠️ **Development Use Only:**
- Current implementation uses plain-text passwords
- Sessions stored in memory (lost on server restart)
- No rate limiting on login attempts
- Not suitable for production without enhancements

📝 **For Production:**
- See `AUTHENTICATION.md` for security recommendations
- Implement password hashing (bcrypt)
- Use environment variables for credentials
- Add session expiration
- Implement rate limiting
- Use HTTPS

## Next Steps

After testing, consider:
1. Changing default admin credentials in `server/server.js`
2. Implementing additional security measures
3. Adding multiple user accounts
4. Creating role-based permissions
5. Adding activity logging

## Files Modified

- `server/server.js` - Added authentication middleware and endpoints
- `script.js` - Added session checking and download restrictions
- `admin-script.js` - Added admin authentication requirement
- `AUTHENTICATION.md` - Comprehensive documentation
- `TESTING_INSTRUCTIONS.md` - This file
