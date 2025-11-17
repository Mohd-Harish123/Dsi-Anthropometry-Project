#!/bin/bash

# Quick Start Script for Child Anthropometry App
# This script helps you set up and run both the Python backend and React Native app

set -e  # Exit on error

echo "============================================================"
echo "🚀 Child Anthropometry App - Quick Start"
echo "============================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$SCRIPT_DIR/application"
ML_DIR="$APP_DIR/ml_cv"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    echo "Please install Python 3.8 or higher from https://python.org"
    exit 1
else
    echo -e "${GREEN}✅ Python 3 found:${NC} $(python3 --version)"
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
else
    echo -e "${GREEN}✅ Node.js found:${NC} $(node --version)"
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ npm found:${NC} $(npm --version)"
fi

echo ""
echo "============================================================"
echo "📦 Installing Dependencies"
echo "============================================================"
echo ""

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd "$APP_DIR"
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ Node.js dependencies installed${NC}"
else
    echo -e "${YELLOW}⏭️  node_modules already exists, skipping...${NC}"
fi

# Install Python dependencies
echo ""
echo "Installing Python dependencies..."
cd "$ML_DIR"

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python packages..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo -e "${GREEN}✅ Python dependencies installed${NC}"

echo ""
echo "============================================================"
echo "🌐 Network Configuration"
echo "============================================================"
echo ""

# Get local IP address
if command_exists ipconfig; then
    # macOS
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")
elif command_exists hostname; then
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
else
    LOCAL_IP="127.0.0.1"
fi

echo -e "Your local IP address: ${GREEN}$LOCAL_IP${NC}"
echo ""
echo "⚠️  IMPORTANT: Update the API_BASE_URL in the following file:"
echo "   $APP_DIR/services/anthropometryApi.ts"
echo ""
echo "   Change it to: http://$LOCAL_IP:5000"
echo ""
read -p "Press Enter to continue..."

echo ""
echo "============================================================"
echo "🎬 Starting Services"
echo "============================================================"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $PYTHON_PID 2>/dev/null || true
    exit
}

trap cleanup EXIT INT TERM

# Start Python backend in background
echo "Starting Python backend server..."
cd "$ML_DIR"
source venv/bin/activate
python api_server.py &
PYTHON_PID=$!

echo -e "${GREEN}✅ Python backend started (PID: $PYTHON_PID)${NC}"
echo "   API: http://$LOCAL_IP:5000"
echo ""

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}⚠️  Backend health check failed. Check the logs above.${NC}"
fi

echo ""
echo "Starting React Native app..."
cd "$APP_DIR"

# Start Expo
npm start

# This won't be reached until npm start is stopped
echo ""
echo "App stopped."
