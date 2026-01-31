#!/bin/bash

# AWS S3 Frontend Deployment Script for FreshMandi AI
# This script deploys the interactive frontend to AWS S3

set -e

echo "🌾 FreshMandi AI - AWS S3 Deployment"
echo "======================================"

# Configuration
BUCKET_NAME="freshmandi-ai-frontend"
REGION="us-east-1"
FRONTEND_DIR="packages/frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Creating S3 bucket...${NC}"
if aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null; then
    echo -e "${GREEN}✅ Bucket created successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Bucket already exists or creation failed${NC}"
fi

echo -e "${BLUE}Step 2: Setting up bucket policy for public access...${NC}"
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

# Apply bucket policy
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json
echo -e "${GREEN}✅ Bucket policy applied${NC}"

echo -e "${BLUE}Step 3: Enabling static website hosting...${NC}"
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html
echo -e "${GREEN}✅ Static website hosting enabled${NC}"

echo -e "${BLUE}Step 4: Uploading frontend files...${NC}"
cd $FRONTEND_DIR

# Upload all files with proper content types
aws s3 sync . s3://$BUCKET_NAME \
  --delete \
  --cache-control "max-age=86400" \
  --metadata-directive REPLACE

echo -e "${GREEN}✅ Files uploaded successfully${NC}"

# Get the website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "======================================"
echo -e "${BLUE}Website URL:${NC} $WEBSITE_URL"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Visit the URL above to test your site"
echo "2. Set up CloudFront for better performance (optional)"
echo "3. Configure custom domain (optional)"
echo ""
echo -e "${BLUE}💰 Estimated Monthly Cost:${NC}"
echo "• S3 Storage: ~$0.50"
echo "• Data Transfer: ~$1-3"
echo "• Total: ~$1.50-3.50/month"
echo ""

# Cleanup
rm -f bucket-policy.json

echo -e "${GREEN}✅ Deployment script completed successfully!${NC}"
echo -e "${BLUE}Your interactive FreshMandi AI demo is now live at:${NC}"
echo -e "${GREEN}$WEBSITE_URL${NC}"