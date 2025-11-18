# Database Dockerfile for Firebase Emulator
FROM --platform=linux/arm64 node:18-alpine

# Set working directory
WORKDIR /app

# Install Java (required for Firebase emulators)
RUN apk add --no-cache openjdk11-jre

# Install Firebase CLI
RUN npm install -g firebase-tools

# Set working directory
WORKDIR /app

# Copy Firebase configuration files
COPY firebase.json .
COPY firestore.rules .
COPY firestore.indexes.json .

# Create directory for persistent data
RUN mkdir -p /app/data

# Expose Firestore and Auth emulator ports
EXPOSE 8080 9099 4000

# Set environment variables
ENV FIRESTORE_EMULATOR_HOST=0.0.0.0:8080
ENV FIREBASE_AUTH_EMULATOR_HOST=0.0.0.0:9099

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080 || exit 1

# Start Firebase emulators
CMD ["firebase", "emulators:start", "--only", "firestore,auth", "--project", "demo-project"]
