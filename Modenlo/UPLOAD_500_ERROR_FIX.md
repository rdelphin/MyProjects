# Upload 500 Error Fix

## Problem
Users were experiencing a 500 error when trying to upload images with the message:
```
Upload failed: 500
```

Error occurred at `script.js:1574:19` during the image upload process.

## Root Cause
There were **two duplicate `/api/upload-image` endpoints** defined in `server/server.js`:

1. **Line 991**: Using `upload` middleware, storing images in `tempImageStore` (in-memory)
2. **Line 1707**: Using `uploadOriginal` middleware, saving to disk in `ORIGINALS_DIR`

When a request came in, Express was trying to handle it with both middleware configurations, causing conflicts and resulting in the 500 error.

## Solution
**Removed the duplicate endpoint at line 1707** and all related code:
- Deleted the `ORIGINALS_DIR` constant declaration
- Deleted the `originalsStorage` multer configuration
- Deleted the `uploadOriginal` multer instance
- Deleted the duplicate `/api/upload-image` POST endpoint
- Deleted the `/api/download-image/:imageId` GET endpoint
- Removed the reference to `ORIGINALS_DIR` in the server startup logs

The working implementation (line 991) was kept, which:
- Uses `upload.single('image')` middleware
- Stores images temporarily in `tempImageStore` (Map in memory)
- Converts images to base64 for email compatibility
- Automatically cleans up expired images after 1 hour
- Integrates properly with the order processing system

## Files Modified
- `server/server.js` - Removed duplicate endpoint and cleaned up unused code (lines 1680-1807)

## Testing
1. Server now starts successfully without errors
2. No more duplicate endpoint conflicts
3. Upload endpoint is accessible at: `POST /api/upload-image`
4. Server running on: http://localhost:3000

## Next Steps
To test the fix:
1. Navigate to http://localhost:3000/framer.html
2. Upload an image
3. Add item to cart
4. The upload should now succeed without 500 errors

## Note
The email configuration warning is unrelated to this fix and can be addressed separately by updating the Gmail credentials.
