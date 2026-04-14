# ✅ Production Deployment Checklist

Use this checklist before deploying Modenlo to Hostinger Business Hosting.

---

## 🔒 Security Configuration

### Admin Credentials
- [ ] Changed `ADMIN_USERNAME` from default "admin"
- [ ] Changed `ADMIN_PASSWORD` from default "admin123"
- [ ] Password is at least 12 characters long
- [ ] Password includes uppercase, lowercase, numbers, and symbols
- [ ] Credentials stored securely (password manager)

### Session Security
- [ ] Generated random `SESSION_SECRET` (32+ characters)
- [ ] Session secret is unique (not copied from example)
- [ ] Session secret stored in `.env.production`

### Environment Variables
- [ ] All sensitive data in environment variables (not hardcoded)
- [ ] `.env` files added to `.gitignore`
- [ ] `.env` files NOT uploaded to server
- [ ] Production environment variables prepared for hPanel

---

## 📧 Email Configuration

### Gmail Setup
- [ ] Gmail App Password obtained: `qdghzupmjoancpaq`
- [ ] `EMAIL_USER` set to: `prints.modenlo@gmail.com`
- [ ] `EMAIL_PASS` ready for hPanel
- [ ] `ADMIN_EMAIL` set to: `prints.modenlo@gmail.com`
- [ ] Test email sent successfully (run `node server/test-email.js`)

---

## 📁 File Preparation

### Files to Upload
- [ ] All `.html` files present
- [ ] All `.css` files present
- [ ] All `.js` files present
- [ ] `server/` folder complete
- [ ] `server/package.json` present
- [ ] `server/server.js` present
- [ ] `server/emailService.js` present
- [ ] `server/data/` folder with all JSON files
- [ ] `images/` folder with all images
- [ ] `logo/` folder present
- [ ] `uploads/` folder created (can be empty)

### Files to EXCLUDE (Do NOT Upload)
- [ ] `node_modules/` folder excluded
- [ ] `.env` files excluded
- [ ] `.env.production` file excluded
- [ ] `.gitignore` file excluded (optional to exclude)
- [ ] `.git/` folder excluded (if present)
- [ ] `test-*.js` files excluded
- [ ] Local development files excluded

---

## 🌐 Hostinger Setup

### Account Access
- [ ] Hostinger account accessible
- [ ] hPanel login working
- [ ] Domain `modenlo.com` visible in dashboard
- [ ] FTP credentials obtained
- [ ] Node.js section visible in hPanel

### FTP Client
- [ ] FileZilla installed and configured
- [ ] FTP connection tested successfully
- [ ] Upload directory identified (`public_html/` or similar)

---

## 🚀 Deployment Steps

### Pre-Upload
- [ ] Local testing complete (`npm start` works)
- [ ] All features tested locally
- [ ] Admin panel accessible locally
- [ ] Order placement works locally
- [ ] Emails sending locally

### Upload
- [ ] Files uploaded via FileZilla
- [ ] Upload completed without errors
- [ ] All folders transferred correctly
- [ ] `server/` folder structure intact on server

### hPanel Configuration
- [ ] Node.js application created in hPanel
- [ ] Application name: "Modenlo"
- [ ] Application mode: Production
- [ ] Application root: correct path
- [ ] Startup file: `server/server.js`
- [ ] All environment variables added:
  - [ ] `NODE_ENV=production`
  - [ ] `EMAIL_USER`
  - [ ] `EMAIL_PASS`
  - [ ] `ADMIN_EMAIL`
  - [ ] `ADMIN_USERNAME`
  - [ ] `ADMIN_PASSWORD`
  - [ ] `SESSION_SECRET`
  - [ ] `APP_URL=https://modenlo.com`
- [ ] Dependencies installed (`npm install`)
- [ ] Application started successfully
- [ ] Application status shows "Running"

### Domain & SSL
- [ ] Domain points to Node.js application
- [ ] SSL certificate installed
- [ ] HTTPS forced/enabled
- [ ] `https://modenlo.com` loads correctly

---

## 🧪 Testing

### Basic Functionality
- [ ] Landing page loads: `https://modenlo.com`
- [ ] All images display correctly
- [ ] Navigation works properly
- [ ] Product categories display
- [ ] Product pages load

### Interactive Features
- [ ] Frame tool works: `https://modenlo.com/framer.html`
- [ ] Image upload works
- [ ] Frame selection works
- [ ] Preview displays correctly
- [ ] Shopping cart functions

### Admin Features
- [ ] Admin login page loads: `https://modenlo.com/admin.html`
- [ ] Can log in with new credentials
- [ ] Admin dashboard displays
- [ ] Orders page accessible
- [ ] Product management works

### Order System
- [ ] Can add items to cart
- [ ] Checkout page loads
- [ ] Can complete order
- [ ] Customer receives confirmation email
- [ ] Admin receives notification email
- [ ] Download link in admin email works

### Email Testing
- [ ] Customer confirmation email received
- [ ] Email formatting correct
- [ ] Order details accurate
- [ ] Admin notification email received
- [ ] Download link functional
- [ ] Download link expires as expected

---

## 📊 Monitoring

### Application Health
- [ ] Application logs checked in hPanel
- [ ] No error messages in logs
- [ ] Server responding correctly
- [ ] Response times acceptable

### Post-Launch
- [ ] Admin panel bookmarked
- [ ] Backup schedule configured in hPanel
- [ ] Contact information updated (if needed)
- [ ] Documentation saved locally

---

## 🔄 Rollback Plan

### If Deployment Fails
- [ ] Know how to stop application in hPanel
- [ ] Can access application logs
- [ ] Can modify environment variables
- [ ] Can restart application
- [ ] Have local backup of all files
- [ ] Can re-upload files if needed

### Emergency Contacts
- [ ] Hostinger support contact info saved
- [ ] hPanel access credentials secure
- [ ] FTP access credentials backed up

---

## 📝 Documentation

### Created Files
- [ ] `.gitignore` created
- [ ] `.env.production` created and filled
- [ ] `HOSTINGER_DEPLOYMENT_GUIDE.md` read
- [ ] `TROUBLESHOOTING.md` available
- [ ] Admin credentials documented securely

### Knowledge Base
- [ ] Understand how to update site
- [ ] Know how to restart application
- [ ] Know where to find logs
- [ ] Know how to add environment variables
- [ ] Understand SSL renewal (automatic with Let's Encrypt)

---

## 🎯 Final Checks

### Before Going Live
- [ ] All checklist items completed
- [ ] Test order placed successfully
- [ ] All emails working
- [ ] No console errors in browser
- [ ] Mobile responsiveness checked
- [ ] All links working
- [ ] No broken images
- [ ] Contact information correct

### Post-Launch Monitoring
- [ ] Monitor for first 24 hours
- [ ] Check logs daily for first week
- [ ] Watch for error emails
- [ ] Test order flow weekly
- [ ] Backup data regularly

---

## ✨ When All Complete

**Congratulations!** 🎉

Your Modenlo site is successfully deployed to production at **https://modenlo.com**

Keep this checklist for future reference and updates!

---

## 🔗 Quick Reference Links

- **Main Site:** https://modenlo.com
- **Admin Panel:** https://modenlo.com/admin.html
- **hPanel:** https://hpanel.hostinger.com
- **Hostinger Support:** https://www.hostinger.com/contact

**Last Updated:** Use this checklist each time you deploy updates!
