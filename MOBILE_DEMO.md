# 📱 Mobile Demo with Expo Go

## Setup (One Time)
1. Install **Expo Go** app on Android from Play Store
2. Connect phone and Mac to **same WiFi network**

## Run Commands

```bash
# Start containers
docker-compose up -d

# Wait 20 seconds, then view QR code in logs
docker logs dsi-anthropometry-frontend --tail=40

The QR code points to: exp://192.168.137.242:8081
```

## Connect Mobile
1. **QR code is shown in the terminal above** ⬆️
2. Open **Expo Go** app on phone
3. Tap **"Scan QR Code"**
4. Scan the QR code from terminal
5. App loads on phone

## Done! 🎉
