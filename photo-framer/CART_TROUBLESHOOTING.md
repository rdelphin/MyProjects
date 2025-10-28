# Shopping Cart - Troubleshooting Guide

## Issue 1: Add to Cart Button Not Responding

### Root Cause
The Add to Cart button is only visible when you're in the editor view (after uploading an image). It won't work on the upload screen.

### Solution Steps:

1. **Upload an Image First:**
   - Click "Upload Your Photo" or drag & drop an image
   - Wait for the editor to load
   - You should see the controls on the left side

2. **Verify Button is Visible:**
   - Look for "Add to Cart" button in the action buttons section
   - It should be a purple/gradient button
   - Below it should be "Download Preview (Admin Only)"

3. **Test the Button:**
   - Click the "Add to Cart" button
   - You should see an alert: "Item added to cart!"
   - Cart badge (red circle) should appear on cart icon showing "1"

4. **Check Browser Console:**
   - Press F12
   - Go to Console tab
   - Look for message: "Add to cart clicked"
   - If you see errors, share them

## Issue 2: Admin Login Failed

### Problem
The server might not be running with the latest code that includes authentication.

### CRITICAL: Restart Server with New Code

**Step 1: Stop ALL Node Processes**
```powershell
# Stop all running node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Step 2: Start Fresh Server**
```bash
cd photo-framer/server
npm start
```

**Step 3: Verify Server Started**
You should see:
```
Photo Framer API server running on port 3000
Frontend: http://localhost:3000/
Admin Panel: http://localhost:3000/admin.html
API: http://localhost:3000/api/frames
```

### Admin Credentials

**Default Login:**
- **Username:** `admin`
- **Password:** `admin123`

These are case-sensitive!

### Test Admin Login:

1. **Via Browser Console:**
   - Open `http://localhost:3000/`
   - Press F12 (Developer Tools)
   - Go to Console tab
   - Paste this code:
   ```javascript
   fetch('http://localhost:3000/api/auth/login', {
       method: 'POST',
       headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({username: 'admin', password: 'admin123'})
   })
   .then(r => r.json())
   .then(d => console.log('Login result:', d))
   ```
   - Press Enter
   - You should see: `Login result: {success: true, sessionId: "...", isAdmin: true, username: "admin"}`

2. **Via Download Button:**
   - Upload an image
   - Click "Download Preview (Admin Only)"
   - When prompted, enter:
     - Username: `admin`
     - Password: `admin123`
   - Should see: "Successfully logged in as admin!"

## Complete Test Flow

### Test 1: Add Item to Cart

1. **Restart Server** (see above)
2. Open `http://localhost:3000/`
3. Upload an image (any JPG/PNG)
4. Select frame size (e.g., "8x10")
5. Select mount (e.g., "Aluminium Alloy Mount")
6. Click "Add to Cart"
7. Confirm you want to view cart
8. Should redirect to cart page showing your item

### Test 2: View Cart

1. Cart should show:
   - Preview thumbnail
   - Frame size and orientation
   - Mount option
   - Price breakdown
   - Total price
2. Click "Proceed to Checkout"

### Test 3: Checkout

1. Fill in all form fields:
   - Email
   - Name
   - Address
   - City, State, ZIP
   - Phone
2. Select payment method
3. Click "Place Order"
4. Should see success page

## Common Issues & Solutions

### Issue: "Add to Cart button not found" in console

**Solution:**
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check if you're on editor screen (after uploading image)

### Issue: Cart badge not updating

**Solution:**
```javascript
// In browser console, manually update:
localStorage.setItem('photoFramerCart', '[]');
location.reload();
```

### Issue: Admin login fails

**Solutions:**
1. Verify server is running the latest code
2. Check credentials (case-sensitive)
3. Test API endpoint (see test above)
4. Check server console for errors

### Issue: CORS errors

**Solution:**
- Server must be running
- Access via `http://localhost:3000` (not file://)
- Check server console for CORS settings

### Issue: Cart appears empty after adding items

**Solution:**
```javascript
// Check cart contents in console:
JSON.parse(localStorage.getItem('photoFramerCart'))

// If it shows items but page doesn't, refresh:
location.reload();
```

## Debug Commands

### Check if Add to Cart Function Exists
```javascript
typeof addToCart === 'function'
// Should return: true
```

### Check if Button Exists
```javascript
document.getElementById('addToCartBtn')
// Should return: button element or null
```

### Manually Add Test Item
```javascript
localStorage.setItem('photoFramerCart', JSON.stringify([{
    id: Date.now(),
    frameSize: '8x10',
    frameSizeName: '8x10',
    framePrice: 29.99,
    mountId: 'no-mount',
    mountName: 'No Mount',
    mountPrice: 0,
    orientation: 'portrait',
    totalPrice: 29.99,
    previewImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    addedAt: new Date().toISOString()
}]));
location.reload();
```

### Check Cart Badge Update
```javascript
// This should show/update cart badge:
const cart = JSON.parse(localStorage.getItem('photoFramerCart') || '[]');
const badge = document.getElementById('cartBadge');
badge.textContent = cart.length;
badge.style.display = cart.length > 0 ? 'flex' : 'none';
```

## Still Having Issues?

1. **Share Browser Console Errors:**
   - Press F12
   - Go to Console tab
   - Screenshot any red errors
   
2. **Check Server Console:**
   - Look at terminal where server is running
   - Share any error messages

3. **Verify File Changes:**
   - Check that `script.js` has `addToCart` function
   - Check that `index.html` has `id="addToCartBtn"`

4. **Test API Directly:**
   ```javascript
   // Test frames endpoint:
   fetch('http://localhost:3000/api/frames')
       .then(r => r.json())
       .then(d => console.log('Frames:', d))
   
   // Test mounts endpoint:
   fetch('http://localhost:3000/api/mounts')
       .then(r => r.json())
       .then(d => console.log('Mounts:', d))
   ```

## Quick Fix Script

Run this in browser console to reset everything:
```javascript
// Clear all localStorage
localStorage.clear();

// Reload page
location.reload();
```

Then start fresh: upload image → add to cart → view cart → checkout
