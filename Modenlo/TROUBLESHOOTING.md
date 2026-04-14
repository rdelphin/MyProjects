# 🔧 Troubleshooting Guide - Hostinger Deployment

Common issues and solutions for deploying Modenlo on Hostinger Business Hosting.

---

## 🚨 Application Won't Start

### Issue: Application status shows "Stopped" or "Failed"

**Possible Causes & Solutions:**

#### 1. Incorrect Startup File Path
**Symptoms:** Application fails immediately after starting

**Solution:**
- Check in hPanel → Node.js → Your Application
- Startup file should be: `server/server.js`
- If you uploaded to `public_html/`, path is: `server/server.js`
- If in subfolder, adjust path accordingly

#### 2. Dependencies Not Installed
**Symptoms:** Error about missing modules in logs

**Solution:**
```bash
# In hPanel Node.js panel:
1. Click "npm install" or "Install Dependencies"
2. Wait for completion (2-3 minutes)
3. Check for errors in installation log
4. Restart application
```

#### 3. Port Configuration Issue
**Symptoms:** "Port already in use" or port binding error

**Solution:**
- Hostinger assigns ports automatically
- Make sure `PORT` environment variable is NOT set (or empty)
- Server code uses: `process.env.PORT || 3000`
- Restart application after removing PORT variable

#### 4. Missing Environment Variables
**Symptoms:** Application starts but features don't work

**Solution:**
- Check all environment variables are set:
  ```
  NODE_ENV=production
  EMAIL_USER=prints.modenlo@gmail.com
  EMAIL_PASS=qdghzupmjoancpaq
  ADMIN_EMAIL=prints.modenlo@gmail.com
  ADMIN_USERNAME=[your_username]
  ADMIN_PASSWORD=[your_password]
  SESSION_SECRET=[your_secret]
  APP_URL=https://modenlo.com
  ```
- Save each variable
- Restart application

---

## 🌐 Website Not Loading

### Issue: Domain shows error or doesn't load

**Possible Causes & Solutions:**

#### 1. Domain Not Pointed to Application
**Symptoms:** Default Hostinger page or 404 error

**Solution:**
1. Go to hPanel → Domains
2. Click on modenlo.com
3. Find "Node.js Application" or "Website" setting
4. Select your "Modenlo" application
5. Save and wait 5-10 minutes for propagation

#### 2. Application Not Running
**Symptoms:** "502 Bad Gateway" or "Service Unavailable"

**Solution:**
1. Go to hPanel → Node.js
2. Check application status
3. If stopped, click "Start"
4. If failed, check logs for errors
5. Fix errors and restart

#### 3. SSL Certificate Issues
**Symptoms:** "Not Secure" warning or SSL errors

**Solution:**
1. Go to hPanel → Security → SSL
2. Click "Install SSL" for modenlo.com
3. Wait for installation
4. Enable "Force HTTPS"
5. Clear browser cache and retry

#### 4. DNS Propagation Delay
**Symptoms:** Site works on some devices but not others

**Solution:**
- Wait 24-48 hours for full DNS propagation
- Try accessing via different networks
- Clear DNS cache:
  ```bash
  # Windows:
  ipconfig /flushdns
  
  # Mac:
  sudo dscacheutil -flushcache
  ```

---

## 📧 Emails Not Sending

### Issue: Order emails not received

**Possible Causes & Solutions:**

#### 1. Email Variables Not Set
**Symptoms:** Orders go through but no emails

**Solution:**
- Verify environment variables in hPanel:
  ```
  EMAIL_USER=prints.modenlo@gmail.com
  EMAIL_PASS=qdghzupmjoancpaq
  ADMIN_EMAIL=prints.modenlo@gmail.com
  ```
- Restart application after setting
- Test with new order

#### 2. Gmail App Password Invalid
**Symptoms:** Email errors in logs, "Authentication failed"

**Solution:**
1. Go to https://myaccount.google.com/apppasswords
2. Delete old app password
3. Generate new app password
4. Update `EMAIL_PASS` in hPanel
5. Restart application

#### 3. Gmail Security Block
**Symptoms:** Emails work locally but not on server

**Solution:**
1. Check Gmail Security: https://myaccount.google.com/security
2. Review recent security activity
3. Allow access if blocked
4. Consider using 2-Step Verification
5. Generate new app password

#### 4. Port 587/465 Blocked
**Symptoms:** Timeout errors in logs

**Solution:**
- Contact Hostinger support
- Ask if SMTP ports are open
- May need to whitelist server IP
- Consider using Hostinger's SMTP if ports blocked

---

## 🔐 Admin Panel Issues

### Issue: Cannot log in to admin panel

**Possible Causes & Solutions:**

#### 1. Using Wrong Credentials
**Symptoms:** "Invalid credentials" error

**Solution:**
- Check environment variables in hPanel
- Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- Remember: credentials were changed from defaults
- Check `.env.production` file for what you set
- Update in hPanel if needed

#### 2. Session Issues
**Symptoms:** Login succeeds but immediately logs out

**Solution:**
- Check `SESSION_SECRET` is set in hPanel
- SESSION_SECRET must be 32+ characters
- Restart application after setting
- Clear browser cookies
- Try incognito/private window

#### 3. CORS Issues
**Symptoms:** Login fails with network error

**Solution:**
- Check browser console for CORS errors
- Verify APP_URL matches your domain:
  ```
  APP_URL=https://modenlo.com
  ```
- Ensure using HTTPS (not HTTP)
- Restart application

---

## 📁 File Upload Issues

### Issue: Cannot upload images or mounts

**Possible Causes & Solutions:**

#### 1. Uploads Directory Missing
**Symptoms:** "Failed to save" errors

**Solution:**
1. Via FileZilla, create directory:
   - `uploads/mounts/`
2. Set permissions:
   - Right-click → File Permissions
   - Set to 755 or 775
3. Restart application

#### 2. File Size Limit Exceeded
**Symptoms:** Large images fail to upload

**Solution:**
- Current limit: 5MB per file
- Reduce image size before uploading
- Use image compression tool
- If needed, adjust in `server.js` (requires code change)

#### 3. Write Permission Denied
**Symptoms:** "Permission denied" errors in logs

**Solution:**
1. In FileZilla, check folder permissions
2. Set `uploads/` to 755 or 775
3. Set subfolders to same permissions
4. Contact Hostinger if persists

---

## 🗃️ Data Not Persisting

### Issue: Orders or products not saving

**Possible Causes & Solutions:**

#### 1. Data Files Missing
**Symptoms:** Fresh install appears each time

**Solution:**
1. Check via FileZilla that `server/data/` contains:
   - `frames.json`
   - `mounts.json`
   - `orders.json`
   - `downloads.json`
   - `categories.json`
   - `clocks.json`
2. Upload missing files
3. Set permissions to 644

#### 2. Write Permission Issues
**Sympt:** Can read data but can't save changes

**Solution:**
1. Check `server/data/` folder permissions
2. Set folder to 755
3. Set .json files to 644
4. Restart application

#### 3. JSON File Corruption
**Symptoms:** Specific data type not loading

**Solution:**
1. Download affected .json file via FileZilla
2. Validate JSON syntax: https://jsonlint.com
3. Fix syntax errors
4. Re-upload corrected file
5. Restart application

---

## 🔍 Viewing Application Logs

### How to Check Logs in hPanel

1. Go to hPanel
2. Navigate to **Node.js** section
3. Click on your "Modenlo" application
4. Look for **Logs** or **View Logs** button
5. Check for errors or warnings

### Common Log Messages

**Normal:**
```
Modenlo API server running on port 3000
Landing Page: http://localhost:3000/
```

**Warning (OK if changed):**
```
⚠️  WARNING: Using default admin password!
```
- Expected after you set ADMIN_PASSWORD in hPanel

**Error - Missing Variable:**
```
ERROR: EMAIL_USER is not defined
```
- Add missing environment variable

**Error - File Not Found:**
```
Error reading frames data: ENOENT
```
- Check `server/data/` folder exists and has files

---

## 🐌 Slow Performance

### Issue: Site loads slowly

**Possible Solutions:**

#### 1. Optimize Images
- Compress images before uploading
- Use appropriate image sizes
- Consider using WebP format

#### 2. Check Resource Usage
- In hPanel, check resource usage graphs
- If hitting limits, consider upgrade
- Optimize code if needed

#### 3. Enable Caching
- Check if Hostinger caching is available
- Enable static file caching in hPanel
- Consider CDN for images

---

## 🔄 After Making Changes

### Issue: Changes not appearing after update

**Solution:**

#### 1. Restart Application
```
hPanel → Node.js → Your Application → Restart
```

#### 2. Clear Browser Cache
```
Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
```

#### 3. Check File Upload
- Verify files uploaded successfully via FileZilla
- Check file timestamps match local files

#### 4. Reinstall Dependencies (if package.json changed)
```
hPanel → Node.js → Run npm install
```

---

## 📞 Still Having Issues?

### Contact Points

**1. Check Documentation**
- Review `HOSTINGER_DEPLOYMENT_GUIDE.md`
- Review `PRODUCTION_CHECKLIST.md`
- Check application logs first

**2. Hostinger Support**
- 24/7 Live Chat: https://www.hostinger.com/contact
- Submit ticket through hPanel
- Include: Application logs, error messages, steps to reproduce

**3. Common Support Questions to Ask:**
- "Is Node.js enabled for my hosting plan?"
- "Are SMTP ports (587/465) open?"
- "Can you check my Node.js application logs?"
- "What are the resource limits for my plan?"

---

## 🛠️ Quick Diagnostic Commands

If you have terminal access in hPanel:

```bash
# Check if Node.js is installed
node --version

# Check if npm is installed
npm --version

# Check application status
pm2 status

# View live logs
pm2 logs

# Restart application
pm2 restart all
```

---

## ✅ Prevention Checklist

To avoid common issues:

- [ ] Always test locally before deploying
- [ ] Keep backups of data files
- [ ] Document all environment variables
- [ ] Monitor logs regularly
- [ ] Test after every deployment
- [ ] Keep credentials secure
- [ ] Update dependencies regularly

---

## 🔗 Useful Resources

- **Hostinger Knowledge Base:** https://support.hostinger.com
- **Node.js Hosting Guide:** Search "Hostinger Node.js" in their docs
- **hPanel Guide:** https://support.hostinger.com/en/collections/1595155-hpanel
- **SSL Guide:** https://support.hostinger.com/en/articles/1583278-how-to-install-ssl

---

**Remember:** Most issues are resolved by:
1. Checking application logs
2. Verifying environment variables
3. Restarting the application
4. Clearing browser cache

Good luck! 🚀

