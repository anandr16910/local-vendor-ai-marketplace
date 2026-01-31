# 🌾 FreshMandi AI - AWS S3 Deployment Guide

## 🚀 Quick Deployment

### Prerequisites
- AWS CLI installed and configured
- AWS account with S3 permissions

### 1. Run Deployment Script
```bash
./deploy-s3.sh
```

### 2. Manual Steps (Alternative)

#### Create S3 Bucket
```bash
aws s3 mb s3://freshmandi-ai-frontend --region us-east-1
```

#### Upload Files
```bash
cd packages/frontend
aws s3 sync . s3://freshmandi-ai-frontend --delete
```

#### Enable Static Website Hosting
```bash
aws s3 website s3://freshmandi-ai-frontend --index-document index.html
```

#### Set Public Access Policy
```bash
aws s3api put-bucket-policy --bucket freshmandi-ai-frontend --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::freshmandi-ai-frontend/*"
    }
  ]
}'
```

## 🌐 Access Your Site

**Website URL**: `http://freshmandi-ai-frontend.s3-website-us-east-1.amazonaws.com`

## 🔧 Features Available

✅ **Interactive Tiles** - Click on any agricultural category
✅ **AI Demo Popups** - Price predictions, quality assessment
✅ **Multilingual Support** - Hindi/English examples
✅ **Mobile Responsive** - Works on all devices
✅ **Fast Loading** - Optimized static files

## 💰 Cost Breakdown

- **S3 Storage**: ~$0.50/month
- **Data Transfer**: ~$1-3/month
- **Total**: ~$1.50-3.50/month

## 🚀 Optional Enhancements

### Add CloudFront CDN
```bash
# Create CloudFront distribution for global performance
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### Custom Domain
1. Register domain in Route 53
2. Create SSL certificate in ACM
3. Configure CloudFront with custom domain

## 🔄 Updates

To update your site:
```bash
cd packages/frontend
aws s3 sync . s3://freshmandi-ai-frontend --delete
```

## 🛠️ Troubleshooting

### Access Denied Error
- Check bucket policy is applied
- Verify public access settings

### Files Not Updating
- Use `--delete` flag to remove old files
- Clear browser cache

### 404 Errors
- Ensure `index.html` exists in bucket root
- Check static website hosting is enabled

## 📊 Monitoring

View usage in AWS Console:
- S3 → Metrics → Storage metrics
- CloudWatch → S3 metrics
- Cost Explorer → S3 costs