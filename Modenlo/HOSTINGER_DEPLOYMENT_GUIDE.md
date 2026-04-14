# 🚀 Hostinger Business Hosting Deployment Guide

Complete step-by-step guide to deploy Modenlo to your Hostinger Business Web Hosting.

---

## 📋 Pre-Deployment Checklist

Before starting, ensure you have:

- ✅ Hostinger Business Web Hosting account
- ✅ Domain: modenlo.com configured in Hostinger
- ✅ Node.js enabled in hPanel
- ✅ FileZilla FTP client installed ([Download here](https://filezilla-project.org/))
- ✅ Gmail app password (already set up: `qdghzupmjoancpaq`)
- ✅ All files prepared locally

---

## 🎯 Deployment Overview

This deployment consists of 5 main phases:

1. **Prepare Files Locally** (5 minutes)
2. **Upload via FTP** (10 minutes)  
3. **Configure in hPanel** (15 minutes)
4. **Set Environment Variables** (5 minutes)
5. **Test & Launch** (15 minutes)

**Total Time: ~50 minutes**

---

## Phase 1: Prepare Files Locally

### Step 1.1: Update Admin Password

**IMPORTANT: Change your admin credentials before deploying!**

Open `.env.production` and update:

```env
ADMIN_USERNAME=your_chosen_username
ADMIN_PASSWORD=YOUR_SECURE_PASSWORD_HERE
```

> **Security Tip:** Use a strong password with 12+ characters, including uppercase, lowercase, numbers, and symbols.

### Step 1.2: Generate Session Secret

Add a random session secret to `.env.production`:

```env
SESSION_SECRET=your_random_32_character_secret_key_here
```

> **How to generate:** Use an online generator or run this in your terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### Step 1.3: Verify Files to Upload

Make sure these files/folders exist:
- ✅ All HTML files (index.html, admin.html, etc.)
- ✅ All CSS files (style.css, admin-style.css, etc.)
- ✅ All JS files (script.js, admin-script.js, etc.)
- ✅ `server/` folder with all contents
- ✅ `images/` folder with all contents
- ✅ `logo/` folder
- ✅ `uploads/` folder (may be empty)

**DO NOT upload:**
- ❌ `node_modules/` (will be installed on server)
- ❌ `.env` files (will configure in hPanel)
- ❌ `.git/` folder (if present)
- ❌ Any local test files

---

## Phase 2: Get FTP Credentials from Hostinger

### Step 2.1: Access hPanel

1. Log in to your Hostinger account at [hostinger.com](https://hostinger.com)
2. Go to **Hosting** → Select your hosting plan
3. Click on **hPanel** or **Manage**

### Step 2.2: Find FTP Credentials

In hPanel:

1. Look for **Files** section in the left sidebar
2. Click on **FTP Accounts**
3. You'll see your FTP credentials:

```
FTP Host: ftp.modenlo.com (or an IP address)
FTP Username: u123456789 (or similar)
FTP Port: 21
```

4. **Password**: Either use existing or create new FTP account

> **Note:** Take note of these credentials - you'll need them for FileZilla.

### Step 2.3: Identify Upload Directory

Common paths:
- `public_html/` - Main website directory
- `domains/modenlo.com/public_html/` - Domain-specific directory

> **Important:** Upload to the correct directory where your domain points.

---

## Phase 3: Upload Files via FileZilla

### Step 3.1: Configure FileZilla

1. Open FileZilla
2. Go to **File** → **Site Manager** (or press Ctrl+S)
3. Click **New Site**, name it "Modenlo Hostinger"
4. Configure:
   ```
   Protocol: FTP - File Transfer Protocol
   Host: [Your FTP host from hPanel]
   Port: 21
   Encryption: Use explicit FTP over TLS if available
   Logon Type: Normal
   User: [Your FTP username]
   Password: [Your FTP password]
   ```
5. Click **Connect**

### Step 3.2: Navigate to Upload Directory

In FileZilla's remote site (right side):
- Navigate to `public_html/` or `domains/modenlo.com/public_html/`

### Step 3.3: Upload Files

In FileZilla's local site (left side):
- Navigate to `e:\MyProjects\Modenlo`

**Upload these files/folders:**

1. **Root HTML Files:**
   - All `.html` files (index.html, admin.html, framer.html, etc.)

2. **Root JavaScript Files:**
   - All `.js` files (script.js, cart-script.js, etc.)

3. **Root CSS Files:**
   - All `.css` files (style.css, admin-style.css, etc.)

4. **Folders:**
   - `server/` folder (drag entire folder)
   - `images/` folder (drag entire folder)
   - `logo/` folder (drag entire folder)
   - `uploads/` folder (drag entire folder)

**Progress Monitoring:**
- Watch the FileZilla queue at the bottom
- Ensure all files transfer successfully
- **Total file count:** ~50-70 files depending on your project

> **⚠️ IMPORTANT:** Do NOT upload `node_modules/` folder. It will be installed on the server.

### Step 3.4: Verify Upload

After upload completes:
1. Check that `server/` folder contains:
   - `server.js`
   - `emailService.js`
   - `package.json`
   - `data/` folder with JSON files

2. Check file permissions (optional):
   - Right-click → File permissions
   - Folders: 755
   - Files: 644

---

## Phase 4: Configure Node.js Application in hPanel

### Step 4.1: Access Node.js Section

1. In hPanel, find **Advanced** section
2. Click on **Node.js**
3. If you don't see Node.js, contact Hostinger support to enable it

### Step 4.2: Create Node.js Application

1. Click **Create Application** or **+ New Application**
2. Fill in the details:

```
Application Name: Modenlo
Application Mode: Production
Node.js Version: 18.x or latest LTS
Application Root: public_html (or your upload directory)
Application URL: modenlo.com (or leave default)
Application Startup File: server/server.js
```

3. Click **Create** or **Add**

### Step 4.3: Set Environment Variables

In the Node.js Application settings:

1. Find **Environment Variables** or **Environment** section
2. Click **Add Variable** for each of these:

```
NODE_ENV = production
PORT = (leave this - Hostinger assigns automatically)
EMAIL_USER = prints.modenlo@gmail.com
EMAIL_PASS = qdghzupmjoancpaq
ADMIN_EMAIL = prints.modenlo@gmail.com
ADMIN_USERNAME = [Your chosen username from .env.production]
ADMIN_PASSWORD = [Your secure password from .env.production]
SESSION_SECRET = [Your generated secret from .env.production]
APP_URL = https://modenlo.com
```

3. Save each variable

### Step 4.4: Install Dependencies

In the Node.js Application panel:

1. Look for **npm install** button or **Package Manager** section
2. Click **Run npm install** or **Install Dependencies**
3. Wait for installation to complete (may take 2-3 minutes)

**Alternatively**, if there's a terminal option:
```bash
cd public_html/server
npm install
```

### Step 4.5: Start the Application

1. Click **Start Application** or **Enable Application**
2. Wait for status to show **Running** or **Active**
3. Note the assigned port (if shown)

---

## Phase 5: Configure Domain & SSL

### Step 5.1: Point Domain to Node.js App

1. In hPanel, go to **Domains** section
2. Click on **modenlo.com**
3. Look for **Node.js Application** or **Application** setting
4. Select your "Modenlo" application from dropdown
5. Save changes

### Step 5.2: Enable SSL Certificate

1. In hPanel, go to **Security** → **SSL**
2. Find **modenlo.com**
3. Click **Install SSL** (Free Let's Encrypt)
4. Wait for installation (usually instant)
5. Enable **Force HTTPS** redirect

---

## Phase 6: Testing

### Step 6.1: Access Your Website

1. Open browser and go to: `https://modenlo.com`
2. You should see your landing page

**If you see an error:**
- Check Application Status in Node.js panel
- View application logs in hPanel
- See TROUBLESHOOTING.md

### Step 6.2: Test Main Features

✅ **Landing Page:**
- Navigate to https://modenlo.com
- All images load correctly

✅ **Product Pages:**
- Click on product categories
- Products display correctly

✅ **Admin Login:**
- Go to https://modenlo.com/admin.html
- Log in with your new credentials
- Verify admin panel loads

✅ **Place Test Order:**
- Go to a product page
- Add item to cart
- Complete checkout
- Check if emails are received

✅ **Email Notifications:**
- Verify customer confirmation email
- Verify admin notification email
- Test download link in admin email

### Step 6.3: Check Logs

In hPanel → Node.js → Your Application:
- Click **View Logs** or **Application Logs**
- Check for any errors
- Verify server started successfully

---

## 🎉 Deployment Complete!

Your Modenlo site is now live at **https://modenlo.com**!

### Quick Links:
- 🏠 **Main Site:** https://modenlo.com
- 🛠️ **Frame Tool:** https://modenlo.com/framer.html
- 👨‍💼 **Admin Panel:** https://modenlo.com/admin.html
- 📊 **Admin Orders:** https://modenlo.com/admin-orders.html

---

## 📝 Post-Deployment Tasks

1. **Bookmark admin panel:** https://modenlo.com/admin.html
2. **Test all functionality** thoroughly
3. **Set up regular backups** through hPanel
4. **Monitor application logs** for first few days
5. **Keep credentials secure** - store in password manager

---

## 🔄 Future Updates

To update your site:

1. Make changes locally
2. Test locally with `npm start`
3. Upload changed files via FileZilla
4. If `server.js` or dependencies changed:
   - Restart application in hPanel Node.js panel
5. If `package.json` changed:
   - Run `npm install` again in hPanel

---

## 📞 Support

**Need Help?**
- Check `TROUBLESHOOTING.md` for common issues
- Check application logs in hPanel
- Contact Hostinger support for hosting-specific issues
- Review Node.js application settings in hPanel

---

## 🔒 Security Reminders

- ✅ Changed admin password from default
- ✅ Using environment variables (not hardcoded)
- ✅ SSL certificate installed and forced
- ✅ `.env` files NOT uploaded to server
- ✅ Session secret is random and secure
- ✅ Regular backups configured

**Congratulations on deploying Modenlo! 🎉**
