# ⚡ QUICK FIX - API 404 Error

## 🚨 Your Issue
`https://modenlo.com/api/health` returns **404 Not Found**

## ✅ The Solution (10 Minutes)

### Step 1: Upload .htaccess (5 min)
1. Open **FileZilla**
2. Connect to Hostinger FTP
3. Go to remote folder: `public_html/`
4. Enable: **Server → Force showing hidden files**
5. Drag `.htaccess` from local `e:\MyProjects\Modenlo\` to `public_html/`

### Step 2: Restart Node.js App (2 min)
1. Login to **Hostinger hPanel**
2. Go to **Advanced → Node.js**
3. Click **"Restart Application"**
4. Wait for status: **"Running"**

### Step 3: Test (3 min)
Open in browser: `https://modenlo.com/api/health`

**Expected**: 
```json
{"success":true,"message":"API is running",...}
```

**If you see JSON** → ✅ FIXED! Test your checkout.  
**If still 404** → See troubleshooting below.

---

## 🧪 Quick Tests

After fix, test these in order:

1. ✅ **Health Check**: https://modenlo.com/api/health  
   → Should return JSON (not 404)

2. ✅ **Website**: https://modenlo.com  
   → Should load normally

3. ✅ **Place Order**: Complete a test checkout  
   → Should process without "Failed to fetch" error

---

## 🐛 Still Not Working?

### Quick Checks:

**1. Verify .htaccess uploaded:**
- FTP → `public_html/`
- Enable "Show hidden files"
- See `.htaccess` file listed

**2. Verify Node.js settings:**
- hPanel → Node.js
- Application Root: `public_html`
- Startup File: `server/server.js`

**3. Check application status:**
- hPanel → Node.js
- Status must be: "Running"
- If stopped, click "Start"

**4. Check logs:**
- hPanel → Node.js → View Logs
- Look for errors

**5. Apache modules** (may need Hostinger support):
- `mod_rewrite` - required
- `mod_proxy` - required
- `mod_proxy_http` - required

---

## 📞 Get Help

**Detailed Guide**: Read `API_404_FIX_DEPLOYMENT.md`  
**Hostinger Support**: 24/7 chat at hostinger.com/contact  
**Application Logs**: hPanel → Node.js → View Logs

---

## 🎯 What This Does

**Before:**
```
modenlo.com/api/health → Apache → 404 ❌
```

**After:**
```
modenlo.com/api/health → Apache → .htaccess → Node.js → ✅
```

The `.htaccess` file tells Apache to route ALL requests (including `/api/*`) to your Node.js application.

---

## ✅ Success Indicators

You'll know it's working when:
1. Health endpoint returns JSON
2. Checkout processes orders
3. No "Failed to fetch" errors
4. Emails are sent

---

**Need more details?** → Read `API_404_FIX_DEPLOYMENT.md`
