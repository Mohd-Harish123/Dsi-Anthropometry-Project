# Frontend Dockerfile for React Native Expo Web
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies needed for Expo
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy application source code
COPY . .

# Expose ports
EXPOSE 8081 19000 19001 19002

# Set environment variables for Expo
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Start Expo development server (with DevTools UI)
CMD ["npx", "expo", "start"]
