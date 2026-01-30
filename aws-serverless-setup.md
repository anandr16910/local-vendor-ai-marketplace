# AWS Serverless + Bedrock Deployment Guide

## 🚀 Modern Serverless Architecture

Deploy your Local Vendor AI Marketplace using AWS Serverless services + Amazon Bedrock for AI features.

### Architecture Overview

```
Frontend (Vercel/Netlify) → API Gateway → Lambda Functions → Bedrock AI
                                    ↓
                            RDS Serverless (PostgreSQL)
                                    ↓
                            DynamoDB (Market Data)
```

## 💰 Cost Benefits

- **Pay only for usage** (no idle server costs)
- **Auto-scaling** (handles traffic spikes automatically)
- **No server management** (AWS handles everything)
- **Global performance** (CDN included)

## 🛠️ Step-by-Step Setup

### 1. Frontend Deployment (FREE)

**Option A: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd packages/frontend
vercel --prod
```

**Option B: Netlify**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy frontend
cd packages/frontend
npm run build
netlify deploy --prod --dir=.next
```

### 2. Backend as Lambda Functions

Create serverless backend using AWS SAM:

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Timeout: 30
    Runtime: nodejs18.x
    Environment:
      Variables:
        DATABASE_URL: !Ref DatabaseUrl
        BEDROCK_REGION: us-east-1

Resources:
  # API Gateway
  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Cors:
        AllowMethods: "'*'"
        AllowHeaders: "'*'"
        AllowOrigin: "'*'"

  # Lambda Functions
  AuthFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: lambda/auth/
      Handler: index.handler
      Events:
        AuthApi:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /auth/{proxy+}
            Method: ANY

  VendorFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: lambda/vendors/
      Handler: index.handler
      Events:
        VendorApi:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /vendors/{proxy+}
            Method: ANY

  ProductFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: lambda/products/
      Handler: index.handler
      Events:
        ProductApi:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /products/{proxy+}
            Method: ANY

  # AI Translation Function with Bedrock
  TranslationFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: lambda/translation/
      Handler: index.handler
      Policies:
        - Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - bedrock:InvokeModel
              Resource: '*'
      Events:
        TranslationApi:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /translation/{proxy+}
            Method: ANY

  # RDS Serverless Database
  DatabaseCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      Engine: aurora-postgresql
      EngineMode: serverless
      DatabaseName: local_vendor_ai
      MasterUsername: postgres
      MasterUserPassword: !Ref DatabasePassword
      ScalingConfiguration:
        AutoPause: true
        MinCapacity: 2
        MaxCapacity: 16
        SecondsUntilAutoPause: 300

  # DynamoDB for Market Data
  MarketDataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: market-data
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: category
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: S
      KeySchema:
        - AttributeName: category
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE

Parameters:
  DatabasePassword:
    Type: String
    NoEcho: true
    Description: Database password

Outputs:
  ApiGatewayUrl:
    Description: API Gateway URL
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod'
```

### 3. Lambda Function Example with Bedrock

```javascript
// lambda/translation/index.js
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const bedrock = new BedrockRuntimeClient({ region: "us-east-1" });

exports.handler = async (event) => {
    try {
        const { text, sourceLang, targetLang } = JSON.parse(event.body);
        
        // Use Claude 3 for translation
        const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. 
        Consider cultural context for Indian local markets:
        
        Text: ${text}
        
        Provide only the translation:`;
        
        const command = new InvokeModelCommand({
            modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: prompt
                }]
            }),
            contentType: "application/json",
            accept: "application/json"
        });
        
        const response = await bedrock.send(command);
        const result = JSON.parse(new TextDecoder().decode(response.body));
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                translatedText: result.content[0].text,
                confidence: 0.95,
                culturalAdaptations: [],
                alternativeTranslations: [],
                requiresVerification: false
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

### 4. Deployment Commands

```bash
# Install AWS SAM CLI
pip install aws-sam-cli

# Build and deploy
sam build
sam deploy --guided

# Deploy frontend with API URL
cd packages/frontend
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/prod vercel --prod
```

## 🤖 Bedrock AI Features Integration

### Available Models for Your App:

1. **Claude 3 (Anthropic)**
   - Best for: Translation, negotiation assistance
   - Cost: $0.003 per 1K tokens
   - Use case: Cultural context translation

2. **Llama 2 (Meta)**
   - Best for: Price analysis, market insights
   - Cost: $0.0015 per 1K tokens
   - Use case: Price recommendations

3. **Titan (Amazon)**
   - Best for: Text embeddings, search
   - Cost: $0.0001 per 1K tokens
   - Use case: Product search, recommendations

### Example AI Features:

```javascript
// Price Discovery with Bedrock
async function getPriceRecommendation(productInfo) {
    const prompt = `As an AI assistant for Indian local markets, analyze this product and suggest a fair price:
    
    Product: ${productInfo.name}
    Category: ${productInfo.category}
    Location: ${productInfo.location}
    Vendor Reputation: ${productInfo.vendorRating}/5
    
    Consider:
    - Local market conditions
    - Seasonal factors
    - Quality indicators
    - Cultural pricing norms
    
    Provide price range in INR with reasoning:`;
    
    // Call Bedrock Claude model
    const response = await invokeBedrockModel(prompt);
    return parsePrice(response);
}

// Cultural Negotiation Assistant
async function getNegotiationAdvice(context) {
    const prompt = `Provide culturally appropriate negotiation advice for Indian local markets:
    
    Context: ${context.situation}
    Buyer Location: ${context.buyerLocation}
    Vendor Type: ${context.vendorType}
    Product: ${context.product}
    
    Suggest respectful negotiation approach considering local customs:`;
    
    const response = await invokeBedrockModel(prompt);
    return response;
}
```

## 💰 Cost Estimation

### Monthly Costs (1000 active users):

- **Frontend (Vercel)**: FREE
- **API Gateway**: $3.50 (1M requests)
- **Lambda**: $0.20 (1M requests)
- **RDS Serverless**: $15 (active 50 hours/month)
- **DynamoDB**: $2.50 (25GB storage)
- **Bedrock Claude**: $15 (5M tokens)
- **Data Transfer**: $5

**Total: ~$41/month** (vs $50+ for EC2)

### Benefits:
- ✅ No idle costs (pay only when used)
- ✅ Auto-scaling (handles traffic spikes)
- ✅ Global performance (CDN included)
- ✅ No server maintenance
- ✅ Built-in monitoring and logging

## 🚀 Quick Start

1. **Deploy Frontend**: `vercel --prod`
2. **Deploy Backend**: `sam deploy --guided`
3. **Configure Bedrock**: Enable models in AWS Console
4. **Update Frontend**: Set API Gateway URL
5. **Test AI Features**: Try translation and price discovery

Your app will be live at:
- **Frontend**: https://your-app.vercel.app
- **API**: https://your-api.execute-api.us-east-1.amazonaws.com/prod

## 🎯 Next Steps

1. Set up monitoring with CloudWatch
2. Configure custom domain
3. Add more AI features with Bedrock
4. Implement caching with ElastiCache
5. Set up CI/CD pipeline

This serverless approach gives you:
- **Lower costs** (pay per use)
- **Better performance** (global CDN)
- **AI capabilities** (Bedrock integration)
- **No server management** (fully managed)