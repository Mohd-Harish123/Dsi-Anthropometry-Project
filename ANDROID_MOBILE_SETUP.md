# 📱 Android Mobile Demo Setup Guide

## Your Mac IP Address: `192.168.137.242`

---

## 🚀 Quick Setup for Android Demo

### Option 1: Expo Go (Recommended - 10 minutes)

#### Step 1: Install Expo Go on Android Phone
1. Open **Google Play Store** on your Android phone
2. Search for **"Expo Go"**
3. Install the app
4. Open it (you'll need it in Step 5)

---

#### Step 2: Stop Current Containers
```bash
cd /Users/aadityabhatia/DSI/app/Dsi-Anthropometry-Project
docker-compose down
```

---

#### Step 3: Update Environment for Mobile Access

**Create a new file:** `application/.env`

```bash
# Create .env file
cat > application/.env << 'EOF'
# Backend API URL - Use Mac IP for mobile access
EXPO_PUBLIC_API_URL=http://192.168.137.242:5001

# Firebase Configuration (use your actual values)
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EOF
```

---

#### Step 4: Update docker-compose.yml

Replace the frontend environment section:

```yaml
# In docker-compose.yml, change frontend environment to:
    environment:
      - EXPO_PUBLIC_API_URL=http://192.168.137.242:5001
      - EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
      - REACT_NATIVE_PACKAGER_HOSTNAME=192.168.137.242
```

---

#### Step 5: Rebuild and Start Containers
```bash
# Rebuild with new configuration
docker-compose build frontend

# Start all containers
docker-compose up -d

# Wait 30 seconds for Expo to start
sleep 30
```

---

#### Step 6: Get QR Code for Mobile
```bash
# Show Expo DevTools
open http://localhost:19000
```

OR

```bash
# Get direct QR code
docker logs dsi-anthropometry-frontend | grep -A 20 "QR code"
```

---

#### Step 7: Connect from Android Phone

**Make sure your phone and Mac are on the SAME WiFi network!**

1. Open **Expo Go** app on Android
2. Tap **"Scan QR Code"**
3. Scan the QR code from http://localhost:19000
4. App will load on your phone!

**Alternative:** Manual entry in Expo Go:
- Tap "Enter URL manually"
- Enter: `exp://192.168.137.242:19000`

---

## Option 2: Build Native APK (30 minutes)

If you want a standalone APK to install:

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Configure EAS Build
```bash
cd application
eas login
eas build:configure
```

### Step 3: Build Android APK
```bash
# Build APK (takes 10-15 minutes)
eas build --platform android --profile preview
```

### Step 4: Download and Install
- EAS will provide a download link
- Download APK to phone
- Install and run

---

## 🔧 Troubleshooting

### Issue: QR Code Not Working

**Solution 1:** Use Tunnel Mode
```bash
# Stop containers
docker-compose down

# Access frontend container and start with tunnel
docker-compose up -d
docker exec -it dsi-anthropometry-frontend npx expo start --tunnel
```

**Solution 2:** Check Same WiFi
```bash
# On Mac, check WiFi name
networksetup -getairportnetwork en0

# On Android: Settings → WiFi → Check network name
# Must be the same!
```

---

### Issue: Can't Connect to Backend

**Test backend accessibility from phone:**

On Android, open Chrome browser and visit:
```
http://192.168.137.242:5001/health
```

If it doesn't work:
1. **Check Mac Firewall:**
   ```bash
   # Temporarily disable firewall
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
   ```

2. **Allow ports through firewall:**
   ```bash
   # Allow port 5001
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/python3
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/bin/python3
   ```

---

### Issue: Metro Bundler Error

**Solution:**
```bash
# Clear Expo cache
docker exec -it dsi-anthropometry-frontend npx expo start -c
```

---

## 📱 Demo Flow on Android

Once connected via Expo Go:

1. **App loads on phone** (React Native native components!)
2. **Register user** → Data goes to Firebase
3. **Add child profile** → Stored in database
4. **Take photo with camera** → Real Android camera!
5. **Upload to backend** → Goes to `http://192.168.137.242:5001/predict`
6. **Backend processes** → ML model extracts measurements
7. **Results display** → Shows on phone screen

---

## 🎯 For Submission Demo

### What to Show:

1. **Docker containers running** on Mac:
   ```bash
   docker-compose ps
   ```

2. **QR Code on screen** from `http://localhost:19000`

3. **Expo Go app on Android** scanning QR code

4. **App loading** on physical device

5. **Full workflow** on mobile:
   - Register
   - Add child
   - Take photo with camera
   - Process image
   - Show results

6. **Backend logs** showing requests from mobile:
   ```bash
   docker-compose logs -f backend
   ```

### Key Points:
- ✅ Backend running in Docker on Mac
- ✅ Frontend served to mobile via Expo
- ✅ Mobile device communicates with containerized backend
- ✅ Real Android camera integration
- ✅ Full native mobile experience

---

## 📊 Architecture for Mobile Demo

```
┌─────────────────────────────────────────────────┐
│   Mac (192.168.137.242)                         │
│                                                 │
│   Docker Containers:                            │
│   ┌──────────────┐      ┌──────────────┐      │
│   │  Backend     │      │  Database    │      │
│   │  Port: 5001  │◄────►│  Port: 27018 │      │
│   └──────────────┘      └──────────────┘      │
│          ▲                                      │
│          │                                      │
│   ┌──────────────┐                            │
│   │  Frontend    │  Expo DevTools             │
│   │  Port: 19000 │  (Serves code)             │
│   └──────────────┘                            │
│          │                                      │
└──────────┼──────────────────────────────────────┘
           │
           │ WiFi (Same Network)
           │
           ▼
┌─────────────────────┐
│  Android Phone      │
│  Expo Go App        │
│  Loads from:        │
│  192.168.137.242    │
│                     │
│  Sends API calls:   │
│  192.168.137.242:5001│
└─────────────────────┘
```

---

## ⚡ Quick Start Commands

```bash
# 1. Your Mac IP (already know this)
echo "192.168.137.242"

# 2. Update and start containers
cd /Users/aadityabhatia/DSI/app/Dsi-Anthropometry-Project
docker-compose down

# Edit docker-compose.yml (update REACT_NATIVE_PACKAGER_HOSTNAME)
# Then:
docker-compose build frontend
docker-compose up -d

# 3. Get QR code
open http://localhost:19000

# 4. On Android: Open Expo Go → Scan QR code

# 5. Watch logs
docker-compose logs -f
```

---

## ✅ Success Checklist

- [ ] Expo Go installed on Android
- [ ] Mac and Android on same WiFi
- [ ] Docker containers running (`docker-compose ps`)
- [ ] Can access backend from phone browser (`192.168.137.242:5001/health`)
- [ ] QR code displayed (`http://localhost:19000`)
- [ ] Expo Go can scan and load app
- [ ] Camera works on mobile
- [ ] Image uploads to backend
- [ ] Results display on phone

---

**Your Mac IP: `192.168.137.242`**  
**Backend API: `http://192.168.137.242:5001`**  
**Expo DevTools: `http://localhost:19000`**

Ready to go mobile! 📱
