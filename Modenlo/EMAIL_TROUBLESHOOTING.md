# Email Troubleshooting Guide

## Quick Diagnosis

Run this command to test your email configuration:

```bash
cd Modenlo/server
node test-email.js
```

This will check:
- ✅ Environment variables are set correctly
- ✅ Email credentials are valid
- ✅ SMTP connection works
- ✅ Test email can be sent

## Common Issues & Solutions

### Issue 1: Emails Not Sending (No Error)

**Symptoms:**
- Order is created successfully
- Console shows "Email not configured" warnings
- No emails received

**Solution:**
Email environment variables are not set. You need to configure:

**Windows (PowerShell):**
```powershell
$env:EMAIL_USER="your.email@gmail.com"
$env:EMAIL_PASS="your-app-password"
$env:ADMIN_EMAIL="admin@yourdomain.com"
cd photo-framer/server
npm start
```

**Mac/Linux (Terminal):**
```bash
export EMAIL_USER="your.email@gmail.com"
export EMAIL_PASS="your-app-password"
export ADMIN_EMAIL="admin@yourdomain.com"
cd photo-framer/server
npm start
```

**Permanent Solution (Recommended):**
Create `photo-framer/server/.env` file:
```env
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@yourdomain.com
```

Then install dotenv:
```bash
cd photo-framer/server
npm install dotenv
```

Add to top of `server.js`:
```javascript
require('dotenv').config();
```

### Issue 2: "Login not accepted" or "Invalid credentials"

**Symptoms:**
- Console shows "Email transporter verification failed"
- Error: "Invalid login" or "Username and Password not accepted"

**Solution:**
You're using a regular Gmail password instead of an App Password.

**Steps to fix:**

1. **Enable 2-Factor Authentication:**
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow setup instructions

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Modenlo"
   - Click "Generate"
   - Copy the 16-character password (remove spaces)

3. **Update EMAIL_PASS:**
   - Use the 16-character app password (not your regular password)
   - Remove any spaces from the password

### Issue 3: Environment Variables Not Working

**Symptoms:**
- Set environment variables but still seeing default values
- Server shows "silas66@ethereal.email" instead of your email

**Solution:**

**Check if variables are set:**
```bash
# Windows
echo %EMAIL_USER%
echo %EMAIL_PASS%

# Mac/Linux
echo $EMAIL_USER
echo $EMAIL_PASS
```

**Common mistakes:**
- Variables only work in the same terminal session
- Need to restart server after setting variables
- Variables need to be exported (Mac/Linux)

**Best solution - Use .env file:**
1. Create `photo-framer/server/.env`
2. Add your credentials
3. Install dotenv: `npm install dotenv`
4. Add `require('dotenv').config();` to top of server.js
5. Restart server

### Issue 4: Emails Go to Spam

**Symptoms:**
- Emails are sent successfully
- Not appearing in inbox
- Found in spam/junk folder

**Solutions:**

**Short-term:**
1. Mark email as "Not Spam"
2. Add sender to contacts
3. Create filter to always allow

**Long-term (Production):**
1. Use professional email service (SendGrid, Mailgun, AWS SES)
2. Set up SPF, DKIM, and DMARC records
3. Use a custom domain email
4. Don't use Gmail for production

### Issue 5: Gmail Blocking Sign-in

**Symptoms:**
- "Sign-in attempt blocked"
- "Less secure app blocked"

**Solution:**
Gmail no longer allows "less secure apps". You MUST use an App Password with 2-Factor Authentication enabled.

**Steps:**
1. Enable 2FA (see Issue 2)
2. Generate App Password (see Issue 2)
3. Use App Password, NOT regular password

### Issue 6: Firewall/Network Issues

**Symptoms:**
- "Connection timeout"
- "ETIMEDOUT"
- "ECONNREFUSED"

**Solutions:**

1. **Check firewall:**
   - Allow outbound connections on port 587 (TLS)
   - Allow outbound connections on port 465 (SSL)

2. **Check antivirus:**
   - May block SMTP connections
   - Temporarily disable to test

3. **Corporate network:**
   - May block SMTP ports
   - Try different network or contact IT

4. **Alternative - Use Ethereal Email (testing only):**
   ```javascript
   const EMAIL_CONFIG = {
       host: 'smtp.ethereal.email',
       port: 587,
       secure: false,
       auth: {
           user: 'silas66@ethereal.email',
           pass: 'kbHtVUfuSm5dj1e4rz'
       }
   };
   ```
   View emails at https://ethereal.email/messages

### Issue 7: Daily Sending Limit Reached

**Symptoms:**
- First few emails work
- Later emails fail
- "Daily sending quota exceeded"

**Solution:**
Gmail has a limit of 500 emails per day.

**Options:**
1. Wait 24 hours for limit to reset
2. Use multiple Gmail accounts
3. Switch to professional email service (recommended for production)

### Issue 8: Test Email Script Fails

**Symptoms:**
Running `node test-email.js` shows errors

**Solutions:**

1. **Make sure you're in the server directory:**
   ```bash
   cd photo-framer/server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Check Node.js is installed:**
   ```bash
   node --version
   ```
   Should show v14 or higher

4. **Check for typos in environment variables:**
   - EMAIL_USER (not EMAIL_USERNAME)
   - EMAIL_PASS (not EMAIL_PASSWORD)
   - ADMIN_EMAIL (not ADMIN_MAIL)

## Verification Checklist

- [ ] Node.js installed (v14+)
- [ ] Dependencies installed (`npm install` in server directory)
- [ ] Gmail 2-Factor Authentication enabled
- [ ] Gmail App Password generated (16 characters)
- [ ] EMAIL_USER environment variable set to your Gmail address
- [ ] EMAIL_PASS environment variable set to App Password (not regular password)
- [ ] ADMIN_EMAIL environment variable set to notification recipient
- [ ] Server restarted after setting environment variables
- [ ] Test script runs successfully (`node test-email.js`)
- [ ] Test email received in inbox

## Testing Steps

### Step 1: Test Email Configuration

```bash
cd photo-framer/server
node test-email.js
```

**Expected output:**
```
📧 EMAIL CONFIGURATION TEST
========================================

1️⃣  Checking Environment Variables:
   EMAIL_USER: your.email@gmail.com
   EMAIL_PASS: ✅ SET (hidden)
   ADMIN_EMAIL: admin@yourdomain.com

2️⃣  Email Configuration:
   Service: gmail
   User: your.email@gmail.com
   Using env vars: true

3️⃣  Creating Email Transporter...
   ✅ Transporter created successfully

4️⃣  Verifying SMTP Connection...
   ✅ SMTP connection verified successfully!
   ✅ Email service is ready to send emails

5️⃣  Sending Test Email...
   ✅ Test email sent successfully!
   Message ID: <...>
   Check your inbox at: your.email@gmail.com
```

### Step 2: Start Server and Check Logs

```bash
cd photo-framer/server
npm start
```

**Expected output:**
```
Photo Framer API server running on port 3000

📧 Email Service Configuration:
   User: your.email@gmail.com
   Admin Email: admin@yourdomain.com
   Service: gmail
   Status: ✅ Configured

✅ Email transporter ready to send emails
```

### Step 3: Place Test Order

1. Go to http://localhost:3000/
2. Upload an image
3. Configure frame
4. Add to cart
5. Checkout
6. Use YOUR email address in the form
7. Complete order

**Check console for:**
```
✅ Customer confirmation email sent to: your.email@gmail.com
   Message ID: <...>
✅ Admin notification email sent for order: ORD-...
   Message ID: <...>
   Download link sent to: admin@yourdomain.com
```

### Step 4: Verify Emails Received

**Customer Email:**
- Check inbox at the email you entered during checkout
- Subject: "Order Confirmation - Photo Framer"
- Contains order details and shipping info

**Admin Email:**
- Check inbox at ADMIN_EMAIL address
- Subject: "🔔 New Order #... - Print Required"
- Contains download link for high-res images

## Still Having Issues?

### Enable Debug Logging

Add to `photo-framer/server/emailService.js`:

```javascript
const EMAIL_CONFIG = {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'silas66@ethereal.email',
        pass: process.env.EMAIL_PASS || 'kbHtVUfuSm5dj1e4rz'
    },
    debug: true,  // Add this
    logger: true  // Add this
};
```

This will show detailed SMTP communication in the console.

### Alternative: Use Ethereal Email for Testing

If you can't get Gmail working, use Ethereal (fake email service for testing):

1. Go to https://ethereal.email/
2. Click "Create Ethereal Account"
3. Copy credentials
4. Update `.env`:
   ```env
   EMAIL_USER=user@ethereal.email
   EMAIL_PASS=password-from-ethereal
   ADMIN_EMAIL=admin@ethereal.email
   ```
5. Update `emailService.js`:
   ```javascript
   const EMAIL_CONFIG = {
       host: 'smtp.ethereal.email',
       port: 587,
       secure: false,
       auth: {
           user: process.env.EMAIL_USER,
           pass: process.env.EMAIL_PASS
       }
   };
   ```
6. View sent emails at https://ethereal.email/messages

### Contact Information

If you've tried everything and still can't get emails working:

1. Run `node test-email.js` and copy the output
2. Check server console logs when placing an order
3. Include error messages in your support request
4. Mention which solutions you've already tried

## Production Recommendations

For production use, DO NOT use Gmail. Instead:

### Recommended Services:

1. **SendGrid**
   - 100 emails/day free
   - Easy setup
   - Good documentation

2. **Mailgun**
   - 5,000 emails/month free
   - Reliable delivery
   - Great for transactional emails

3. **AWS SES**
   - Very low cost ($0.10 per 1,000 emails)
   - Requires AWS account
   - Excellent deliverability

4. **Postmark**
   - Purpose-built for transactional emails
   - Great support
   - 100 emails/month free

### Why Not Gmail?

- ❌ Daily sending limits (500 emails)
- ❌ May be flagged as spam
- ❌ Not designed for automated emails
- ❌ Less reliable delivery
- ❌ Can be blocked by recipient servers
- ❌ Terms of Service violations

## Summary

**Most common issue:** Not using Gmail App Password

**Quick fix:** 
1. Enable 2FA on Gmail
2. Generate App Password
3. Use App Password (not regular password)
4. Set environment variables
5. Restart server
6. Test with `node test-email.js`

**For production:** Use a professional email service (SendGrid, Mailgun, AWS SES)
