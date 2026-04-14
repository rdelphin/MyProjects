# 📦 Hostinger Deployment Package - Quick Start

**Your complete deployment package for modenlo.com on Hostinger Business Hosting**

---

## 🚀 Quick Start (5 Minutes to Get Started)

### Step 1: Update Your Credentials (2 min)
Open `.env.production` and fill in:
```env
ADMIN_USERNAME=your_choice
ADMIN_PASSWORD=your_secure_password_12+_chars
SESSION_SECRET=generate_32_random_characters
```

**Generate session secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Get Your FTP Info (2 min)
1. Log in to Hostinger → hPanel
2. Go to **Files** → **FTP Accounts**
3. Note down:
   - FTP Host
   - FTP Username
   - FTP Password
   - Upload directory path

### Step 3: Read the Main Guide (1 min)
Open `HOSTINGER_DEPLOYMENT_GUIDE.md` and follow Phase 1-6

---

## 📚 Documentation Files Created

### 1. **HOSTINGER_DEPLOYMENT_GUIDE.md** ⭐ START HERE
Complete step-by-step deployment instructions
- FTP setup with FileZilla
- File upload process
- hPanel configuration
- Environment variables setup
- Domain & SSL configuration
- Testing procedures

### 2. **PRODUCTION_CHECKLIST.md**
Interactive checklist to ensure nothing is missed
- Security configuration
- Email setup verification
- File preparation
- Deployment steps
- Testing procedures

### 3. **TROUBLESHOOTING.md**
Solutions for common issues
- Application won't start
- Website not loading
- Emails not sending
- Admin panel issues
- File upload problems
- View logs guide

### 4. **.env.production**
Template for environment variables
- Fill this out before deploying
- DO NOT upload to server
- Use values in hPanel instead

### 5. **.gitignore**
Protects sensitive files from being uploaded/committed
- Excludes node_modules
- Excludes .env files
- Excludes development files

---

## 🔧 Configuration Files Ready

### Updated Files:
✅ **server/server.js** - Production-ready with:
- Environment variable support for admin credentials
- Dynamic CORS configuration
- Security warnings for default passwords
- Port configuration for shared hosting

### New Files:
✅ **.gitignore** - Prevents uploading sensitive files
✅ **.env.production** - Environment variables template
✅ **HOSTINGER_DEPLOYMENT_GUIDE.md** - Complete guide
✅ **PRODUCTION_CHECKLIST.md** - Step-by-step checklist
✅ **TROUBLESHOOTING.md** - Problem solving guide

---

## 📋 Pre-Deployment Checklist (Do These First!)

- [ ] Fill in `.env.production` with your credentials
- [ ] Generate secure SESSION_SECRET (32+ characters)
- [ ] Download FileZilla: https://filezilla-project.org/
- [ ] Have Hostinger hPanel login ready
- [ ] Gmail app password ready: `qdghzupmjoancpaq`
- [ ] Read HOSTINGER_DEPLOYMENT_GUIDE.md

---

## 🎯 Deployment Phases Overview

**Phase 1: Prepare Locally** (5 min)
- Update credentials in `.env.production`
- Verify all files present
- Test locally one final time

**Phase 2: Get FTP Access** (5 min)
- Log into Hostinger hPanel
- Get FTP credentials
- Identify upload directory

**Phase 3: Upload via FileZilla** (10 min)
- Configure FileZilla connection
- Upload all files EXCEPT node_modules and .env files
- Verify upload complete

**Phase 4: Configure in hPanel** (15 min)
- Create Node.js application
- Set environment variables
- Install dependencies
- Start application

**Phase 5: Domain & SSL** (5 min)
- Point domain to application
- Install SSL certificate
- Enable HTTPS

**Phase 6: Testing** (10 min)
- Access https://modenlo.com
- Test all features
- Place test order
- Verify emails

**Total Time: ~50 minutes**

---

## 🔑 Environment Variables to Set in hPanel

Copy these into hPanel → Node.js → Environment Variables:

```
NODE_ENV=production
EMAIL_USER=prints.modenlo@gmail.com
EMAIL_PASS=qdghzupmjoancpaq
ADMIN_EMAIL=prints.modenlo@gmail.com
ADMIN_USERNAME=[your_username_from_.env.production]
ADMIN_PASSWORD=[your_password_from_.env.production]
SESSION_SECRET=[your_secret_from_.env.production]
APP_URL=https://modenlo.com
```

**Note:** Do NOT set PORT variable - Hostinger assigns it automatically

---

## 📁 Files to Upload via FileZilla

### ✅ Upload These:
- All `.html` files
- All `.css` files  
- All `.js` files (except test files)
- `server/` folder (entire folder)
- `images/` folder (entire folder)
- `logo/` folder
- `uploads/` folder (create if missing)

### ❌ Do NOT Upload:
- `node_modules/` folder
- `.env` files
- `.env.production`
- `.git/` folder
- `test-*.js` files
- Documentation .md files (optional)

---

## 🎉 After Deployment

### Your Live URLs:
- **Main Site:** https://modenlo.com
- **Admin Panel:** https://modenlo.com/admin.html
- **Orders Management:** https://modenlo.com/admin-orders.html
- **Frame Tool:** https://modenlo.com/framer.html

### Post-Launch Tasks:
1. Bookmark admin panel
2. Test all functionality
3. Place test order and verify emails
4. Set up regular backups in hPanel
5. Monitor logs for first 24 hours

---

## 🆘 Need Help?

### Quick Troubleshooting:
1. **Site not loading?** 
   - Check hPanel → Node.js → Application Status
   - See TROUBLESHOOTING.md "Website Not Loading"

2. **Emails not working?**
   - Check environment variables in hPanel
   - See TROUBLESHOOTING.md "Emails Not Sending"

3. **Can't login to admin?**
   - Verify ADMIN_USERNAME and ADMIN_PASSWORD in hPanel
   - See TROUBLESHOOTING.md "Admin Panel Issues"

### Support Channels:
- **Documentation:** Read TROUBLESHOOTING.md first
- **Logs:** hPanel → Node.js → Your App → Logs
- **Hostinger Support:** 24/7 chat at https://www.hostinger.com/contact

---

## 📊 Deployment Status Tracker

Use this to track your progress:

```
[ ] Phase 1: Local Preparation Complete
[ ] Phase 2: FTP Credentials Obtained  
[ ] Phase 3: Files Uploaded to Hostinger
[ ] Phase 4: hPanel Configuration Done
[ ] Phase 5: Domain & SSL Configured
[ ] Phase 6: Testing Passed
[ ] 🎉 LIVE ON https://modenlo.com
```

---

## 🔒 Security Reminders

✅ **DONE:**
- Server configured to use environment variables
- Default passwords eliminated
- CORS configured for production
- Session secrets supported
- Warning messages for insecure configs

✅ **YOU MUST DO:**
- Change admin credentials from defaults
- Generate secure session secret
- Never commit .env files
- Use HTTPS only (SSL certificate)
- Store credentials in password manager

---

## 💡 Pro Tips

1. **Before Uploading:**
   - Test everything locally with `cd server && npm start`
   - Open http://localhost:3000

2. **During Upload:**
   - Watch FileZilla progress bar
   - Verify no errors in queue
   - Check file counts match

3. **After Deployment:**
   - Clear browser cache (Ctrl+F5)
   - Try incognito mode first
   - Check logs immediately
   - Test on mobile device too

4. **Maintenance:**
   - Check logs weekly
   - Test orders monthly
   - Backup data regularly
   - Keep dependencies updated

---

## 📞 Your Deployment Checklist

Ready to deploy? Check these off:

- [ ] I have Hostinger Business Web Hosting ✓
- [ ] I have domain modenlo.com ✓
- [ ] I have filled in `.env.production`
- [ ] I have FileZilla installed
- [ ] I have read HOSTINGER_DEPLOYMENT_GUIDE.md
- [ ] I have my hPanel login ready
- [ ] I understand not to upload node_modules
- [ ] I understand not to upload .env files
- [ ] I'm ready to set environment variables in hPanel
- [ ] I have 50 minutes to complete deployment

**All checked?** → Start with HOSTINGER_DEPLOYMENT_GUIDE.md Phase 1! 🚀

---

## 🎊 Success!

When you see your site at https://modenlo.com:

1. ✅ Take a screenshot
2. ✅ Test place an order
3. ✅ Verify emails received
4. ✅ Bookmark admin panel
5. ✅ Celebrate! 🎉

**Your Modenlo custom frame and print shop is now LIVE!**

---

## 📁 Quick File Reference

```
Modenlo/
├── 📘 HOSTINGER_DEPLOYMENT_GUIDE.md    ← Complete deployment guide
├── ✅ PRODUCTION_CHECKLIST.md          ← Interactive checklist
├── 🔧 TROUBLESHOOTING.md               ← Problem solving
├── 📦 DEPLOYMENT_SUMMARY.md            ← This file (overview)
├── 🔒 .env.production                  ← Fill this out (don't upload)
├── 🚫 .gitignore                       ← Protection from mistakes
├── 🌐 index.html                       ← Upload ✓
├── 📁 server/                          ← Upload entire folder ✓
│   ├── server.js                       ← Production ready ✓
│   ├── package.json                    ← Upload ✓
│   ├── emailService.js                 ← Upload ✓
│   └── data/                           ← Upload ✓
├── 📁 images/                          ← Upload ✓
├── 📁 logo/                            ← Upload ✓
└── 📁 uploads/                         ← Upload (or create on server)
```

---

**Ready? Let's deploy! Start with HOSTINGER_DEPLOYMENT_GUIDE.md** 🚀
