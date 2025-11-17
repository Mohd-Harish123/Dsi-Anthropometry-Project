# ⚡ Quick Start - Docker Demo Checklist

## 🎯 5-Minute Quick Demo

### Before Demo:
```bash
cd /Users/aadityabhatia/DSI/app/Dsi-Anthropometry-Project
docker-compose down
```

---

### 1️⃣ BUILD (2 min)
```bash
docker-compose build
```
**Say:** "Building 3 containers: Frontend, Backend, Database"

---

### 2️⃣ START (30 sec)
```bash
docker-compose up -d
```
**Say:** "Starting all services on private network"

---

### 3️⃣ VERIFY (30 sec)
```bash
docker-compose ps
```
**Say:** "All 3 containers are running"

---

### 4️⃣ SHOW NETWORK (30 sec)
```bash
docker network inspect dsi-anthropometry-project_app-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{println}}{{end}}'
```
**Say:** "Containers communicate via Docker network"

---

### 5️⃣ TEST API (30 sec)
```bash
curl http://localhost:5001/health
```
**Say:** "Backend API is responding"

---

### 6️⃣ OPEN APP (30 sec)
```bash
open http://localhost:8081
```
**Say:** "Frontend serving React Native web interface"

---

### 7️⃣ DEMO WORKFLOW (2 min)
**In Browser:**
1. Register user (Doctor/Parent)
2. Add child profile
3. Upload image for measurement
4. Show ML prediction results

**Say:** "Frontend → Backend → ML Model → Database → Results"

---

### 8️⃣ SHOW LOGS (30 sec)
```bash
docker-compose logs --tail=30
```
**Say:** "Centralized logging from all containers"

---

### 9️⃣ STOP (20 sec)
```bash
docker-compose down
```
**Say:** "One command stops everything cleanly"

---

## 🎯 Key Points to Emphasize

✅ **3 Containers:** Frontend, Backend, Database  
✅ **Isolated Services:** Each in own container  
✅ **Private Network:** Inter-container communication  
✅ **One Command:** docker-compose up  
✅ **ML Model:** Image processing in backend  
✅ **Persistent Data:** Volumes for storage  
✅ **Production Ready:** Can deploy anywhere  

---

## 🐛 Troubleshooting

**If port in use:**
```bash
# Change ports in docker-compose.yml
# Backend: 5001 → 5002
# Frontend: 8081 → 8082
```

**If container unhealthy:**
```bash
docker-compose logs backend
docker-compose restart backend
```

**If build fails:**
```bash
docker-compose build --no-cache
```

---

## ✅ Success = Show This:

1. ✅ `docker-compose ps` showing 3 running containers
2. ✅ Network with 3 containers having different IPs
3. ✅ Backend health check returning JSON
4. ✅ Frontend loading in browser
5. ✅ ML model processing image and showing results
6. ✅ Logs showing inter-container requests

---

**Total Time: 5-7 minutes for quick demo**  
**Full Demo: 30 minutes with detailed explanation**

Use `DEMO_PROCEDURE.md` for complete walkthrough!
