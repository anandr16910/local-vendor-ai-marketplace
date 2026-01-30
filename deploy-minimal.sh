#!/bin/bash

# Local Vendor AI Marketplace - Minimal Deployment Script
# Optimized for 500 AWS Credits

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "🚀 Starting Local Vendor AI Marketplace Minimal Deployment"
print_status "💰 Optimized for 500 AWS Credits (5-6 months runtime)"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first:"
    print_error "https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run: aws configure"
    exit 1
fi

print_success "AWS CLI configured successfully"

# Get AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

print_status "AWS Account ID: $ACCOUNT_ID"
print_status "AWS Region: $REGION"

# Check if key pair exists
print_status "Checking for EC2 Key Pair..."
read -p "Enter your EC2 Key Pair name (or press Enter to create one): " KEY_PAIR_NAME

if [ -z "$KEY_PAIR_NAME" ]; then
    KEY_PAIR_NAME="local-vendor-keypair"
    print_status "Creating new key pair: $KEY_PAIR_NAME"
    
    aws ec2 create-key-pair \
        --key-name $KEY_PAIR_NAME \
        --query 'KeyMaterial' \
        --output text > ${KEY_PAIR_NAME}.pem
    
    chmod 400 ${KEY_PAIR_NAME}.pem
    print_success "Key pair created: ${KEY_PAIR_NAME}.pem"
    print_warning "IMPORTANT: Save this file securely! You'll need it to SSH into your server."
fi

# Deploy CloudFormation stack
STACK_NAME="local-vendor-minimal"
print_status "Deploying AWS infrastructure..."

aws cloudformation create-stack \
    --stack-name $STACK_NAME \
    --template-body file://aws-minimal-template.yaml \
    --parameters ParameterKey=KeyPairName,ParameterValue=$KEY_PAIR_NAME \
    --capabilities CAPABILITY_IAM \
    --region $REGION

print_status "⏳ Waiting for stack creation to complete (this may take 10-15 minutes)..."

aws cloudformation wait stack-create-complete \
    --stack-name $STACK_NAME \
    --region $REGION

if [ $? -eq 0 ]; then
    print_success "✅ AWS infrastructure deployed successfully!"
else
    print_error "❌ Stack creation failed. Check AWS CloudFormation console for details."
    exit 1
fi

# Get stack outputs
print_status "Getting deployment information..."

WEB_SERVER_IP=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`WebServerPublicIP`].OutputValue' \
    --output text \
    --region $REGION)

WEB_SERVER_DNS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`WebServerPublicDNS`].OutputValue' \
    --output text \
    --region $REGION)

DATABASE_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text \
    --region $REGION)

S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
    --output text \
    --region $REGION)

BACKEND_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`BackendURL`].OutputValue' \
    --output text \
    --region $REGION)

print_success "🎉 Deployment Complete!"
echo ""
print_status "📋 Deployment Information:"
echo "  🖥️  Web Server IP: $WEB_SERVER_IP"
echo "  🌐 Web Server DNS: $WEB_SERVER_DNS"
echo "  🗄️  Database Endpoint: $DATABASE_ENDPOINT"
echo "  📦 S3 Bucket: $S3_BUCKET"
echo "  🔗 Backend URL: $BACKEND_URL"
echo ""

# Create deployment info file
cat > deployment-info.txt << EOF
Local Vendor AI Marketplace - Deployment Information
====================================================

AWS Infrastructure:
- Web Server IP: $WEB_SERVER_IP
- Web Server DNS: $WEB_SERVER_DNS
- Database Endpoint: $DATABASE_ENDPOINT
- S3 Bucket: $S3_BUCKET
- Backend URL: $BACKEND_URL
- Key Pair: $KEY_PAIR_NAME.pem

Next Steps:
1. SSH into server: ssh -i $KEY_PAIR_NAME.pem ec2-user@$WEB_SERVER_IP
2. Deploy application code
3. Configure environment variables
4. Start services
5. Deploy frontend to Vercel with Backend URL

Estimated Monthly Cost: 60-80 credits
Expected Duration: 6-8 months with 500 credits
EOF

print_success "📄 Deployment info saved to: deployment-info.txt"

print_status "🚀 Next Steps:"
echo "1. 📱 Deploy frontend to Vercel (FREE):"
echo "   cd packages/frontend && vercel --prod"
echo ""
echo "2. 🖥️  SSH into your server:"
echo "   ssh -i $KEY_PAIR_NAME.pem ec2-user@$WEB_SERVER_IP"
echo ""
echo "3. 📦 Deploy backend application (run on server):"
echo "   git clone <your-repo-url>"
echo "   cd local-vendor-ai-marketplace"
echo "   ./setup-backend.sh"
echo ""
echo "4. 🔗 Update frontend with backend URL:"
echo "   Backend URL: $BACKEND_URL"
echo ""

print_warning "💰 Cost Monitoring:"
echo "   - Current setup: ~60-80 credits/month"
echo "   - Expected duration: 6-8 months"
echo "   - Monitor usage: aws ce get-cost-and-usage"

print_success "🎉 Your Local Vendor AI Marketplace infrastructure is ready!"
print_status "💡 Pro tip: Enable AWS Free Tier if eligible to extend runtime to 12+ months!"