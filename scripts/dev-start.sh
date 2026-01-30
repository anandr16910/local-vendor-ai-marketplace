#!/bin/bash

# Development startup script - runs without SSL for easier browser access
# This script starts the application in development mode

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Local Vendor AI Marketplace in Development Mode${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env file from template...${NC}"
    cp .env.example .env 2>/dev/null || cp .env.production .env
fi

# Start development environment
echo -e "${BLUE}🐳 Starting Docker containers...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 10

# Check if services are running
echo -e "${BLUE}🔍 Checking service health...${NC}"

# Check backend
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend is starting up...${NC}"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend is starting up...${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Development environment is ready!${NC}"
echo ""
echo -e "${BLUE}📱 Access your webapp:${NC}"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000/api"
echo "   AI Services: http://localhost:8000"
echo ""
echo -e "${BLUE}🛠️  Development URLs (no SSL warnings):${NC}"
echo "   Main App: http://localhost:3000"
echo "   API Docs: http://localhost:5000/api"
echo "   Health Check: http://localhost:5000/health"
echo ""
echo -e "${BLUE}📋 Useful commands:${NC}"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart: docker-compose restart"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"

# Open browser automatically (optional)
if command -v open >/dev/null 2>&1; then
    # macOS
    echo -e "${BLUE}🌐 Opening browser...${NC}"
    sleep 2
    open http://localhost:3000
elif command -v xdg-open >/dev/null 2>&1; then
    # Linux
    echo -e "${BLUE}🌐 Opening browser...${NC}"
    sleep 2
    xdg-open http://localhost:3000
elif command -v start >/dev/null 2>&1; then
    # Windows
    echo -e "${BLUE}🌐 Opening browser...${NC}"
    sleep 2
    start http://localhost:3000
else
    echo -e "${YELLOW}💡 Manually open http://localhost:3000 in your browser${NC}"
fi