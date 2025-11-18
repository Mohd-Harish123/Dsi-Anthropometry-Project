# Backend Dockerfile for Flask API + ML Model
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV and ML libraries
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for uploads and model storage
RUN mkdir -p /app/uploads /app/model

# Expose Flask port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=api_server.py
ENV PYTHONUNBUFFERED=1
ENV PORT=5000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health').read()" || exit 1

# Run the Flask application
CMD ["python", "api_server.py"]
