# AWS Credits Optimization Guide - $500 Budget

## 🎯 Goal: Run Your App for 12+ Months on $500 Credits

### Phase 1: Free Tier Maximization (Months 1-12)

**Use AWS Free Tier + Credits for extras**

#### Free Tier Benefits (First 12 Months):
- ✅ **EC2 t2.micro**: 750 hours/month (FREE)
- ✅ **RDS t2.micro**: 750 hours/month (FREE)  
- ✅ **S3 Storage**: 5GB (FREE)
- ✅ **Lambda**: 1M requests/month (FREE)
- ✅ **API Gateway**: 1M requests/month (FREE)
- ✅ **CloudFront**: 50GB transfer (FREE)

#### What You Pay Credits For:
- 🔸 **Bedrock AI**: ~$10-20/month
- 🔸 **Extra storage**: ~$2-5/month
- 🔸 **Data transfer**: ~$3-8/month
- 🔸 **Backup & monitoring**: ~$2-5/month

**Monthly Credit Usage: $15-35**
**Credits Last: 14-33 months**

### Phase 2: Optimized Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │────│  S3 + Lambda    │    │  RDS t2.micro   │
│   (FREE TIER)   │    │  (FREE TIER)    │────│  (FREE TIER)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                    ┌─────────────────┐
                    │ Bedrock Models  │
                    │ (CREDITS ONLY)  │
                    └─────────────────┘
```

## 💡 Credit Saving Strategies

### 1. Use Free Alternatives Where Possible

**Frontend Hosting:**
```bash
# Deploy to Vercel (FREE) instead of AWS
cd packages/frontend
npm install -g vercel
vercel --prod
# Result: $0/month vs $10-20/month on AWS
```

**Database:**
```bash
# Use RDS Free Tier t2.micro
# 20GB storage included
# Perfect for your app size
```

**File Storage:**
```bash
# Use S3 Free Tier
# 5GB storage + 20,000 GET requests
# 2,000 PUT requests per month
```

### 2. Optimize Resource Usage

**Lambda Functions (Stay in Free Tier):**
```javascript
// Optimize Lambda to stay under 1M requests/month
// Use efficient code, caching, batch operations

// Example: Batch database operations
exports.handler = async (event) => {
    // Process multiple requests in one Lambda call
    const results = await Promise.all(
        event.requests.map(req => processRequest(req))
    );
    return results;
};
```

**Database Optimization:**
```sql
-- Use efficient queries to minimize RDS usage
-- Add proper indexes
CREATE INDEX idx_vendor_location ON vendors(location);
CREATE INDEX idx_product_category ON products(category);

-- Use connection pooling to reduce connections
```

### 3. Smart Bedrock Usage

**Cost-Effective AI Strategy:**
```javascript
// Cache AI responses to avoid repeated calls
const cache = new Map();

async function translateWithCache(text, sourceLang, targetLang) {
    const cacheKey = `${text}-${sourceLang}-${targetLang}`;
    
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }
    
    const result = await callBedrock(text, sourceLang, targetLang);
    cache.set(cacheKey, result);
    return result;
}

// Use cheaper models for simple tasks
const modelSelection = {
    translation: "anthropic.claude-instant-v1", // Cheaper
    priceAnalysis: "anthropic.claude-3-sonnet-20240229-v1:0", // More accurate
    simpleQueries: "amazon.titan-text-lite-v1" // Cheapest
};
```

## 📋 Deployment Plan Within Credits

### Step 1: Setup Free Tier Infrastructure

```bash
# 1. Create AWS Account (if not done)
# 2. Verify you have Free Tier eligibility
aws sts get-caller-identity

# 3. Deploy minimal infrastructure
aws cloudformation create-stack \
  --stack-name local-vendor-free-tier \
  --template-body file://free-tier-template.yaml
```

### Step 2: Deploy Application Components

```yaml
# free-tier-template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Local Vendor AI Marketplace - Free Tier Optimized'

Resources:
  # EC2 Instance (Free Tier)
  WebServer:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro  # FREE TIER
      ImageId: ami-0c02fb55956c7d316  # Amazon Linux 2
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y docker
          service docker start
          usermod -a -G docker ec2-user

  # RDS Database (Free Tier)
  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t2.micro  # FREE TIER
      Engine: postgres
      AllocatedStorage: 20  # FREE TIER LIMIT
      DBName: local_vendor_ai
      MasterUsername: postgres
      MasterUserPassword: !Ref DatabasePassword
      PubliclyAccessible: false
      BackupRetentionPeriod: 7

  # S3 Bucket (Free Tier)
  AssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-assets'
      PublicReadPolicy: true

Parameters:
  DatabasePassword:
    Type: String
    NoEcho: true
    MinLength: 8
```

### Step 3: Monitor Credit Usage

```bash
# Install AWS CLI cost monitoring
pip install awscli boto3

# Create cost monitoring script
cat > monitor-credits.py << 'EOF'
import boto3
import json

def check_credit_usage():
    ce = boto3.client('ce', region_name='us-east-1')
    
    response = ce.get_cost_and_usage(
        TimePeriod={
            'Start': '2024-01-01',
            'End': '2024-12-31'
        },
        Granularity='MONTHLY',
        Metrics=['BlendedCost']
    )
    
    total_cost = 0
    for result in response['ResultsByTime']:
        cost = float(result['Total']['BlendedCost']['Amount'])
        total_cost += cost
        print(f"Month: {result['TimePeriod']['Start']}, Cost: ${cost:.2f}")
    
    remaining_credits = 500 - total_cost
    print(f"\nTotal Used: ${total_cost:.2f}")
    print(f"Remaining Credits: ${remaining_credits:.2f}")
    print(f"Months Remaining: {remaining_credits / (total_cost / len(response['ResultsByTime'])):.1f}")

if __name__ == "__main__":
    check_credit_usage()
EOF

# Run monthly
python monitor-credits.py
```

## 🎯 Realistic Timeline with $500 Credits

### Months 1-12: Free Tier + Minimal Credits
- **Monthly Cost**: $5-15 (only Bedrock + extras)
- **Credits Used**: $60-180
- **Remaining**: $320-440

### Months 13-24: Post Free Tier Optimization  
- **Monthly Cost**: $20-35 (small instances + Bedrock)
- **Credits Used**: $240-420
- **Total Used**: $300-600

### Expected Duration: **15-20 months** of full operation

## 🚀 Quick Start Commands

```bash
# 1. Clone your repository
git clone your-repo-url
cd local-vendor-ai-marketplace

# 2. Deploy to free services first
cd packages/frontend
vercel --prod  # FREE hosting

# 3. Set up AWS Free Tier backend
aws cloudformation create-stack \
  --stack-name local-vendor-free \
  --template-body file://free-tier-template.yaml \
  --parameters ParameterKey=DatabasePassword,ParameterValue=YourSecurePassword123

# 4. Deploy backend to EC2 Free Tier
# SSH to your EC2 instance and run:
git clone your-repo-url
cd local-vendor-ai-marketplace
./scripts/aws-deploy.sh

# 5. Enable only essential Bedrock models
aws bedrock put-model-invocation-logging-configuration \
  --logging-config destinationConfig='{cloudWatchConfig={logGroupName=bedrock-logs,roleArn=arn:aws:iam::account:role/service-role/AmazonBedrockExecutionRoleForCloudWatchLogs}}'
```

## 📊 Cost Monitoring Dashboard

Set up billing alerts:
```bash
# Create billing alarm at $50 (10% of credits)
aws cloudwatch put-metric-alarm \
  --alarm-name "AWS-Credits-50-Dollars" \
  --alarm-description "Alert when AWS bill exceeds $50" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

## 🎉 Expected Results

With this optimized approach:
- ✅ **15-20 months** of operation
- ✅ **Full AI features** with Bedrock
- ✅ **Global performance** with CloudFront
- ✅ **Professional setup** with monitoring
- ✅ **Room for growth** as you gain users

Your $500 credits will take you far beyond just testing - you can run a full production app for over a year!