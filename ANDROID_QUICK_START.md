# 📱 ANDROID DEMO - QUICK START

## ✅ Setup Complete!

Your containers are now configured for mobile access.

**Your Mac IP:** `192.168.137.242`

---

## 🚀 Steps to Demo on Android (10 minutes)

### 1️⃣ Install Expo Go on Your Android Phone

**On your Android phone:**
1. Open **Google Play Store**
2. Search: **"Expo Go"**
3. Install the app
4. Open it (keep it open)

---

### 2️⃣ Connect to Same WiFi

**CRITICAL:** Your phone and Mac MUST be on the same WiFi network!

**Check Mac WiFi:**
```bash
networksetup -getairportnetwork en0
```

**Check Android WiFi:**
- Settings → WiFi → Check network name
- Must match Mac's WiFi!

---

### 3️⃣ Test Backend from Phone

**On your Android phone:**
1. Open **Chrome browser**
2. Go to: `http://192.168.137.242:5001/health`
3. Should see: `{"message": "Anthropometry API is running", "status": "ok"}`

**If it doesn't work:**
```bash
# On Mac, temporarily disable firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

---

### 4️⃣ Get Connection URL

**Option A: Use Expo DevTools (Easiest)**
```bash
# Open Expo DevTools in browser
open http://localhost:19000
```
- You'll see a QR code on screen
- Use Expo Go to scan it!

**Option B: Get URL Manually**
```bash
# Check frontend logs for connection URL
docker logs dsi-anthropometry-frontend 2>&1 | grep "exp://"
```

You'll see something like:
```
› Metro waiting on exp://192.168.137.242:19000
```

---

### 5️⃣ Connect from Expo Go App

**On your Android phone in Expo Go app:**

**Method 1: Scan QR Code**
1. Tap **"Scan QR Code"**
2. Scan the QR code from `http://localhost:19000`
3. App will start loading!

**Method 2: Enter URL Manually**
1. Tap **"Enter URL manually"**
2. Type: `exp://192.168.137.242:19000`
3. Press Go

---

### 6️⃣ Wait for App to Load

**You'll see:**
- "Opening project on Android..."
- "Downloading..."
- "Bundling..."
- Then your app appears! 🎉

**First load takes 30-60 seconds**

---

### 7️⃣ Demo the Full Workflow

**On your Android phone:**

1. **Register User**
   - Tap "Get Started"
   - Enter name, email, password
   - Select role (Doctor/Parent)
   - Register

2. **Add Child Profile**
   - Tap "Add Child" or "+"
   - Enter child details
   - Select date of birth
   - Choose gender
   - Save

3. **Take Measurement**
   - Open child profile
   - Tap "Take Measurement" or "Scan"
   - **Use Android camera** to take photo
   - Or upload existing image
   - Wait for processing

4. **View Results**
   - ML predictions appear
   - Height, weight estimates
   - WHO growth comparison
   - Nutritional status

---

### 8️⃣ Show Backend Processing

**On your Mac, show logs:**
```bash
# Watch backend processing requests
docker-compose logs -f backend
```

**You'll see:**
- POST requests from mobile (192.168.x.x)
- Image processing logs
- ML model predictions
- Response sent back

---

## 🎯 Demo Flow Summary

```
Android Phone (Expo Go)
    │
    │ 1. Loads app from Mac
    ▼
Mac Frontend Container (Port 19000)
    │ Serves React Native code
    │
    │ 2. User takes photo
    │ 3. Uploads to backend
    ▼
Mac Backend Container (Port 5001)
    │ Processes with ML model
    │
    │ 4. Stores in database
    ▼
Mac Database Container (Port 27018)
    │
    │ 5. Returns results
    ▼
Android Phone displays results
```

---

## 🐛 Troubleshooting

### Problem: QR Code Not Appearing

**Solution:**
```bash
# Check if DevTools is running
curl http://localhost:19000

# If not, restart frontend
docker-compose restart frontend
sleep 30
open http://localhost:19000
```

---

### Problem: "Unable to connect to Metro"

**Solution 1: Use Tunnel Mode**
```bash
# Stop frontend
docker-compose stop frontend

# Start with tunnel
docker-compose up -d frontend

# Tunnel mode bypasses network issues
```

**Solution 2: Check Firewall**
```bash
# Temporarily disable Mac firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# After demo, re-enable:
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

---

### Problem: "Network request failed"

**Solution:**
```bash
# Verify backend is accessible
curl http://192.168.137.242:5001/health

# Check containers are running
docker-compose ps

# Restart if needed
docker-compose restart backend
```

---

### Problem: App Crashes on Phone

**Solution:**
```bash
# Clear Expo cache
docker exec -it dsi-anthropometry-frontend npx expo start -c

# Or rebuild
docker-compose build frontend
docker-compose up -d frontend
```

---

## ✅ Quick Commands

```bash
# Check containers
docker-compose ps

# View frontend logs (for QR code/URL)
docker logs dsi-anthropometry-frontend

# View backend logs (watch requests)
docker-compose logs -f backend

# Restart everything
docker-compose restart

# Open DevTools
open http://localhost:19000

# Test backend from Mac
curl http://192.168.137.242:5001/health

# Check Mac IP
ifconfig | grep "inet " | grep -v 127.0.0.1
```

---

## 🎓 For Submission Demo

### What to Show:

1. **Docker containers running** on Mac
   ```bash
   docker-compose ps
   ```

2. **Expo DevTools** open in browser showing QR code

3. **Expo Go app** on Android phone

4. **Scan QR code** and app loading

5. **Native Android features:**
   - Camera access
   - Real-time image capture
   - Native UI components

6. **Backend processing** in terminal logs

7. **Results** displaying on phone screen

### Key Points to Emphasize:

- ✅ Backend running in Docker container on Mac
- ✅ Frontend served via Expo to mobile device
- ✅ Cross-platform React Native code
- ✅ Real Android camera integration
- ✅ API calls from phone to containerized backend
- ✅ Full native mobile experience
- ✅ Same codebase runs on web AND mobile

---

## 🎬 Your Setup is Ready!

**Current Status:**
- ✅ Containers running with mobile config
- ✅ Backend accessible at: `http://192.168.137.242:5001`
- ✅ Expo DevTools at: `http://localhost:19000`
- ✅ Ready for Android connection!

**Next:**
1. Install Expo Go on Android
2. Make sure same WiFi
3. Open `http://localhost:19000`
4. Scan QR code with Expo Go
5. Demo! 📱

---

**Need help?** Check `ANDROID_MOBILE_SETUP.md` for detailed troubleshooting!
