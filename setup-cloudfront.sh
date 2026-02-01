#!/bin/bash

# CloudFront Distribution Setup for FreshMandi AI
# This creates an HTTPS-enabled CDN for the S3 website

set -e

echo "🌾 FreshMandi AI - CloudFront HTTPS Setup"
echo "=========================================="

# Configuration
BUCKET_NAME="freshmandi-ai-frontend"
REGION="us-east-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Creating CloudFront distribution config...${NC}"

# Create CloudFront distribution configuration
cat > cloudfront-config.json << EOF
{
  "CallerReference": "freshmandi-ai-$(date +%s)",
  "Comment": "FreshMandi AI Agricultural Marketplace CDN",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-freshmandi-ai-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    }
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-freshmandi-ai-frontend",
        "DomainName": "$BUCKET_NAME.s3-website-$REGION.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "PriceClass": "PriceClass_100"
}
EOF

echo -e "${BLUE}Step 2: Creating CloudFront distribution...${NC}"
DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config file://cloudfront-config.json --query 'Distribution.Id' --output text)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CloudFront distribution created: $DISTRIBUTION_ID${NC}"
else
    echo -e "${RED}❌ Failed to create CloudFront distribution${NC}"
    exit 1
fi

echo -e "${BLUE}Step 3: Getting distribution domain name...${NC}"
DOMAIN_NAME=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)

echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "======================================"
echo -e "${BLUE}HTTPS URL:${NC} https://$DOMAIN_NAME"
echo -e "${BLUE}Distribution ID:${NC} $DISTRIBUTION_ID"
echo ""
echo -e "${YELLOW}📋 Important Notes:${NC}"
echo "1. CloudFront deployment takes 15-20 minutes to propagate globally"
echo "2. The HTTPS URL will work from any device/network"
echo "3. This provides better performance and security"
echo ""
echo -e "${BLUE}💰 Additional Cost:${NC}"
echo "• CloudFront: ~$1-3/month for low traffic"
echo "• Total with S3: ~$2.50-6.50/month"
echo ""

# Cleanup
rm -f cloudfront-config.json

echo -e "${GREEN}✅ Your FreshMandi AI demo will be available at:${NC}"
echo -e "${GREEN}https://$DOMAIN_NAME${NC}"
echo -e "${YELLOW}(Allow 15-20 minutes for global deployment)${NC}"