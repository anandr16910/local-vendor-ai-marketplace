#!/bin/bash

# Local Vendor AI Marketplace Deployment Script
# This script handles the deployment of the application in production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    mkdir -p logs backups docker/nginx/ssl
    success "Directories created"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        warning ".env file not found. Creating from template..."
        cp .env.production .env
        warning "Please edit .env file with your production values before continuing."
        read -p "Press Enter after editing .env file..."
    fi
    
    success "Prerequisites check completed"
}

# Generate SSL certificates (self-signed for development)
generate_ssl_certificates() {
    log "Checking SSL certificates..."
    
    if [ ! -f "docker/nginx/ssl/cert.pem" ] || [ ! -f "docker/nginx/ssl/key.pem" ]; then
        warning "SSL certificates not found. Generating self-signed certificates..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout docker/nginx/ssl/key.pem \
            -out docker/nginx/ssl/cert.pem \
            -subj "/C=IN/ST=State/L=City/O=Organization/CN=localhost"
        
        success "Self-signed SSL certificates generated"
        warning "For production, replace with proper SSL certificates from a CA"
    else
        success "SSL certificates found"
    fi
}

# Backup existing data
backup_data() {
    log "Creating backup of existing data..."
    
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$BACKUP_TIMESTAMP"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup PostgreSQL data if container exists
    if docker ps -a --format 'table {{.Names}}' | grep -q "local-vendor-postgres"; then
        log "Backing up PostgreSQL data..."
        docker exec local-vendor-postgres-prod pg_dumpall -U postgres > "$BACKUP_PATH/postgres_backup.sql" 2>/dev/null || true
    fi
    
    # Backup MongoDB data if container exists
    if docker ps -a --format 'table {{.Names}}' | grep -q "local-vendor-mongodb"; then
        log "Backing up MongoDB data..."
        docker exec local-vendor-mongodb-prod mongodump --out "$BACKUP_PATH/mongodb_backup" 2>/dev/null || true
    fi
    
    success "Backup created at $BACKUP_PATH"
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Pull latest images
    log "Pulling latest base images..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build application images
    log "Building application images..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start new containers
    log "Starting new containers..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    success "Deployment completed"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        success "Backend service is healthy"
    else
        error "Backend service health check failed"
    fi
    
    # Check AI services health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        success "AI services are healthy"
    else
        error "AI services health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        success "Frontend service is healthy"
    else
        error "Frontend service health check failed"
    fi
    
    # Check NGINX
    if curl -f http://localhost/health > /dev/null 2>&1; then
        success "NGINX is healthy"
    else
        error "NGINX health check failed"
    fi
    
    success "All health checks passed"
}

# Show logs
show_logs() {
    log "Showing recent logs..."
    docker-compose -f "$COMPOSE_FILE" logs --tail=50
}

# Show status
show_status() {
    log "Current deployment status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    log "Service URLs:"
    echo "  Frontend: https://localhost"
    echo "  Backend API: https://localhost/api"
    echo "  AI Services: https://localhost/ai"
    echo "  Health Check: https://localhost/health"
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old Docker images and containers..."
    docker system prune -f
    docker image prune -f
    success "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting Local Vendor AI Marketplace deployment..."
    
    create_directories
    check_prerequisites
    generate_ssl_certificates
    backup_data
    deploy
    health_check
    show_status
    cleanup
    
    success "Deployment completed successfully!"
    echo ""
    echo "🚀 Your Local Vendor AI Marketplace is now running!"
    echo "📱 Frontend: https://localhost"
    echo "🔧 API: https://localhost/api"
    echo "🤖 AI Services: https://localhost/ai"
    echo ""
    echo "📋 To view logs: ./scripts/deploy.sh logs"
    echo "📊 To check status: ./scripts/deploy.sh status"
    echo "🛑 To stop: docker-compose -f $COMPOSE_FILE down"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "backup")
        backup_data
        ;;
    "health")
        health_check
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|logs|status|backup|health|cleanup}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment (default)"
        echo "  logs    - Show recent logs"
        echo "  status  - Show current status"
        echo "  backup  - Create data backup"
        echo "  health  - Run health checks"
        echo "  cleanup - Clean up old Docker resources"
        exit 1
        ;;
esac