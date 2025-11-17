#!/bin/bash

# Setup Script for DSI Anthropometry Project
# This script installs all required dependencies

echo "=================================="
echo "DSI Anthropometry Project Setup"
echo "=================================="
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Navigate to ml_cv directory
cd "$(dirname "$0")/application/ml_cv" || exit

echo "📦 Installing Python dependencies..."
echo ""

# Check if pip is available
if ! python3 -m pip --version &> /dev/null; then
    echo "❌ pip is not installed. Installing pip..."
    python3 -m ensurepip --default-pip
fi

# Install required packages
echo "Installing Flask and other dependencies..."
python3 -m pip install --user flask==3.0.0 flask-cors==4.0.0

echo "Installing OpenCV..."
python3 -m pip install --user opencv-python==4.10.0.84

echo "Installing MediaPipe..."
python3 -m pip install --user mediapipe==0.10.9

echo "Installing NumPy..."
python3 -m pip install --user numpy==1.26.4

echo ""
echo "✅ Python dependencies installed successfully!"
echo ""

# Navigate back to application directory
cd ..

echo "📱 Installing Node.js dependencies..."
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm."
    exit 1
fi

npm install

echo ""
echo "✅ Node.js dependencies installed successfully!"
echo ""

echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the Python backend:"
echo "   cd application/ml_cv"
echo "   python3 api_server.py"
echo ""
echo "2. In a new terminal, start the React Native app:"
echo "   cd application"
echo "   npm start"
echo ""
echo "3. Follow the QUICK_START_GUIDE.md for usage instructions"
echo ""
