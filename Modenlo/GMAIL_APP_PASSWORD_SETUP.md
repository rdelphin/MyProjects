# Gmail App Password Setup Guide

## Step-by-Step Instructions

### 1. Verify 2-Step Verification is Enabled

1. Go to: https://myaccount.google.com/security
2. Sign in with: **prints.modenlo@gmail.com**
3. Find "Signing in to Google" section
4. Make sure **2-Step Verification** is **ON** (this is required for App Passwords)
   - If it's OFF, click it and follow the setup wizard

### 2. Generate App Password

1. While still on the Security page, click on **2-Step Verification**
2. Scroll to the bottom of the page
3. Find and click **App passwords**
   - If you don't see this option, make sure 2-Step Verification is enabled
4. You may need to sign in again for security
5. Select options:
   - **Select app**: Choose **Mail**
   - **Select device**: Choose **Other (Custom name)**
   - Enter name: **Modenlo**
6. Click **Generate**
7. Google will show a **16-character password** (format: xxxx xxxx xxxx xxxx)
8. **IMPORTANT**: Copy this password immediately - you won't be able to see it again!

### 3. Format the Password

Remove all spaces from the password. For example:
- If shown as: `abcd efgh ijkl mnop`
- Use this format: `abcdefghijklmnop`

### 4. Update Your .env File

The password will be automatically updated in your `.env` file once you provide it.

### 5. Test the Configuration

After updating, test with:
```bash
cd e:\MyProjects\Modenlo\server
node test-email.js
```

## Troubleshooting

### If App Passwords option is missing:
- Ensure 2-Step Verification is enabled
- Wait a few minutes after enabling 2-Step Verification
- Try refreshing the page

### If the new password still doesn't work:
1. Check for any typos (no spaces in the password)
2. Make sure you're using the Gmail address: prints.modenlo@gmail.com
3. Try logging into Gmail on a web browser to check for security alerts
4. Revoke the old App Password and generate a new one

### Alternative: Check for Security Alerts

1. Go to: https://myaccount.google.com/notifications
2. Look for any blocked sign-in attempts
3. Click "Yes, it was me" if you see any

## Security Best Practices

✅ Never share your App Password  
✅ Never commit the .env file to Git  
✅ Revoke old App Passwords you're not using  
✅ Generate a new password if compromised  

---

**Ready to proceed?** Generate your new App Password using the steps above, then provide it so I can update your configuration!
