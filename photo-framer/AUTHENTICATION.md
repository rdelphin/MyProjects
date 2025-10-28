# Authentication and Download Restrictions

## Overview

This application now includes authentication to restrict access to high-resolution image downloads. Only administrators can download the final print-ready images, while regular users can preview but not download.

## Features

### For Regular Users
- Can upload and preview images
- Can adjust frame size, orientation, and positioning
- Can see the final preview on screen
- **Cannot download** high-resolution images
- Download button is visually disabled (dimmed with reduced opacity)
- Clicking download prompts for admin login

### For Administrators
- All regular user features
- **Can download** high-resolution print-ready images
- Full access to admin panel for frame management
- Can manage frame sizes, prices, and availability

## Admin Credentials

**Default Login:**
- Username: `admin`
- Password: `admin123`

> ⚠️ **IMPORTANT**: Change these credentials in production! Edit the following in `server/server.js`:
> ```javascript
> const ADMIN_USERNAME = 'admin';
> const ADMIN_PASSWORD = 'admin123'; // Change this!
> ```

## How to Login as Admin

### On Main Application (index.html)

1. Try to download an image as a regular user
2. You'll see a prompt: "Only administrators can download high-resolution images"
3. Click "OK" when asked if you want to login
4. Enter admin username and password
5. Once authenticated, the download button becomes fully enabled

### On Admin Panel (admin.html)

1. Navigate to `http://localhost:3000/admin.html`
2. You'll be automatically prompted for admin credentials
3. Enter username and password
4. Once authenticated, you can manage frames

## Session Management

- Sessions are stored in `localStorage` for convenience
- Sessions persist across browser refreshes
- Sessions are stored in-memory on the server (cleared on restart)
- To logout, clear your browser's `localStorage`:
  ```javascript
  localStorage.removeItem('photoFramerSession');
  ```

## API Endpoints

### Authentication Endpoints

#### Login
```
POST /api/auth/login
Body: { "username": "admin", "password": "admin123" }
Response: { "success": true, "sessionId": "...", "isAdmin": true, "username": "admin" }
```

#### Check Session
```
GET /api/auth/session
Headers: { "x-session-id": "..." }
Response: { "success": true, "isAdmin": true, "username": "admin" }
```

#### Logout
```
POST /api/auth/logout
Headers: { "x-session-id": "..." }
Response: { "success": true }
```

### Download Verification
```
POST /api/download/verify
Headers: { "x-session-id": "..." }
Response: { "success": true, "canDownload": true, "isAdmin": true }
```

## Security Considerations

### Current Implementation
- Simple session-based authentication
- In-memory session storage
- Plain-text password comparison
- Suitable for development and testing

### Production Recommendations

1. **Use Environment Variables**
   ```javascript
   const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
   const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
   ```

2. **Hash Passwords**
   - Use bcrypt or similar for password hashing
   - Never store plain-text passwords

3. **Secure Session Storage**
   - Use Redis or a database for sessions
   - Implement session expiration
   - Add CSRF protection

4. **HTTPS Required**
   - Use HTTPS in production
   - Secure session cookies
   - Enable HTTP-only and Secure flags

5. **Rate Limiting**
   - Implement login attempt limiting
   - Add IP-based rate limiting

6. **Additional Security**
   - Implement JWT tokens
   - Add two-factor authentication
   - Use proper authentication middleware (e.g., Passport.js)
   - Add role-based access control (RBAC)

## Implementation Details

### Backend Protection
- All admin endpoints require authentication
- Session validation on every request
- Download verification before allowing downloads

### Frontend Integration
- Session ID stored in localStorage
- Automatic session checking on page load
- Download button visual feedback based on permissions
- Login prompts when needed

## Testing the Feature

1. **Test as Regular User:**
   - Open `http://localhost:3000/`
   - Upload an image
   - Try to download (should prompt for login)
   - Cancel the login prompt
   - Verify download button is dimmed

2. **Test as Admin:**
   - Login when prompted (or from browser console)
   - Verify download button is fully enabled
   - Download should work successfully

3. **Test Admin Panel:**
   - Open `http://localhost:3000/admin.html`
   - Should prompt for login immediately
   - After login, should load frame management interface

## Troubleshooting

### Download Button Not Working
- Check browser console for errors
- Verify backend server is running
- Check if session is stored: `localStorage.getItem('photoFramerSession')`

### Login Not Working
- Verify correct credentials
- Check server logs for authentication errors
- Clear localStorage and try again

### Session Not Persisting
- Check browser localStorage support
- Verify cookies are enabled
- Try clearing browser cache

## Future Enhancements

- User registration system
- Multiple admin accounts
- Role-based permissions (viewer, editor, admin)
- Password reset functionality
- Email verification
- Activity logging and audit trail
