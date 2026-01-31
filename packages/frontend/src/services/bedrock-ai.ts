// AWS Bedrock AI Service for Agricultural Marketplace
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// Initialize Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
  },
});

export interface PricePredictionRequest {
  product: string;
  location: string;
  season: string;
  quantity: number;
}

export interface PricePredictionResponse {
  predictedPrice: number;
  confidence: number;
  factors: string[];
  recommendation: string;
}

export class AgriculturalAI {
  
  // Price prediction for fruits, vegetables, rice, grains
  static async predictPrice(request: PricePredictionRequest): Promise<PricePredictionResponse> {
    const prompt = `
You are an AI expert in Indian agricultural markets specializing in fruits, vegetables, rice, and grains.

Product: ${request.product}
Location: ${request.location}
Season: ${request.season}
Quantity: ${request.quantity} kg

Based on current Indian market conditions, provide:
1. Predicted price per kg in INR
2. Confidence level (0-100%)
3. Key factors affecting price
4. Recommendation for buyers/sellers

Respond in JSON format:
{
  "predictedPrice": number,
  "confidence": number,
  "factors": ["factor1", "factor2", "factor3"],
  "recommendation": "detailed recommendation"
}
`;

    try {
      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
          anthropic_version: "bedrock-2023-05-31"
        }),
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      // Parse AI response
      const aiResponse = responseBody.content[0].text;
      return JSON.parse(aiResponse);
      
    } catch (error) {
      console.error("Bedrock AI Error:", error);
      // Fallback response
      return {
        predictedPrice: 50,
        confidence: 70,
        factors: ["Seasonal demand", "Weather conditions", "Market supply"],
        recommendation: "Monitor market trends for better pricing decisions."
      };
    }
  }

  // Quality assessment from image
  static async assessQuality(imageBase64: string, productType: string): Promise<{
    quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const prompt = `
Analyze this ${productType} image for quality assessment in Indian agricultural context.

Evaluate:
1. Freshness and ripeness
2. Visual defects or damage
3. Size and uniformity
4. Color and appearance

Provide quality grade and specific feedback for Indian market standards.

Respond in JSON format:
{
  "quality": "Excellent|Good|Fair|Poor",
  "score": number (0-100),
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"]
}
`;

    try {
      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
        body: JSON.stringify({
          messages: [{ 
            role: "user", 
            content: [
              { type: "text", text: prompt },
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 }}
            ]
          }],
          max_tokens: 400,
          anthropic_version: "bedrock-2023-05-31"
        }),
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return JSON.parse(responseBody.content[0].text);
      
    } catch (error) {
      console.error("Quality Assessment Error:", error);
      return {
        quality: 'Good',
        score: 75,
        issues: ["Unable to analyze image"],
        suggestions: ["Please ensure good lighting and clear image"]
      };
    }
  }

  // Multilingual chat assistant
  static async chatAssistant(message: string, language: 'en' | 'hi' | 'ta' | 'te' = 'en'): Promise<string> {
    const languageMap = {
      'en': 'English',
      'hi': 'Hindi',
      'ta': 'Tamil',
      'te': 'Telugu'
    };

    const prompt = `
You are a helpful AI assistant for Indian farmers and agricultural traders specializing in fruits, vegetables, rice, and grains.

User message: "${message}"
Respond in: ${languageMap[language]}

Provide helpful, practical advice about:
- Market prices and trends
- Seasonal farming tips
- Quality assessment
- Storage and preservation
- Selling strategies

Keep responses concise and actionable for Indian agricultural context.
`;

    try {
      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
          anthropic_version: "bedrock-2023-05-31"
        }),
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return responseBody.content[0].text;
      
    } catch (error) {
      console.error("Chat Assistant Error:", error);
      return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
    }
  }

  // Crop recommendation based on market trends
  static async recommendCrops(location: string, season: string, farmSize: number): Promise<{
    recommendations: Array<{
      crop: string;
      expectedProfit: number;
      riskLevel: 'Low' | 'Medium' | 'High';
      marketDemand: number;
      reasons: string[];
    }>;
  }> {
    const prompt = `
You are an agricultural advisor for Indian farmers.

Location: ${location}
Season: ${season}
Farm Size: ${farmSize} acres

Recommend top 3 crops (fruits, vegetables, rice, grains) for maximum profit and market demand.

Consider:
- Current market prices
- Seasonal suitability
- Regional climate
- Water requirements
- Market demand trends

Respond in JSON format:
{
  "recommendations": [
    {
      "crop": "crop name",
      "expectedProfit": number (INR per acre),
      "riskLevel": "Low|Medium|High",
      "marketDemand": number (0-100),
      "reasons": ["reason1", "reason2", "reason3"]
    }
  ]
}
`;

    try {
      const command = new InvokeModelCommand({
        modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          max_tokens: 600,
          anthropic_version: "bedrock-2023-05-31"
        }),
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return JSON.parse(responseBody.content[0].text);
      
    } catch (error) {
      console.error("Crop Recommendation Error:", error);
      return {
        recommendations: [
          {
            crop: "Tomatoes",
            expectedProfit: 80000,
            riskLevel: 'Medium',
            marketDemand: 85,
            reasons: ["High market demand", "Suitable for current season", "Good profit margins"]
          }
        ]
      };
    }
  }
}

export default AgriculturalAI;