# 📤 Upload Code Flow Explanation

## Overview
When you click "Add to Cart", here's the complete upload process:

---

## 1️⃣ Client-Side Upload (script.js Lines 1536-1687)

### The `addToCart()` Function:

```javascript
async function addToCart(e) {
    console.log('Add to cart clicked');
    
    if (!state.uploadedImage) {
        return; // No image uploaded
    }
    
    // Disable button during upload
    addToCartBtn.disabled = true;
    addToCartBtn.textContent = 'Uploading...';
    
    try {
        // STEP 1: Generate FULL-RESOLUTION final image (300 DPI)
        console.log('[ADD TO CART] Generating full-resolution image...');
        const finalCanvas = generateFinalImage();
        const dimensions = getFrameDimensions(state.frameSize, state.orientation);
        console.log(`[ADD TO CART] Image dimensions: ${dimensions.width}x${dimensions.height}px`);
        
        // STEP 2: Convert to PNG blob for lossless upload
        const fullResBlob = await new Promise(resolve => 
            finalCanvas.toBlob(resolve, 'image/png')
        );
        console.log(`[ADD TO CART] Full-res blob size: ${(fullResBlob.size / 1024 / 1024).toFixed(2)}MB`);
        
        // STEP 3: Upload full-res image to server IMMEDIATELY
        const itemId = Date.now();
        const formData = new FormData();
        formData.append('image', fullResBlob, `${itemId}.png`);
        formData.append('itemId', itemId);
        
        // ⚠️ THIS IS WHERE THE 404 ERROR HAPPENS IF .htaccess IS MISSING
        console.log('[ADD TO CART] Uploading to server...');
        const uploadResponse = await fetch(`${API_BASE}/upload-image`, {
            method: 'POST',
            body: formData
        });
        
        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.status}`);
        }
        
        const uploadResult = await uploadResponse.json();
        if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Upload failed');
        }
        
        console.log('[ADD TO CART] Upload successful, imageId:', uploadResult.imageId);
        
        // STEP 4: Generate small preview thumbnail (for cart display)
        const previewCanvas = document.createElement('canvas');
        const previewCtx = previewCanvas.getContext('2d');
        previewCanvas.width = 200;
        previewCanvas.height = 200;
        
        // ... preview generation code ...
        
        const previewDataUrl = previewCanvas.toDataURL('image/jpeg', 0.6);
    
        // STEP 5: Create cart item with imageId (full-res already on server!)
        const cartItem = {
            id: itemId,
            imageId: uploadResult.imageId, // ← Reference to server file
            frameSize: state.frameSize,
            orientation: state.orientation,
            previewImage: previewDataUrl, // ← Small preview for cart UI
            // ... other properties ...
        };
    
        // STEP 6: Add to cart in localStorage
        const cart = getCart();
        cart.push(cartItem);
        saveCart(cart);
        
        showToast('✅ Item added to cart!');
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        
        // ⚠️ THIS IS THE ERROR MESSAGE YOU'RE SEEING
        let errorMessage = 'Error adding item to cart. Please try again.';
        if (error.message.includes('Upload failed')) {
            errorMessage = 'Failed to upload image to server. Please check your connection and try again.';
        }
        
        alert(errorMessage);
    } finally {
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = 'ADD TO CART';
    }
}
```

### Key Points:
- **Line 1568**: `fetch(\`${API_BASE}/upload-image\`)` ← This is where the 404 happens!
- **API_BASE**: Defined as `${window.location.origin}/api` (line 5)
- **Result**: Request goes to `https://modenlo.com/api/upload-image`
- **Without .htaccess**: Apache doesn't know where to route this → 404

---

## 2️⃣ Server-Side Upload (server.js Lines 1036-1078)

### The `/api/upload-image` Endpoint:

```javascript
// IMAGE UPLOAD ENDPOINT - Save to disk (NEW SYSTEM)
app.post('/api/upload-image', uploadOriginal.single('image'), async (req, res) => {
    try {
        console.log('[IMAGE UPLOAD] New image upload request - saving to disk');
        
        const itemId = req.body.itemId;
        const imageFile = req.file; // ← Multer processes this
        
        if (!imageFile) {
            return res.status(400).json({ 
                success: false, 
                error: 'No image file provided' 
            });
        }
        
        // Extract imageId from filename (without extension)
        const imageId = path.basename(imageFile.filename, '.png');
        
        // Get file stats
        const stats = await fs.stat(imageFile.path);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        
        console.log(`[IMAGE UPLOAD] Saved to disk: ${imageFile.filename} (${sizeMB}MB)`);
        console.log(`[IMAGE UPLOAD] Location: ${ORIGINALS_DIR}`);
        console.log(`[IMAGE UPLOAD] Image ID: ${imageId}`);
        
        res.json({ 
            success: true, 
            imageId: imageId,
            filename: imageFile.filename,
            path: imageFile.path,
            size: stats.size,
            sizeMB: sizeMB,
            message: 'Image saved to disk successfully'
        });
        
    } catch (error) {
        console.error('[IMAGE UPLOAD] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to upload image: ' + error.message 
        });
    }
});
```

### Multer Configuration (Lines 59-100):

```javascript
const originalsStorage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            console.log(`[UPLOAD] Creating directory: ${ORIGINALS_DIR}`);
            // Create originals directory if it doesn't exist
            await fs.mkdir(ORIGINALS_DIR, { recursive: true });
            console.log(`[UPLOAD] Directory ready: ${ORIGINALS_DIR}`);
            
            // Verify directory is writable
            await fs.access(ORIGINALS_DIR, fs.constants.W_OK);
            console.log(`[UPLOAD] Directory is writable`);
            
            cb(null, ORIGINALS_DIR);
        } catch (error) {
            console.error(`[UPLOAD] Error setting up destination:`, error);
            console.error(`[UPLOAD] Attempted path: ${ORIGINALS_DIR}`);
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const imageId = `original-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`[UPLOAD] Generated filename: ${imageId}.png`);
        cb(null, `${imageId}.png`);
    }
});

const uploadOriginal = multer({
    storage: originalsStorage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max for high-res images
    },
    fileFilter: function (req, file, cb) {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
```

### Where Images are Saved:
```javascript
// Line 22 in server.js
const ORIGINALS_DIR = path.join(__dirname, '..', 'uploads', 'originals');
// Resolves to: /public_html/uploads/originals/
```

---

## 3️⃣ The Request Flow

### Without .htaccess (CURRENT - BROKEN):
```
Browser Request:
https://modenlo.com/api/upload-image
         ↓
    Apache Web Server
         ↓
    Checks /public_html/api/upload-image
         ↓
    ❌ File doesn't exist
         ↓
    Returns 404 Not Found
```

### With .htaccess (FIXED):
```
Browser Request:
https://modenlo.com/api/upload-image
         ↓
    Apache Web Server
         ↓
    Reads .htaccess
         ↓
    RewriteRule matches /api/*
         ↓
    Proxies to: http://127.0.0.1:3000/api/upload-image
         ↓
    Node.js Express Server
         ↓
    Matches route: app.post('/api/upload-image', ...)
         ↓
    Multer processes FormData
         ↓
    Saves file to: /uploads/originals/original-xxx.png
         ↓
    Returns: {"success":true,"imageId":"original-xxx"}
         ↓
    ✅ SUCCESS - Image uploaded!
```

---

## 🔍 Why You Get the Error

1. **Client sends upload** to `https://modenlo.com/api/upload-image`
2. **Apache receives request** but has no routing rules
3. **404 returned** because `/api/upload-image` doesn't exist as a file
4. **Client code catches error** at line 1574
5. **Shows message** at line 1675: "Failed to upload image to server..."

---

## ✅ The Fix

The `.htaccess` file tells Apache:
```apache
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

Translation: "If URL starts with `/api/`, proxy it to Node.js on port 3000"

This connects Apache (port 80/443) ↔ Node.js (port 3000)

---

## 📊 Expected Console Logs (When Working)

**Client Side:**
```
[ADD TO CART] Generating full-resolution image...
[ADD TO CART] Image dimensions: 2400x3000px
[ADD TO CART] Full-res blob size: 5.51MB
[ADD TO CART] Uploading to server...
[ADD TO CART] Upload successful, imageId: original-1713396543-abc123xyz
```

**Server Side:**
```
[IMAGE UPLOAD] New image upload request - saving to disk
[UPLOAD] Creating directory: /home/user/public_html/uploads/originals
[UPLOAD] Directory ready: /home/user/public_html/uploads/originals
[UPLOAD] Directory is writable
[UPLOAD] Generated filename: original-1713396543-abc123xyz.png
[IMAGE UPLOAD] Saved to disk: original-1713396543-abc123xyz.png (5.51MB)
[IMAGE UPLOAD] Location: /home/user/public_html/uploads/originals
[IMAGE UPLOAD] Image ID: original-1713396543-abc123xyz
```

---

## 🎯 Summary

**The Problem**: No routing from Apache → Node.js  
**The Symptom**: 404 on `/api/upload-image`  
**The Fix**: Deploy `.htaccess` to proxy API requests  
**The Result**: Images upload successfully to `/uploads/originals/`

Once .htaccess is deployed, the upload code (which is already correct) will work perfectly!
