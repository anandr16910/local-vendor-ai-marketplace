# 🚀 Minimal Deployment Guide - 500 Credits Optimized

## 📋 Overview

This guide will help you deploy your Local Vendor AI Marketplace using only **500 AWS credits**, optimized to run for **5-8 months**.

### 💰 Cost Breakdown
- **Monthly Cost**: 60-80 credits
- **Duration**: 6-8 months
- **Frontend**: FREE (Vercel)
- **Backend**: ~40 credits/month (EC2 t2.micro)
- **Database**: ~30 credits/month (RDS t2.micro)
- **Storage**: ~5-10 credits/month

## 🎯 Prerequisites

1. **AWS Account** with 500 credits
2. **AWS CLI** installed and configured
3. **Vercel Account** (free)
4. **Git repository** with your code

## 📱 Step 1: Deploy Frontend (FREE - 0 Credits)

### 1.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 1.2 Deploy to Vercel
```bash
cd packages/frontend
vercel --prod
```

**Result**: Your frontend will be live at `https://your-app.vercel.app` for FREE!

## ☁️ Step 2: Deploy AWS Infrastructure (Uses Credits)

### 2.1 Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key, Secret Key, and Region
```

### 2.2 Deploy Infrastructure
```bash
./deploy-minimal.sh
```

This script will:
- ✅ Create EC2 t2.micro instance (~40 credits/month)
- ✅ Create RDS PostgreSQL t2.micro (~30 credits/month)
- ✅ Set up VPC, security groups, and networking
- ✅ Create S3 bucket for file storage
- ✅ Configure IAM roles for Bedrock access

**Duration**: 10-15 minutes

### 2.3 Note Your Infrastructure Details
The script will output:
```
Web Server IP: 54.123.45.67
Backend URL: http://ec2-54-123-45-67.compute-1.amazonaws.com:5000
Database Endpoint: local-vendor-db.xyz.rds.amazonaws.com
```

## 🖥️ Step 3: Setup Backend Application

### 3.1 SSH into Your Server
```bash
ssh -i your-keypair.pem ec2-user@YOUR-SERVER-IP
```

### 3.2 Clone Your Repository
```bash
git clone https://github.com/your-username/local-vendor-ai-marketplace.git
cd local-vendor-ai-marketplace
```

### 3.3 Run Backend Setup
```bash
./setup-backend.sh
```

This will:
- ✅ Install Node.js and dependencies
- ✅ Configure environment variables
- ✅ Set up database connection
- ✅ Install and configure Redis
- ✅ Start backend service
- ✅ Configure Nginx reverse proxy

**Duration**: 5-10 minutes

## 🔗 Step 4: Connect Frontend to Backend

### 4.1 Update Frontend Environment
```bash
# On your local machine
cd packages/frontend
vercel env add NEXT_PUBLIC_API_URL
# Enter: http://YOUR-SERVER-IP

vercel env add NEXT_PUBLIC_WS_URL  
# Enter: ws://YOUR-SERVER-IP
```

### 4.2 Redeploy Frontend
```bash
vercel --prod
```

## 🤖 Step 5: Enable AI Features (Optional)

### 5.1 Enable Bedrock Models
```bash
# SSH into your server
aws bedrock list-foundation-models --region us-east-1

# Enable specific models (minimal cost)
# amazon.titan-text-lite-v1 (cheapest option)
```

### 5.2 Update Backend Environment
```bash
# On your server
sudo nano /home/ec2-user/local-vendor-ai-marketplace/packages/backend/.env

# Add Bedrock configuration
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.titan-text-lite-v1
```

### 5.3 Restart Backend
```bash
sudo systemctl restart local-vendor-backend
```

## ✅ Step 6: Verify Deployment

### 6.1 Test Backend
```bash
curl http://YOUR-SERVER-IP/health
# Should return: {"status":"healthy",...}

curl http://YOUR-SERVER-IP/api/vendors
# Should return vendor data
```

### 6.2 Test Frontend
Visit `https://your-app.vercel.app` and verify:
- ✅ Homepage loads
- ✅ Vendor listings work
- ✅ Product catalog displays
- ✅ Authentication pages function

## 📊 Step 7: Monitor Usage

### 7.1 Set Up Cost Alerts
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "Credits-Alert-250" \
  --alarm-description "Alert at 250 credits used" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 250 \
  --comparison-operator GreaterThanThreshold
```

### 7.2 Check Daily Usage
```bash
# Create monitoring script
cat > check-usage.sh << 'EOF'
#!/bin/bash
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-12-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --query 'ResultsByTime[*].Total.BlendedCost.Amount' \
  --output table
EOF

chmod +x check-usage.sh
./check-usage.sh
```

## 🎉 Success! Your App is Live

### 📱 Access URLs:
- **Frontend**: https://your-app.vercel.app
- **Backend API**: http://YOUR-SERVER-IP/api
- **Health Check**: http://YOUR-SERVER-IP/health

### 💰 Expected Costs:
- **Month 1**: ~80 credits (initial setup)
- **Months 2-6**: ~60-70 credits/month
- **Total Duration**: 6-8 months

## 🔧 Management Commands

### Backend Management:
```bash
# Check status
sudo systemctl status local-vendor-backend

# View logs
sudo journalctl -u local-vendor-backend -f

# Restart service
sudo systemctl restart local-vendor-backend
```

### Cost Management:
```bash
# Check current usage
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-12-31 --granularity MONTHLY --metrics BlendedCost

# Stop instance to save credits (when not in use)
aws ec2 stop-instances --instance-ids i-1234567890abcdef0

# Start instance
aws ec2 start-instances --instance-ids i-1234567890abcdef0
```

## 🚀 Scaling and Optimization

### When You Need More Performance:
1. **Upgrade EC2**: t2.micro → t3.small (+$10/month)
2. **Upgrade RDS**: db.t2.micro → db.t3.small (+$15/month)
3. **Add CloudFront**: Global CDN (+$5-10/month)

### When Credits Run Low:
1. **Stop non-essential services**
2. **Use AWS Free Tier** (if eligible)
3. **Migrate to cheaper alternatives** (DigitalOcean, Railway)

## 🆘 Troubleshooting

### Backend Not Starting:
```bash
# Check logs
sudo journalctl -u local-vendor-backend -f

# Check database connection
psql -h YOUR-DB-ENDPOINT -U postgres -d local_vendor_ai

# Restart services
sudo systemctl restart local-vendor-backend nginx
```

### Frontend Not Connecting:
```bash
# Check environment variables
vercel env ls

# Update API URL
vercel env add NEXT_PUBLIC_API_URL
vercel --prod
```

### High Costs:
```bash
# Check detailed billing
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-12-31 --granularity DAILY --metrics BlendedCost --group-by Type=DIMENSION,Key=SERVICE

# Stop instance when not needed
aws ec2 stop-instances --instance-ids YOUR-INSTANCE-ID
```

## 🎯 Next Steps

1. **Add Custom Domain**: Point your domain to Vercel
2. **Enable HTTPS**: Use Let's Encrypt on your server
3. **Add Monitoring**: Set up CloudWatch dashboards
4. **Backup Data**: Schedule database backups
5. **Scale Gradually**: Add features as you optimize costs

## 💡 Pro Tips

1. **Use AWS Free Tier** if eligible (extends to 12+ months)
2. **Stop instances** when not actively developing
3. **Monitor daily** to avoid surprise costs
4. **Cache AI responses** to reduce Bedrock usage
5. **Use Vercel for frontend** (saves 100+ credits/month)

---

**🎉 Congratulations!** Your Local Vendor AI Marketplace is now live and optimized for your 500 credit budget!