# DSI Anthropometry Project

A mobile application for measuring child anthropometric measurements (height, head circumference, and wrist circumference) using computer vision and machine learning.

## 🎯 Features

- **📸 Photo Capture**: Take photos using camera or select from gallery
- **🤖 AI-Powered Measurements**: Automatic detection of:
  - Height (cm)
  - Head Circumference (cm)
  - Wrist Circumference (cm)
- **🔐 User Authentication**: Secure login/signup with Firebase
- **💾 Data Storage**: Store measurements and images in Firebase
- **📊 Measurement History**: Track measurements over time
- **🌐 Cross-Platform**: Works on iOS and Android

## 🏗️ Tech Stack

### Frontend (Mobile App)
- React Native
- Expo
- TypeScript
- Firebase (Auth, Firestore, Storage)

### Backend (ML/CV)
- Python 3
- Flask (REST API)
- OpenCV (Computer Vision)
- MediaPipe (Pose Detection)
- NumPy

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+
- **Expo CLI**: `npm install -g expo-cli`
- **iOS Simulator** (macOS) or **Android Emulator** or **Physical Device**

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
./start.sh
```

This script will:
1. Install all dependencies
2. Set up Python virtual environment
3. Start the Python backend server
4. Launch the React Native app

### Option 2: Manual Setup

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

## 📖 Documentation

- [Complete Setup Guide](./SETUP_GUIDE.md) - Detailed installation and configuration
- [API Documentation](./application/ml_cv/README.md) - Python backend API reference

## 🎮 Usage

1. **Start the Backend Server:**
   ```bash
   cd application/ml_cv
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python api_server.py
   ```

2. **Start the Mobile App:**
   ```bash
   cd application
   npm install
   npm start
   ```

3. **Take Measurements:**
   - Login/Register in the app
   - Navigate to Home screen
   - Take or select a photo (must include 15cm scale)
   - Click "Generate Predictions"
   - View results

## 📸 Photo Requirements

For accurate measurements:
- ✅ Full body visible (head to feet)
- ✅ Include a 15cm scale/ruler
- ✅ Good lighting
- ✅ Subject standing straight
- ✅ Clear background

## 🔧 Configuration

### API Endpoint

Update the backend URL in `application/services/anthropometryApi.ts`:

```typescript
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:5000';
```

Find your IP:
- **macOS**: `ipconfig getifaddr en0`
- **Windows**: `ipconfig` (look for IPv4)
- **Linux**: `hostname -I`

### Firebase

Configure Firebase in `application/config/firebase.ts` with your project credentials.

## 📁 Project Structure

```
Dsi-Anthropometry-Project/
├── application/           # React Native app
│   ├── app/              # App screens
│   ├── components/       # Reusable components
│   ├── config/           # Firebase config
│   ├── services/         # API & database services
│   ├── ml_cv/            # Python ML backend
│   │   ├── 2.py         # Standalone measurement script
│   │   ├── child.py     # Measurement module
│   │   ├── api_server.py # Flask API server
│   │   └── requirements.txt
│   └── ...
├── SETUP_GUIDE.md        # Detailed setup instructions
└── start.sh              # Quick start script
```

## 🧪 Testing

### Test Python ML Module:
```bash
cd application/ml_cv
python 2.py test.jpg
```

### Test API Server:
```bash
curl -X GET http://localhost:5000/health
```

## 🐛 Troubleshooting

### Common Issues

**1. API Connection Error**
- Ensure Python server is running
- Check API_BASE_URL has correct IP
- Verify phone/emulator on same WiFi network

**2. "Pose landmarks not detected"**
- Ensure full body is visible
- Add clear 15cm scale to image
- Improve lighting conditions

**3. Permission Denied**
- Grant camera/photo permissions in device settings
- Try reinstalling the app

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for more troubleshooting tips.

## 📊 Firebase Setup

Required Firebase services:
- **Authentication** - User login/signup
- **Firestore Database** - Store measurements
- **Storage** - Store images

See [SETUP_GUIDE.md](./SETUP_GUIDE.md#firebase-configuration) for Firebase configuration.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is part of the DSI (Data Science Institute) program.

## 👥 Team

- Developer: [Your Team Name]
- Institution: DSI

## 📞 Support

For issues or questions:
1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. Review error messages in terminal
3. Check Firebase console for data/auth issues
4. Contact project maintainers

## 🎓 Acknowledgments

- MediaPipe for pose detection
- OpenCV for image processing
- Firebase for backend services
- Expo for React Native framework

---

**Note**: Ensure Python backend server is running before using the app features!
