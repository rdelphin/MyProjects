# Email Setup Guide

## Overview

The Photo Framer application uses **Nodemailer** to send email notifications:
- **Customer Confirmation Emails** - Sent to customers after order placement
- **Admin Notification Emails** - Sent to admin with download links for print-ready images

## Quick Setup (Gmail)

### Step 1: Enable 2-Factor Authentication on Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", enable **2-Step Verification**

### Step 2: Generate App Password

1. Still in **Security** settings
2. Under "Signing in to Google", click **2-Step Verification**
3. Scroll to bottom and click **App passwords**
4. Select app: **Mail**
5. Select device: **Other (Custom name)**
6. Enter: `Photo Framer`
7. Click **Generate**
8. **Copy the 16-character password** (you'll need this)

### Step 3: Configure Environment Variables

**On Windows (PowerShell):**

```powershell
# Set email credentials (temporary - for current session)
$env:EMAIL_USER="your.email@gmail.com"
$env:EMAIL_PASS="your-16-char-app-password"
$env:ADMIN_EMAIL="admin@yourdomain.com"

# Navigate to server directory
cd photo-framer/server

# Start server
npm start
```

**To make permanent on Windows:**

1. Search for "Environment Variables" in Start Menu
2. Click "Edit the system environment variables"
3. Click "Environment Variables" button
4. Under "User variables", click "New"
5. Add three variables:
   - Variable name: `EMAIL_USER`, Value: `your.email@gmail.com`
   - Variable name: `EMAIL_PASS`, Value: `your-16-char-app-password`
   - Variable name: `ADMIN_EMAIL`, Value: `admin@yourdomain.com`

**On Mac/Linux (Terminal):**

```bash
# Add to ~/.bashrc or ~/.zshrc
export EMAIL_USER="your.email@gmail.com"
export EMAIL_PASS="your-16-char-app-password"
export ADMIN_EMAIL="admin@yourdomain.com"

# Reload shell config
source ~/.bashrc  # or source ~/.zshrc

# Navigate and start
cd photo-framer/server
npm start
```

## Alternative: Using .env File (Recommended)

### Step 1: Install dotenv

```bash
cd photo-framer/server
npm install dotenv
```

### Step 2: Create .env file

Create `photo-framer/server/.env`:

```env
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your-16-char-app-password
ADMIN_EMAIL=admin@yourdomain.com
```

### Step 3: Update server.js

Add at the top of `server.js`:

```javascript
require('dotenv').config();
```

### Step 4: Add .env to .gitignore

Create `photo-framer/server/.gitignore`:

```
node_modules/
.env
```

## Testing Email Functionality

### Method 1: Test with Ethereal Email (No Real Email Needed)

**Create Test Account:**
1. Go to https://ethereal.email/
2. Click "Create Ethereal Account"
3. Copy the credentials

**Update emailService.js:**

```javascript
const EMAIL_CONFIG = {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
        user: 'your-ethereal-user@ethereal.email',
        pass: 'your-ethereal-password'
    }
};
```

**Benefits:**
- No real email account needed
- View sent emails at https://ethereal.email/messages
- Perfect for development/testing

### Method 2: Test with Real Gmail

Place a test order:

1. **Start Server:**
   ```bash
   cd photo-framer/server
   npm start
   ```

2. **Verify Email Config in Console:**
   ```
   📧 Email Configuration:
   Set EMAIL_USER and EMAIL_PASS environment variables to enable email notifications
   ```

3. **Place Test Order:**
   - Go to `http://localhost:3000/`
   - Upload image
   - Configure frame
   - Add to cart
   - Proceed to checkout
   - Fill in form with YOUR email address
   - Click "Place Order"

4. **Check Results:**
   - **Customer Email:** Check the email you entered
   - **Admin Email:** Check the admin email address
   - **Console:** Look for "Customer confirmation email sent" and "Admin notification email sent"

## Troubleshooting

### Error: "Login not accepted"

**Solution:** 
- Make sure you're using an **App Password**, not your regular Gmail password
- Verify 2-Factor Authentication is enabled

### Error: "Invalid credentials"

**Solution:**
- Double-check EMAIL_USER and EMAIL_PASS values
- Remove any spaces from the app password
- Make sure you're using the full email address

### Emails not sending but no error

**Check:**
1. Environment variables are set correctly
2. Server was restarted after setting variables
3. Check spam/junk folders
4. Verify Gmail hasn't blocked the login

**Debug in console:**
```javascript
// Add to emailService.js
console.log('Email config:', {
    user: process.env.EMAIL_USER,
    passSet: !!process.env.EMAIL_PASS,
    admin: process.env.ADMIN_EMAIL
});
```

### Error: "Connection timeout"

**Solutions:**
- Check your internet connection
- Try a different email provider
- Check if firewall is blocking port 587 or 465

## Email Templates

### Customer Email Contains:
✅ Order confirmation  
✅ Order details (frames, mounts, prices)  
✅ Shipping address  
✅ Order total  
✅ Estimated delivery time  

### Admin Email Contains:
✅ New order notification  
✅ Customer information  
✅ **Download link for high-res images**  
✅ Link expiration (7 days)  
✅ Order details for processing  

## Production Recommendations

### 1. Use Professional Email Service

**Recommended Services:**
- **SendGrid** - 100 emails/day free
- **Mailgun** - 5,000 emails/month free
- **AWS SES** - Very low cost
- **Postmark** - Reliable transactional emails

**Why not Gmail in production?**
- Daily sending limits (500 emails/day)
- May be flagged as spam
- Not designed for automated emails
- Less reliable delivery

### 2: Example with SendGrid

```javascript
// emailService.js
const EMAIL_CONFIG = {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
    }
};
```

### 3. Security Best Practices

✅ Never commit credentials to git  
✅ Use environment variables  
✅ Use different credentials for dev/production  
✅ Rotate passwords regularly  
✅ Monitor email sending logs  
✅ Set up SPF/DKIM/DMARC records  

## Current Status

**Without Email Configuration:**
- Orders are still created
- Data is saved to `orders.json`
- Download tokens are generated
- Console shows: "Email not configured"
- **System works, just no emails sent**

**With Email Configuration:**
- Everything above PLUS:
- Customer receives confirmation email
- Admin receives notification with download link
- Emails are logged in console

## Quick Start Checklist

- [ ] Generate Gmail App Password
- [ ] Set EMAIL_USER environment variable
- [ ] Set EMAIL_PASS environment variable  
- [ ] Set ADMIN_EMAIL environment variable
- [ ] Restart server
- [ ] Place test order
- [ ] Check inbox for emails
- [ ] Click download link in admin email
- [ ] Verify order data received

## Support

If emails still aren't working:

1. **Check server console** for error messages
2. **Test with Ethereal Email** first (easier setup)
3. **Verify environment variables** are loaded
4. **Check email service limits** (Gmail has daily limits)
5. **Review firewall/antivirus** settings

Remember: The application works WITHOUT email. Emails are a notification feature, not required for core functionality!
