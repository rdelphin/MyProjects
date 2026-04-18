# 🔍 How to Find Your Node.js Port on Hostinger

This guide will help you locate the port number your Node.js application is running on in Hostinger.

---

## 📋 Method 1: Check hPanel (Recommended)

### **Step 1: Log in to Hostinger**
1. Go to [hostinger.com](https://hostinger.com)
2. Log in to your account
3. Navigate to your hosting plan

### **Step 2: Access Node.js Settings**
1. In hPanel, look for the **"Advanced"** or **"Website"** section
2. Click on **"Node.js"** or **"Node.js App"**
3. You should see your application listed (e.g., "Modenlo")

### **Step 3: Find the Port**
Look for one of these indicators:

#### **Option A: Port Number Displayed**
- Some versions of hPanel show: **"Port: 3000"** or similar
- This is your port number!

#### **Option B: Application URL**
- Shows something like: `http://localhost:20045`
- The number after the colon (20045) is your port

#### **Option C: Application Details**
- Click on your application name
- Look for **"Application Settings"** or **"Details"**
- Port should be listed there

### **Common Hostinger Ports:**
- **3000** - Default Node.js port
- **20000-20099** - Common range for Hostinger Business Hosting
- **40000-40099** - Alternative port range
- **3001-3010** - Sometimes used if 3000 is taken

---

## 📋 Method 2: Check Application Logs

### **Step 1: Access Application Logs**
1. In hPanel → Node.js → Your Application
2. Look for **"Logs"** or **"View Logs"** button
3. Check the startup logs

### **Step 2: Look for Port in Logs**
Your server logs should show something like:
```
Modenlo API server running on port 3000
```
or
```
Server started on port 20045
```

The number is your port!

---

## 📋 Method 3: Test Common Ports

If you can't find the port in hPanel, try testing these URLs directly in your browser:

### **Test These URLs:**
1. `https://modenlo.com:3000/api/health`
2. `https://modenlo.com:20000/api/health`
3. `https://modenlo.com:20045/api/health`
4. `https://modenlo.com:40000/api/health`

**If you see a JSON response like this:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-04-18T06:23:00.000Z"
}
```

**That's your port!** The number in the URL you tested.

---

## 📋 Method 4: SSH/Terminal Access (Advanced)

If you have SSH access to your Hostinger server:

### **Check Running Node.js Processes:**
```bash
ps aux | grep node
```

Look for lines like:
```
user  12345  node server/server.js
```

### **Check Listening Ports:**
```bash
netstat -tuln | grep node
```

or

```bash
lsof -i -P -n | grep node
```

Look for:
```
node    12345  user   TCP *:20045 (LISTEN)
```

The number (20045) is your port!

---

## 🎯 What to Do Once You Find Your Port

### **If Your Port is 3000:**
Use **`.htaccess.HOSTINGER_AUTO`** - it should work as-is!

### **If Your Port is Different (e.g., 20045):**
1. Use **`.htaccess.HOSTINGER_PORT`**
2. Edit the file
3. Find the line: `RewriteRule .* - [E=NODEJS_PORT:XXXXX]`
4. Replace `XXXXX` with your port number: `RewriteRule .* - [E=NODEJS_PORT:20045]`
5. Save the file

---

## ❓ Still Can't Find the Port?

### **Contact Hostinger Support:**

They can tell you:
- What port your Node.js app is running on
- Whether Node.js is properly configured
- Any special configuration needed for your hosting plan

**Support Options:**
- 24/7 Live Chat: https://www.hostinger.com/contact
- Submit ticket through hPanel
- Check Hostinger Knowledge Base

**What to Ask:**
> "I have a Node.js application deployed on my hosting. What port is it running on, and how can I access the API endpoints?"

---

## 🔧 Troubleshooting

### **Issue: Can't access Node.js section in hPanel**
- **Solution**: Node.js might not be enabled for your plan
- Contact Hostinger to enable Node.js support
- Upgrade to Business Hosting if on shared hosting

### **Issue: No port number shown anywhere**
- **Solution**: Your Node.js app might not be running
- Check application status in hPanel
- Click "Start" or "Restart" if stopped
- Check logs for any startup errors

### **Issue: Port changes after restart**
- **Solution**: Hostinger may assign dynamic ports
- Use environment variable in your server code: `process.env.PORT || 3000`
- This ensures your app uses whatever port Hostinger assigns

---

## ✅ Verification

Once you have your port, verify it works:

1. **Test the health endpoint:**
   ```
   https://modenlo.com:PORT/api/health
   ```
   Replace PORT with your number

2. **Should see JSON:**
   ```json
   {
     "success": true,
     "message": "API is running"
   }
   ```

3. **If you see this, you found the right port!** ✅

Now proceed to use that port in your `.htaccess.HOSTINGER_PORT` configuration.

---

## 📝 Quick Reference

| Method | Difficulty | Success Rate |
|--------|-----------|--------------|
| hPanel Node.js Section | Easy | ⭐⭐⭐⭐⭐ |
| Application Logs | Easy | ⭐⭐⭐⭐ |
| URL Testing | Medium | ⭐⭐⭐ |
| SSH Access | Hard | ⭐⭐⭐⭐⭐ |
| Contact Support | Easy | ⭐⭐⭐⭐⭐ |

**Best bet:** Try hPanel first, then contact support if stuck!
