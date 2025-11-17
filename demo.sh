#!/bin/bash

# DSI Anthropometry Project - Docker Demo Script
# This script demonstrates the complete Docker setup

echo "════════════════════════════════════════════════════════"
echo "  DSI Anthropometry Project - Docker Demonstration"
echo "════════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build containers
echo -e "${BLUE}Step 1: Building Docker containers...${NC}"
echo "This may take 5-10 minutes on first run"
echo ""
docker-compose build --no-cache
echo ""
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 2: Start services
echo -e "${BLUE}Step 2: Starting all services...${NC}"
echo ""
docker-compose up -d
echo ""
echo -e "${GREEN}✓ Services started${NC}"
echo ""

# Step 3: Wait for health checks
echo -e "${BLUE}Step 3: Waiting for services to be healthy...${NC}"
echo "Please wait 30 seconds..."
sleep 30
echo -e "${GREEN}✓ Services should be ready${NC}"
echo ""

# Step 4: Check status
echo -e "${BLUE}Step 4: Checking container status...${NC}"
echo ""
docker-compose ps
echo ""

# Step 5: Test connectivity
echo -e "${BLUE}Step 5: Testing inter-container communication...${NC}"
echo ""

echo "Testing Backend Health Check:"
curl -s http://localhost:5000/health | python3 -m json.tool
echo ""
echo ""

echo "Testing Database (Firestore Emulator):"
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database emulator is running${NC}"
else
    echo -e "${YELLOW}⚠ Database emulator may still be starting...${NC}"
fi
echo ""

echo "Testing Frontend:"
if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠ Frontend may still be starting...${NC}"
fi
echo ""
echo ""

# Step 6: Display access URLs
echo -e "${BLUE}Step 6: Application Access Points${NC}"
echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}Frontend Web App:${NC}      http://localhost:8081"
echo -e "${GREEN}Backend API:${NC}           http://localhost:5000"
echo -e "${GREEN}Firestore Emulator UI:${NC} http://localhost:4000"
echo -e "${GREEN}Auth Emulator:${NC}         http://localhost:9099"
echo "════════════════════════════════════════════════════════"
echo ""

# Step 7: Network info
echo -e "${BLUE}Step 7: Docker Network Information${NC}"
echo ""
docker network inspect dsi-anthropometry-project_app-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{println}}{{end}}'
echo ""

# Step 8: Show logs
echo -e "${BLUE}Step 8: Recent container logs${NC}"
echo ""
docker-compose logs --tail=20
echo ""

echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}Demo Setup Complete!${NC}"
echo "════════════════════════════════════════════════════════"
echo ""
echo "What to do next:"
echo "1. Open browser to http://localhost:8081 to use the app"
echo "2. Register a user and test the full workflow"
echo "3. Check Firestore UI at http://localhost:4000 to see data"
echo ""
echo "To view live logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop all containers:"
echo "  docker-compose down"
echo ""
echo "To stop and remove all data:"
echo "  docker-compose down -v"
echo ""
echo "Press Ctrl+C to exit this script"
echo ""

# Follow logs
read -p "Press Enter to view live logs (Ctrl+C to exit)..."
docker-compose logs -f
