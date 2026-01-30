#!/bin/bash

# AWS EC2 Deployment Script for Local Vendor AI Marketplace
# This script sets up the application on a fresh Ubuntu EC2 instance

set -e

echo "🚀 Starting AWS EC2 deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    print_error "This script is designed for Ubuntu. Please use Ubuntu 22.04 LTS."
    exit 1
fi

print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

print_status "Installing Docker and Docker Compose..."
# Install Docker
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

print_status "Installing additional dependencies..."
sudo apt install -y git curl wget unzip nginx certbot python3-certbot-nginx

print_status "Setting up firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

print_status "Creating application directory..."
sudo mkdir -p /opt/local-vendor-ai
sudo chown $USER:$USER /opt/local-vendor-ai
cd /opt/local-vendor-ai

# If repository URL is provided as argument, clone it
if [ ! -z "$1" ]; then
    print_status "Cloning repository from $1..."
    git clone $1 .
else
    print_warning "No repository URL provided. Please clone your repository manually:"
    print_warning "git clone <your-repo-url> /opt/local-vendor-ai"
fi

print_status "Setting up environment configuration..."
if [ -f ".env.production" ]; then
    cp .env.production .env
    print_warning "Please edit .env file with your production values:"
    print_warning "nano .env"
else
    print_warning ".env.production not found. Creating basic .env file..."
    cat > .env << EOF
# AWS Production Environment Variables
NODE_ENV=production

# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=local_vendor_ai
POSTGRES_PORT=5432

MONGO_USER=admin
MONGO_PASSWORD=$(openssl rand -base64 32)
MONGO_DB=local_vendor_ai
MONGO_PORT=27017

REDIS_PASSWORD=$(openssl rand -base64 32)
REDIS_PORT=6379

# Application Configuration
BACKEND_PORT=5000
AI_SERVICES_PORT=8000
FRONTEND_PORT=3000

# Security (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
BCRYPT_ROUNDS=12

# Frontend URLs (Update with your domain)
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_WS_URL=wss://your-domain.com

# External APIs (Optional - add your keys)
GOOGLE_TRANSLATE_API_KEY=
REVERIE_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EOF
    print_success "Basic .env file created with secure random passwords"
fi

print_status "Setting up SSL certificates directory..."
mkdir -p docker/nginx/ssl

print_status "Creating deployment script..."
cat > deploy-aws.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Deploying Local Vendor AI Marketplace on AWS..."

# Build and start services
docker compose -f docker-compose.prod.yml down || true
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Health checks
echo "🔍 Running health checks..."
for i in {1..10}; do
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✅ Application is healthy!"
        break
    fi
    echo "⏳ Waiting for application to be ready... ($i/10)"
    sleep 10
done

echo "📊 Service status:"
docker compose -f docker-compose.prod.yml ps

echo "🎉 Deployment complete!"
echo "📱 Your app is available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
EOF

chmod +x deploy-aws.sh

print_success "AWS deployment setup complete!"
print_status "Next steps:"
echo "1. Edit .env file with your production values: nano .env"
echo "2. If you have a domain, update FRONTEND_URL in .env"
echo "3. Run deployment: ./deploy-aws.sh"
echo "4. Set up SSL certificate: sudo certbot --nginx -d your-domain.com"
echo ""
print_success "Your app will be accessible at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR-EC2-PUBLIC-IP')"