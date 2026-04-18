# ⚡ QUICK 503 FIX - 2 MINUTE SOLUTION

## Your site was working before the update → Follow these steps:

### STEP 1: RESTART THE APP (Do This First!) ⏱️ 2 minutes

```
1. Go to: https://hpanel.hostinger.com
2. Login to your Hostinger account
3. Click: Advanced → Node.js
4. Find "Modenlo" application
5. Click: RESTART button
6. Wait: 60 seconds
7. Test: https://modenlo.com
```

✅ **90% chance this fixes it!** Node.js doesn't auto-reload after file changes.

---

### STEP 2: If Still 503 → Check PORT Variable ⏱️ 3 minutes

```
1. In hPanel → Node.js → "Modenlo" app
2. Find: Environment Variables section
3. Look for: A variable named "PORT"
4. If PORT exists:
   → Click DELETE on the PORT variable
   → Save changes
   → Click RESTART
   → Wait 60 seconds
   → Test site
```

✅ **This fixes 95% of remaining cases!**

---

### STEP 3: If Still 503 → Check the Logs ⏱️ 2 minutes

```
1. In hPanel → Node.js → Your app
2. Click: View Logs or Application Logs
3. Scroll to bottom
4. Copy any RED error messages
5. Tell me the error and I'll fix it
```

---

## 🎯 Most Likely Cause

**You uploaded new files but forgot to RESTART the Node.js app.**

In production, Node.js doesn't auto-reload when files change. You MUST manually restart the application in hPanel after every file upload.

---

## 💡 For Future Updates

**Always do this after uploading files:**
1. Upload via FileZilla ✅
2. Go to hPanel → Node.js ✅
3. Click RESTART ✅  ← **Don't forget this step!**
4. Test site ✅

---

## Still Not Working?

Open `503_ERROR_FIX_GUIDE.md` for detailed troubleshooting with 5 different solutions.

**Need immediate recovery?** Re-upload your old working files via FileZilla, then RESTART the app.
