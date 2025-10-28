# Download Workflow - Post-Transaction Only

## Overview

The download functionality has been redesigned to ensure that high-resolution images are only available after a confirmed transaction. This creates a proper commercial workflow where downloads are tied to paid orders.

## New Workflow

### For Regular Users (Customers)

1. **Design Phase:**
   - Upload photo
   - Select frame size
   - Choose mount option
   - Adjust position and zoom
   - **NO download option available**

2. **Shopping Cart:**
   - Add configured frame(s) to cart
   - Review items and pricing
   - Proceed to checkout

3. **Checkout:**
   - Enter shipping information
   - Select payment method
   - Place order

4. **Order Confirmation:**
   - Receive order confirmation on screen
   - Get confirmation email with:
     - Order details
     - Frame size and mount selection
     - Total price
     - Estimated delivery date
     - **NO download link** (users receive physical product only)

### For Administrators

1. **Order Notification:**
   - Admin receives separate confirmation email for each order
   - Email includes all order details

2. **Download Access:**
   - Email contains secure download link
   - Link allows one-time download of high-resolution image
   - Image is properly sized for metal printing:
     - Correct dimensions based on frame size
     - Proper DPI (150+ recommended)
     - Correct orientation (portrait/landscape)
     - Applied zoom and positioning from customer's design

3. **Production:**
   - Admin downloads image
   - Sends to metal printing facility
   - Processes order fulfillment

## Technical Implementation

### Removed from Main App (index.html)

- ❌ Download button removed
- ✅ Add to Cart is primary action
- ✅ Upload New Photo is secondary action

### Cart Items Store

Each cart item includes:
```javascript
{
  id: timestamp,
  frameSize: "8x10",
  orientation: "portrait",
  mountId: "aluminium-alloy",
  zoom: 120,
  position: {x: 10, y: -5},
  imageData: "data:image/...", // Full resolution
  previewImage: "data:image/...", // 200x200 thumbnail
  totalPrice: 54.99,
  addedAt: "2025-10-28T..."
}
```

### Order Completion

When order is placed in `checkout-script.js`:
```javascript
{
  contact: {email: "customer@example.com"},
  shipping: {...},
  payment: {method: "credit_card"},
  order: {
    items: [...], // All cart items with full image data
    totals: {...},
    orderDate: "2025-10-28T..."
  }
}
```

## Future Enhancements (To Be Implemented)

### 1. Backend Order Storage

**Create endpoint:** `POST /api/orders`

```javascript
// Store order in database
{
  orderId: "ORD-2025-001234",
  customerId: "...",
  items: [...],
  status: "pending",
  createdAt: "..."
}
```

### 2. Email Notification System

**Customer Email Template:**
```
Subject: Order Confirmation #ORD-2025-001234

Dear [Customer Name],

Thank you for your order!

Order Details:
- Frame Size: 8x10" (Portrait)
- Mount: Aluminium Alloy Mount
- Total: $54.99

Your custom framed photo will be prepared and shipped within 3-5 business days.

Tracking information will be sent to this email address once your order ships.

Thank you for choosing Photo Framer!
```

**Admin Email Template:**
```
Subject: New Order - Print Required #ORD-2025-001234

Order #ORD-2025-001234

Customer: John Doe (john@example.com)
Frame: 8x10" Portrait
Mount: Aluminium Alloy Mount
Payment: $54.99 (Credit Card)

DOWNLOAD HIGH-RES IMAGE:
[Secure Download Link]
Download Expires: 7 days

Image Specifications:
- Resolution: 2400 x 3000 pixels
- DPI: 300
- Format: PNG
- Size: ~8MB

Ship To:
John Doe
123 Main St
New York, NY 10001
Phone: (555) 123-4567

IMPORTANT: Download and process within 7 days.
```

### 3. Secure Download Links

**Generate in `checkout-script.js`:**
```javascript
// After order placement
const downloadToken = crypto.randomUUID();
const downloadLink = `https://yoursite.com/api/download/${orderId}/${downloadToken}`;

// Store in database
{
  orderId: "ORD-2025-001234",
  downloadToken: "abc123...",
  expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
  downloaded: false
}
```

**Backend endpoint:** `GET /api/download/:orderId/:token`

```javascript
app.get('/api/download/:orderId/:token', async (req, res) => {
  const { orderId, token } = req.params;
  
  // Verify token
  const download = await getDownloadRecord(orderId, token);
  
  if (!download || download.expiresAt < Date.now()) {
    return res.status(403).json({ error: 'Link expired or invalid' });
  }
  
  if (download.downloaded) {
    return res.status(403).json({ error: 'Already downloaded' });
  }
  
  // Get order data
  const order = await getOrder(orderId);
  
  // Generate high-res image from order data
  const imageBuffer = await generatePrintImage(order.items[0]);
  
  // Mark as downloaded
  await markDownloaded(orderId);
  
  // Send file
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', `attachment; filename="order-${orderId}.png"`);
  res.send(imageBuffer);
});
```

### 4. Order Management Dashboard

**Admin Panel Feature:**
- View all orders
- Filter by status (pending, processing, completed)
- Download images directly
- Mark as printed/shipped
- Send tracking info to customers

## Security Considerations

### 1. Download Token Security
- Cryptographically random tokens (UUID v4)
- One-time use only
- Time-limited (7 days)
- Tied to specific order

### 2. Image Data Storage
- Store full-resolution image data with order
- Encrypt sensitive data
- Implement data retention policy
- Automatic cleanup after fulfillment

### 3. Email Security
- Use secure email service (SendGrid, Mailgun, etc.)
- HTTPS-only download links
- SPF/DKIM/DMARC records configured
- No sensitive data in email body

## Benefits of This Approach

✅ **Revenue Protection:** Downloads only after payment  
✅ **Order Tracking:** Every download tied to an order  
✅ **Quality Control:** Admin reviews before production  
✅ **Customer Experience:** Clear expectations, no confusion  
✅ **Audit Trail:** Track when images were downloaded  
✅ **Professional:** Matches industry standard workflows  

## Implementation Priority

1. **Phase 1 (Current):** ✅ Remove download from main app
2. **Phase 2:** Backend order storage
3. **Phase 3:** Email notification system
4. **Phase 4:** Secure download links
5. **Phase 5:** Admin order management dashboard

## Current Status

✅ Download button removed from index.html  
✅ Add to Cart is primary workflow  
✅ Cart stores full image data  
✅ Checkout collects order information  
⏳ Backend integration (pending)  
⏳ Email notifications (pending)  
⏳ Secure download links (pending)  

The foundation is in place - cart items include all necessary data (full-resolution images, positioning, settings) to generate print-ready files after order confirmation.
