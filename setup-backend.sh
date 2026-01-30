#!/bin/bash

# Backend Setup Script for EC2 Instance
# Run this script on your EC2 instance after SSH

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

print_status "🚀 Setting up Local Vendor AI Marketplace Backend"

# Get instance metadata
INSTANCE_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)

print_status "Instance IP: $INSTANCE_IP"
print_status "Region: $REGION"

# Update system
print_status "Updating system packages..."
sudo yum update -y

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

print_success "Node.js version: $(node --version)"

# Clone repository if not exists
if [ ! -d "local-vendor-ai-marketplace" ]; then
    print_status "Please clone your repository first:"
    print_warning "git clone <your-repository-url>"
    print_warning "cd local-vendor-ai-marketplace"
    print_warning "Then run this script again"
    exit 1
fi

# Navigate to project directory
cd local-vendor-ai-marketplace

# Install dependencies
print_status "Installing backend dependencies..."
cd packages/backend
npm install

# Get database endpoint from CloudFormation
print_status "Getting database configuration..."
DATABASE_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name local-vendor-minimal \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text \
    --region $REGION)

S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name local-vendor-minimal \
    --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
    --output text \
    --region $REGION)

print_status "Database Endpoint: $DATABASE_ENDPOINT"
print_status "S3 Bucket: $S3_BUCKET"

# Create production environment file
print_status "Creating production environment configuration..."
cat > .env.production << EOF
# Production Environment - AWS Deployment
NODE_ENV=production
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://postgres:LocalVendor123!@$DATABASE_ENDPOINT:5432/local_vendor_ai
POSTGRES_HOST=$DATABASE_ENDPOINT
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=LocalVendor123!
POSTGRES_DB=local_vendor_ai

# Redis Configuration (using local Redis for minimal cost)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
BCRYPT_ROUNDS=12

# AWS Configuration
AWS_REGION=$REGION
S3_BUCKET_NAME=$S3_BUCKET

# Frontend URL (will be updated after Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app

# File Upload
UPLOAD_DIR=/opt/uploads
MAX_FILE_SIZE=10485760

# External APIs (optional - add your keys later)
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

# Copy environment file
cp .env.production .env

print_success "Environment configuration created"

# Install and start Redis locally (for minimal cost)
print_status "Installing Redis..."
sudo yum install -y redis
sudo systemctl start redis
sudo systemctl enable redis

# Create uploads directory
sudo mkdir -p /opt/uploads
sudo chown ec2-user:ec2-user /opt/uploads

# Build the application
print_status "Building backend application..."
npm run build

# Create systemd service for the backend
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/local-vendor-backend.service > /dev/null << EOF
[Unit]
Description=Local Vendor AI Marketplace Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/local-vendor-ai-marketplace/packages/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable local-vendor-backend
sudo systemctl start local-vendor-backend

# Check service status
sleep 5
if sudo systemctl is-active --quiet local-vendor-backend; then
    print_success "✅ Backend service started successfully!"
else
    print_error "❌ Backend service failed to start. Checking logs..."
    sudo systemctl status local-vendor-backend
    exit 1
fi

# Install nginx for reverse proxy
print_status "Installing and configuring Nginx..."
sudo yum install -y nginx

# Create nginx configuration
sudo tee /etc/nginx/conf.d/local-vendor.conf > /dev/null << EOF
server {
    listen 80;
    server_name $INSTANCE_IP;

    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # File uploads
    location /uploads/ {
        alias /opt/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Default response for other routes
    location / {
        return 200 'Local Vendor AI Marketplace Backend is running!';
        add_header Content-Type text/plain;
    }
}
EOF

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Test the setup
print_status "Testing backend setup..."
sleep 3

if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "✅ Backend is responding to health checks!"
else
    print_warning "⚠️  Backend health check failed. Checking logs..."
    sudo systemctl status local-vendor-backend
fi

# Display final information
print_success "🎉 Backend Setup Complete!"
echo ""
print_status "📋 Backend Information:"
echo "  🔗 Backend URL: http://$INSTANCE_IP"
echo "  🏥 Health Check: http://$INSTANCE_IP/health"
echo "  📊 API Base: http://$INSTANCE_IP/api"
echo "  📁 Uploads: http://$INSTANCE_IP/uploads"
echo ""

print_status "🔧 Service Management:"
echo "  📊 Check status: sudo systemctl status local-vendor-backend"
echo "  🔄 Restart: sudo systemctl restart local-vendor-backend"
echo "  📝 View logs: sudo journalctl -u local-vendor-backend -f"
echo ""

print_status "🚀 Next Steps:"
echo "1. 📱 Deploy frontend to Vercel with this backend URL:"
echo "   NEXT_PUBLIC_API_URL=http://$INSTANCE_IP"
echo ""
echo "2. 🔗 Update frontend environment in Vercel:"
echo "   vercel env add NEXT_PUBLIC_API_URL"
echo "   Enter: http://$INSTANCE_IP"
echo ""
echo "3. 🚀 Redeploy frontend:"
echo "   vercel --prod"
echo ""

print_warning "💰 Cost Optimization Tips:"
echo "  - This setup uses ~60-80 credits/month"
echo "  - Monitor usage: aws ce get-cost-and-usage"
echo "  - Stop instance when not needed: aws ec2 stop-instances"

print_success "🎉 Your backend is now live at: http://$INSTANCE_IP"