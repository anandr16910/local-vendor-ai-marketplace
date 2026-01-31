# 🌾 FreshMandi AI - Open Source Agricultural Marketplace

An open-source, AI-powered marketplace platform for Indian fruits, vegetables, rice & grains, featuring AWS Bedrock integration for smart pricing, quality assessment, and crop recommendations.

## 🌐 Live Demo

**Frontend**: [http://freshmandi-ai-frontend.s3-website-us-east-1.amazonaws.com](http://freshmandi-ai-frontend.s3-website-us-east-1.amazonaws.com)

## 🤖 AI Features (AWS Bedrock Integration)

- **🔮 Price Prediction**: AI-powered price forecasting using Claude 3 models
- **� Qualtity Assessment**: Image-based quality grading for produce
- **💬 Multilingual Chat**: Support in Hindi and regional Indian languages
- **🌱 Crop Recommendations**: Smart farming advice based on market trends
- **📊 Market Analytics**: Real-time insights and demand forecasting

## ✨ Core Features

### **🥬 Agricultural Focus**
- **Fresh Vegetables**: Seasonal vegetables with quality grading
- **🍎 Fruits & Produce**: Regional varieties with ripeness detection
- **🌾 Rice Varieties**: Basmati, Jasmine, and regional rice types
- **🌰 Grains & Pulses**: Wheat, dal, and other staple grains

### **🚀 Technology Stack**
- **Frontend**: React, Next.js, TypeScript, Tailwind CSS
- **AI/ML**: AWS Bedrock (Claude 3, Titan models)
- **Cloud**: AWS (EC2, RDS, S3, VPC)
- **Hosting**: Vercel (Frontend), AWS (Backend)
- **Database**: PostgreSQL
- **Languages**: TypeScript, Python

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   AWS Bedrock   │
│   (Vercel)      │◄──►│   (AWS EC2)      │◄──►│   AI Models     │
│   React/Next.js │    │   Node.js/Python │    │   Claude/Titan  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        ▼                        │
         │              ┌──────────────────┐               │
         │              │   PostgreSQL     │               │
         └──────────────┤   (AWS RDS)      │◄──────────────┘
                        │   Database       │
                        └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- AWS Account with Bedrock access
- Git

### 1. Clone Repository
```bash
git clone https://github.com/anandr16910/local-vendor-ai-marketplace.git
cd local-vendor-ai-marketplace
```

### 2. Install Dependencies
```bash
cd packages/frontend
npm install
```

### 3. Configure AWS Bedrock
```bash
# Set up AWS credentials
aws configure

# Enable Bedrock models (Claude 3 Haiku recommended for cost efficiency)
aws bedrock list-foundation-models --region us-east-1
```

### 4. Environment Setup
Create `.env.local` in `packages/frontend/`:
```env
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=your_access_key
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🤖 AWS Bedrock Integration

### Supported Models
- **Claude 3 Haiku**: Fast, cost-effective for price predictions
- **Claude 3 Sonnet**: Advanced reasoning for quality assessment
- **Titan Text**: Embeddings and text generation
- **Titan Image**: Visual analysis for produce quality

### AI Services Implementation
```typescript
import AgriculturalAI from './services/bedrock-ai';

// Price prediction
const prediction = await AgriculturalAI.predictPrice({
  product: 'Tomatoes',
  location: 'Mumbai, Maharashtra',
  season: 'Summer',
  quantity: 100
});

// Quality assessment
const quality = await AgriculturalAI.assessQuality(imageBase64, 'tomatoes');

// Chat assistant
const response = await AgriculturalAI.chatAssistant('What is the best time to sell mangoes?', 'hi');
```

## 🌍 Target Market

### **Primary Users**
- **Farmers**: Direct market access, better pricing
- **Traders**: Wholesale dealers, mandi operators  
- **Retailers**: Grocery stores, restaurants
- **Consumers**: Bulk buyers, cooperatives

### **Geographic Focus**
- **Phase 1**: Major cities (Mumbai, Delhi, Bangalore)
- **Phase 2**: Agricultural states (Punjab, Haryana, UP)
- **Phase 3**: Rural farming communities

## 💡 Contributing

We welcome contributions! This project aims to:
- **Empower Indian farmers** with AI technology
- **Reduce food wastage** through better market connections
- **Democratize agricultural AI** through open source

### How to Contribute
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Areas for Contribution
- **AI Model Training**: Indian agricultural data
- **Regional Languages**: Translation and localization
- **Mobile App**: React Native implementation
- **Logistics**: Delivery and supply chain features
- **Payment Integration**: UPI, digital wallets

## 📊 Cost Optimization

### AWS Bedrock Costs (Estimated)
- **Claude 3 Haiku**: ~$0.25 per 1M input tokens
- **Price Predictions**: ~$0.01 per prediction
- **Quality Assessment**: ~$0.05 per image analysis
- **Monthly Budget**: $50-100 for moderate usage

### Infrastructure Costs
- **Frontend**: FREE (Vercel)
- **Backend**: ~$40/month (AWS EC2 t2.micro)
- **Database**: ~$30/month (AWS RDS t2.micro)
- **Total**: ~$70-130/month for production

## 🔒 Security & Privacy

- **Data Encryption**: All data encrypted in transit and at rest
- **AWS IAM**: Proper role-based access control
- **No PII Storage**: Minimal personal data collection
- **GDPR Compliant**: Privacy-first approach

## 📈 Roadmap

### **Phase 1: Core Platform** ✅
- [x] Basic marketplace structure
- [x] AWS Bedrock integration
- [x] Price prediction AI
- [x] Open source documentation

### **Phase 2: Advanced AI** (In Progress)
- [ ] Quality assessment with image analysis
- [ ] Multilingual chat assistant
- [ ] Crop recommendation engine
- [ ] Market trend analysis

### **Phase 3: Scale & Mobile** (Planned)
- [ ] React Native mobile app
- [ ] WhatsApp integration
- [ ] Offline capabilities
- [ ] Regional language support

### **Phase 4: Ecosystem** (Future)
- [ ] Logistics partnerships
- [ ] Payment gateway integration
- [ ] Farmer training modules
- [ ] Government scheme integration

## 🏆 Recognition & Impact

### **Technical Achievement**
- **Full-stack AI application** with modern architecture
- **AWS Bedrock integration** for agricultural use case
- **Open source contribution** to Indian AgTech
- **Cost-optimized deployment** for developing markets

### **Social Impact**
- **Farmer empowerment** through direct market access
- **Food security** through reduced wastage
- **Technology democratization** in rural areas
- **Economic development** in agricultural communities

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Creator

**Created by Anand Rajgopalan**  
Built with AWS platform tools supported by Kiro



---

## 🙏 Acknowledgments

- **AWS Bedrock** for providing advanced AI capabilities
- **Vercel** for free frontend hosting
- **Open Source Community** for inspiration and support
- **Indian Farmers** who inspire this work

---

**🌟 Star this repository if you find it useful for learning AWS Bedrock, agricultural AI, or full-stack development!**

**🤝 Contributions welcome - let's build the future of Indian agriculture together!**
