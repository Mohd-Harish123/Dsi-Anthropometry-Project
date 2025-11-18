# 🚀 Docker Demo Procedure - DSI Anthropometry Project

## Complete Step-by-Step Guide for Running & Demonstrating Your Dockerized Application

---

## 📋 Pre-Demo Checklist

Before starting the demo, ensure:
- [ ] Docker Desktop is running
- [ ] All previous containers are stopped: `docker-compose down`
- [ ] Terminal is open in project root

---

## 🎬 Part 1: Setup & Launch (5 minutes)

### Step 1: Navigate to Project Directory
```bash
cd /Users/aadityabhatia/DSI/app/Dsi-Anthropometry-Project
```

### Step 2: Show Docker Compose Configuration
```bash
# Display the orchestration file
cat docker-compose.yml
```

**Explain:** "This docker-compose.yml file defines 3 services: Frontend, Backend, and Database, all connected on a private network."

---

### Step 3: Build All Docker Images
```bash
# Build all containers (takes 2-3 minutes)
docker-compose build
```

**While building, explain:**
- "Building Frontend container with Node.js and React Native"
- "Building Backend container with Python, Flask, and ML libraries"
- "Pulling MongoDB image for database"

---

### Step 4: Start All Containers
```bash
# Start all services in detached mode
docker-compose up -d
```

**Expected Output:**
```
✔ Network dsi-anthropometry-project_app-network  Created
✔ Container dsi-anthropometry-database          Started
✔ Container dsi-anthropometry-backend           Started
✔ Container dsi-anthropometry-frontend          Started
```

---

### Step 5: Verify All Containers Are Running
```bash
# Check container status
docker-compose ps
```

**Expected Output:**
```
NAME                         STATUS
dsi-anthropometry-database   Up
dsi-anthropometry-backend    Up (healthy)
dsi-anthropometry-frontend   Up
```

**Explain:** "All 3 containers are now running and isolated from each other but can communicate."

---

## 🔗 Part 2: Demonstrate Inter-Container Communication (3 minutes)

### Step 6: Show Docker Network
```bash
# Display network and container IPs
docker network inspect dsi-anthropometry-project_app-network --format '{{range .Containers}}Container: {{.Name}} - IP: {{.IPv4Address}}{{println}}{{end}}'
```

**Expected Output:**
```
Container: dsi-anthropometry-backend - IP: 172.20.0.2/16
Container: dsi-anthropometry-frontend - IP: 172.20.0.3/16
Container: dsi-anthropometry-database - IP: 172.20.0.4/16
```

**Explain:** "All containers are on the same private bridge network (172.20.0.0/16) and can communicate using container names as DNS."

---

### Step 7: Test Backend Health
```bash
# Test backend API endpoint
curl http://localhost:5001/health
```

**Expected Output:**
```json
{
  "message": "Anthropometry API is running",
  "status": "ok"
}
```

**Explain:** "The backend Flask API is running and responding. This container has the ML model loaded."

---

### Step 8: Check Database Connection
```bash
# Verify database container is accessible
docker exec dsi-anthropometry-backend nc -zv database 27017 2>&1 | grep -i "open\|succeeded"
```

**Expected:** Connection successful message

**Explain:** "Backend can reach the database container using the hostname 'database' - Docker's internal DNS resolution."

---

### Step 9: View Container Logs
```bash
# Show recent logs from all containers
docker-compose logs --tail=20
```

**Explain:** "These logs show the startup sequence and inter-container communication."

---

## 🎯 Part 3: Application Demo (7-10 minutes)

### Step 10: Access Frontend Application
```bash
# Open frontend in browser
open http://localhost:8081
```

**Or manually open:** `http://localhost:8081`

**Wait ~30 seconds** for Expo to fully load.

---

### Step 11: User Registration Flow

**In Browser:**
1. Click **"Get Started"** or **"Register"**
2. Fill in registration details:
   - Name: `Dr. John Smith`
   - Email: `john.smith@demo.com`
   - Password: `Demo123!`
   - Role: Select **Doctor**
3. Click **Register**

**Explain:** "The frontend (React Native web) sends authentication request to Firebase, which stores user data."

---

### Step 12: Add a Child Profile

**In Browser:**
1. Click **"Add Child"** or **"+"**
2. Fill in child details:
   - Name: `Test Child`
   - Date of Birth: Select a date (e.g., 2 years old)
   - Gender: Select `Male` or `Female`
3. Click **Save**

**Explain:** "This data is stored in Firebase Firestore. The frontend communicates with the database through Firebase SDK."

---

### Step 13: Demonstrate ML Model (Image Processing)

**Option A: Use Camera/Upload**
1. Click on the child profile
2. Click **"Take Measurement"** or **"Scan"**
3. Upload an image or use camera
4. Wait for processing

**Option B: Use Test Image (Faster)**
```bash
# From another terminal, test the backend API directly
curl -X POST http://localhost:5001/predict \
  -F "image=@/path/to/test/image.jpg"
```

**While Processing, Show Backend Logs:**
```bash
# In another terminal
docker-compose logs -f backend
```

**Expected Log Output:**
```
POST /predict - Image received
Processing image with ML model...
Prediction completed: Height, Weight, etc.
```

**Explain:** 
- "Frontend sends image to backend container via HTTP POST"
- "Backend container runs ML/CV model (MediaPipe/OpenCV)"
- "Model extracts measurements and returns predictions"
- "Results are stored in database and displayed to user"

---

### Step 14: View Results

**In Browser:**
- Results appear showing:
  - Height prediction
  - Weight prediction
  - WHO growth standards comparison
  - Nutritional status

**Explain:** "The ML model has processed the image, extracted anthropometric measurements, and compared them with WHO standards."

---

### Step 15: View Stored Data in Database

**Check Firestore (if using Firebase):**
```bash
# Frontend connects to Firebase
# Data visible in Firebase Console
open https://console.firebase.google.com
```

**Or Check MongoDB (if configured):**
```bash
# Access MongoDB shell
docker exec -it dsi-anthropometry-database mongosh

# In MongoDB shell:
use anthropometry
db.measurements.find().pretty()
exit
```

**Explain:** "All measurement data is persisted in the database container."

---

## 🧪 Part 4: Technical Demonstration (5 minutes)

### Step 16: Show Container Isolation

```bash
# Access backend container shell
docker exec -it dsi-anthropometry-backend bash

# Inside container:
ls -la
pip list | grep -E "flask|opencv|numpy"
curl http://database:27017
exit
```

**Explain:** "Each container has its own isolated filesystem and dependencies."

---

### Step 17: Demonstrate Container Communication

```bash
# From frontend container, ping backend
docker exec dsi-anthropometry-frontend wget -qO- http://backend:5000/health

# Show environment variables
docker exec dsi-anthropometry-frontend env | grep API_URL
```

**Expected:** Shows `EXPO_PUBLIC_API_URL=http://backend:5000`

**Explain:** "Frontend uses 'backend:5000' hostname (internal DNS), not localhost."

---

### Step 18: Show Resource Usage

```bash
# Display real-time resource consumption
docker stats --no-stream
```

**Expected Output:**
```
NAME                        CPU %     MEM USAGE
dsi-anthropometry-backend   2.5%      250MB
dsi-anthropometry-frontend  1.8%      180MB
dsi-anthropometry-database  0.5%      100MB
```

**Explain:** "Each container's resource usage is isolated and monitored."

---

### Step 19: Show Volume Persistence

```bash
# Show volumes
docker volume ls | grep dsi-anthropometry

# Show mounted volumes
docker inspect dsi-anthropometry-backend --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println}}{{end}}'
```

**Explain:** "Volumes persist data even when containers are stopped. Uploads and database data survive container restarts."

---

## 🔄 Part 5: Container Management Demo (3 minutes)

### Step 20: Stop and Restart Containers

```bash
# Stop all containers
docker-compose down

# Wait 2 seconds
sleep 2

# Restart all containers
docker-compose up -d

# Verify they're back
docker-compose ps
```

**Explain:** "Containers can be stopped and restarted quickly. Data persists in volumes."

---

### Step 21: Scale Demonstration (Optional)

```bash
# Scale backend to 2 instances
docker-compose up -d --scale backend=2

# Show running containers
docker ps | grep backend
```

**Explain:** "In production, we can scale services horizontally for load balancing."

---

### Step 22: View All Logs in Real-Time

```bash
# Follow logs from all containers
docker-compose logs -f
```

**Explain:** "Centralized logging from all containers. Press Ctrl+C to stop."

---

## 🎓 Part 6: Architecture Explanation (3 minutes)

### Step 23: Draw/Show Architecture

**Explain using this diagram:**

```
┌─────────────────────────────────────────────────────────┐
│   Docker Network: app-network (172.20.0.0/16)          │
│                                                         │
│   ┌─────────────┐       ┌──────────────┐              │
│   │  Frontend   │──────►│   Backend    │              │
│   │             │       │              │              │
│   │ React Native│       │ Flask API    │              │
│   │ Expo Web    │       │ ML/CV Model  │              │
│   │             │       │ OpenCV       │              │
│   │ Port: 8081  │       │ Port: 5001   │              │
│   └─────────────┘       └──────┬───────┘              │
│          │                      │                      │
│          │                      ▼                      │
│          │              ┌──────────────┐              │
│          └─────────────►│   Database   │              │
│                         │              │              │
│                         │  MongoDB /   │              │
│                         │  Firebase    │              │
│                         │              │              │
│                         │ Port: 27018  │              │
│                         └──────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Points:**
- **Frontend Container:** Serves React Native web interface
- **Backend Container:** Runs Flask API with ML model
- **Database Container:** Stores measurement data
- **Network:** Private bridge network for inter-container communication
- **Volumes:** Persistent storage for uploads and database

---

### Step 24: Explain Communication Flow

**User Workflow:**
```
1. User opens http://localhost:8081 (Frontend)
2. Frontend loads in browser
3. User uploads image
4. Frontend sends HTTP POST to http://backend:5000/predict
5. Backend processes image with ML model
6. Backend stores result in database:27017
7. Backend returns prediction to frontend
8. Frontend displays results to user
```

---

### Step 25: Show Docker Compose Benefits

**Explain advantages:**
- ✅ **Isolation:** Each service in its own container
- ✅ **Portability:** Runs anywhere Docker runs
- ✅ **Scalability:** Easy to scale services
- ✅ **Reproducibility:** Same environment every time
- ✅ **Orchestration:** One command to start everything
- ✅ **Networking:** Automatic DNS and network setup
- ✅ **Volumes:** Data persists across restarts

---

## 🧹 Cleanup (1 minute)

### Step 26: Stop All Containers

```bash
# Stop and remove containers
docker-compose down
```

### Step 27: Clean Up Everything (Optional)

```bash
# Remove containers, networks, and volumes
docker-compose down -v

# Remove unused images
docker system prune -a
```

---

## 📊 Demo Script Summary

### Timing Breakdown:
- **Setup & Launch:** 5 minutes
- **Inter-Container Communication:** 3 minutes
- **Application Demo:** 7-10 minutes
- **Technical Demo:** 5 minutes
- **Container Management:** 3 minutes
- **Architecture Explanation:** 3 minutes
- **Q&A Buffer:** 5 minutes

**Total: ~30-35 minutes**

---

## 🎤 Speaking Points for Submission

### Introduction (1 min)
"This project demonstrates a containerized anthropometry measurement system using Docker. We have 3 microservices: a React Native frontend, a Python Flask backend with ML models, and a database layer - all communicating over a private Docker network."

### Technical Highlights (2 min)
"Key technical features include:
- Docker Compose orchestration of multiple containers
- Inter-container communication via Docker networking
- ML model (MediaPipe/OpenCV) for anthropometric measurements
- RESTful API with Flask
- Persistent data storage with volumes
- Health checks and monitoring"

### Real-World Application (1 min)
"This architecture is production-ready and can be deployed to any cloud platform supporting Docker. It's scalable, maintainable, and follows microservices best practices."

---

## ❓ Expected Questions & Answers

**Q: Why use Docker instead of running directly?**
A: Docker provides isolation, consistency across environments, easy deployment, and scalability. It ensures the app runs the same way on any machine.

**Q: How do containers communicate?**
A: Through Docker's internal DNS on a private bridge network. Containers use service names (e.g., 'backend', 'database') instead of IP addresses.

**Q: What happens if a container crashes?**
A: Docker Compose can automatically restart containers. We've configured restart policies to handle failures.

**Q: How do you handle data persistence?**
A: We use Docker volumes which persist data even when containers are removed. Database data and uploads are stored in volumes.

**Q: Can this scale?**
A: Yes! We can use `docker-compose up --scale backend=5` to run multiple backend instances behind a load balancer.

**Q: How do you debug issues?**
A: Using `docker-compose logs` for centralized logging, `docker exec` to access containers, and `docker stats` for resource monitoring.

---

## 🎯 Success Criteria

Your demo is successful if you show:
- ✅ All 3 containers running simultaneously
- ✅ Inter-container communication (frontend → backend → database)
- ✅ ML model processing an image and returning results
- ✅ Data persistence across container restarts
- ✅ Docker networking and DNS resolution
- ✅ Resource isolation and monitoring
- ✅ One-command orchestration with docker-compose

---

## 📝 Quick Command Reference

```bash
# Start everything
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Rebuild after code changes
docker-compose build
docker-compose up -d

# Access container shell
docker exec -it dsi-anthropometry-backend bash

# Test backend
curl http://localhost:5001/health

# View network
docker network inspect dsi-anthropometry-project_app-network

# Check resources
docker stats

# Clean up everything
docker-compose down -v
docker system prune -a
```

---

## 🚀 Ready for Demo!

Follow this procedure step-by-step for a comprehensive demonstration of your Dockerized anthropometry project. Good luck! 🎉
