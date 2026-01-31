'use client';

import React, { useState } from 'react';

const HomePage = () => {
  const [activeDemo, setActiveDemo] = useState(null);

  const demoData = {
    vegetables: {
      title: "🥬 Vegetables AI Demo",
      content: (
        <div>
          <h3>AI Price Prediction: Tomatoes</h3>
          <div className="bg-green-100 p-4 rounded-lg my-3 text-gray-800">
            <strong>Current Price:</strong> ₹45/kg<br/>
            <strong>Predicted (7 days):</strong> ₹52/kg<br/>
            <strong>Confidence:</strong> 87%<br/>
            <strong>Recommendation:</strong> Hold for better prices next week
          </div>
        </div>
      )
    },
    fruits: {
      title: "🍎 Fruits AI Demo", 
      content: (
        <div>
          <h3>Quality Assessment: Mangoes</h3>
          <div className="bg-green-100 p-4 rounded-lg my-3 text-gray-800">
            <strong>Quality Grade:</strong> Excellent (92/100)<br/>
            <strong>Ripeness:</strong> Perfect for selling<br/>
            <strong>Defects:</strong> None detected<br/>
            <strong>Market Value:</strong> Premium grade
          </div>
        </div>
      )
    },
    rice: {
      title: "🌾 Rice AI Demo",
      content: (
        <div>
          <h3>Market Analysis: Basmati Rice</h3>
          <div className="bg-green-100 p-4 rounded-lg my-3 text-gray-800">
            <strong>Current Rate:</strong> ₹75/kg<br/>
            <strong>Demand:</strong> High (Festival season)<br/>
            <strong>Best Markets:</strong> Delhi, Mumbai<br/>
            <strong>Profit Margin:</strong> 25-30%
          </div>
        </div>
      )
    },
    grains: {
      title: "🌰 Grains AI Demo",
      content: (
        <div>
          <h3>Price Forecast: Wheat</h3>
          <div className="bg-green-100 p-4 rounded-lg my-3 text-gray-800">
            <strong>Current Price:</strong> ₹28/kg<br/>
            <strong>Seasonal Trend:</strong> Increasing<br/>
            <strong>Best Selling Time:</strong> Next 2 months<br/>
            <strong>Expected Peak:</strong> ₹32/kg
          </div>
        </div>
      )
    },
    prediction: {
      title: "📊 AI Price Prediction",
      content: (
        <div>
          <h3>AWS Bedrock AI Analysis</h3>
          <div className="bg-green-100 p-4 rounded-lg my-3 text-gray-800">
            <strong>Model:</strong> Claude 3 Haiku<br/>
            <strong>Accuracy:</strong> 85-90%<br/>
            <strong>Factors Analyzed:</strong><br/>
            • Weather patterns<br/>
            • Market demand<br/>
            • Seasonal trends<br/>
            • Regional variations
          </div>
        </div>
      )
    },
    assistant: {
      title: "🤖 AI Chat Assistant",
      content: (
        <div>
          <h3>Multilingual Support Demo</h3>
          <div className="bg-white bg-opacity-20 p-3 rounded my-2">
            <strong>You:</strong> "आज टमाटर का भाव क्या है?" (What's today's tomato price?)
          </div>
          <div className="bg-green-100 p-3 rounded my-2 text-gray-800">
            <strong>AI:</strong> "आज टमाटर का भाव ₹45 प्रति किलो है। मुंबई मंडी में सबसे अच्छा रेट मिल रहा है।"<br/>
            <small>(Today's tomato price is ₹45 per kg. Best rates available in Mumbai market.)</small>
          </div>
        </div>
      )
    }
  };

  const showDemo = (category) => {
    setActiveDemo(category);
  };

  const closeDemo = () => {
    setActiveDemo(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      <div className="container mx-auto px-5 py-10 text-center max-w-4xl">
        <h1 className="text-5xl font-bold mb-4">🌾 FreshMandi AI - Interactive Demo</h1>
        <p className="text-xl mb-8 opacity-90">
          AI-powered marketplace for Indian fruits, vegetables, rice & grains with smart pricing and quality assessment
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-10">
          <div 
            className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm cursor-pointer transform hover:scale-105 transition-all duration-300"
            onClick={() => showDemo('vegetables')}
          >
            <h3 className="text-xl font-semibold mb-3">🥬 Fresh Vegetables</h3>
            <p className="text-sm opacity-90 mb-2">AI-powered quality assessment and price prediction for seasonal vegetables across India</p>
            <small className="opacity-70">Click to see demo</small>
          </div>

          <div 
            className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm cursor-pointer transform hover:scale-105 transition-all duration-300"
            onClick={() => showDemo('fruits')}
          >
            <h3 className="text-xl font-semibold mb-3">🍎 Fruits & Produce</h3>
            <p className="text-sm opacity-90 mb-2">Smart grading system for fruits with ripeness detection and optimal selling recommendations</p>
            <small className="opacity-70">Click to see demo</small>
          </div>

          <div 
            className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm cursor-pointer transform hover:scale-105 transition-all duration-300"
            onClick={() => showDemo('rice')}
          >
            <h3 className="text-xl font-semibold mb-3">🌾 Rice Varieties</h3>
            <p className="text-sm opacity-90 mb-2">Comprehensive marketplace for Basmati, Jasmine, and regional rice varieties with quality analysis</p>
            <small className="opacity-70">Click to see demo</small>
          </div>

          <div 
            className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm cursor-pointer transform hover:scale-105 transition-all duration-300"
            onClick={() => showDemo('grains')}
          >
            <h3 className="text-xl font-semibold mb-3">🌰 Grains & Pulses</h3>
            <p className="text-sm opacity-90 mb-2">AI-driven pricing for wheat, dal, and other grains with market trend predictions</p>
            <small className="opacity-70">Click to see demo</small>
          </div>

          <div 
            className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm cursor-pointer transform hover:scale-105 transition-all duration-300"
            onClick={() => showDemo('prediction')}
          >
            <h3 className="text-xl font-semibold mb-3">📊 Price Prediction</h3>
            <p className="text-sm opacity-90 mb-2">AWS Bedrock AI models predict market prices based on seasonal patterns and demand</p>
            <small className="opacity-70">Click to see demo</small>
          </div>

          <div 
            className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm cursor-pointer transform hover:scale-105 transition-all duration-300"
            onClick={() => showDemo('assistant')}
          >
            <h3 className="text-xl font-semibold mb-3">🤖 Smart Assistant</h3>
            <p className="text-sm opacity-90 mb-2">Multilingual AI chat support in Hindi and regional languages for farmers and traders</p>
            <small className="opacity-70">Click to see demo</small>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">🤖 AI Features Demo</h2>
          <p className="mb-6">Experience AWS Bedrock AI capabilities for agricultural marketplace</p>
          
          <div className="bg-yellow-100 bg-opacity-20 p-4 rounded-lg text-sm">
            <strong>🔧 Technical Implementation:</strong><br/>
            • Powered by AWS Bedrock (Claude 3 & Titan models)<br/>
            • Real-time AI processing for Indian agricultural markets<br/>
            • Multilingual support (Hindi, Tamil, Telugu)<br/>
            • Cost-optimized for developing markets
          </div>
        </div>

        <div className="mt-10 text-sm opacity-70">
          <p>Created by Anand Rajgopalan in AWS platform tools supported by Kiro</p>
        </div>
      </div>

      {/* Demo Modal */}
      {activeDemo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={closeDemo}
        >
          <div 
            className="bg-gradient-to-br from-blue-600 to-purple-700 text-white p-8 rounded-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">{demoData[activeDemo].title}</h2>
            <div className="mb-6">
              {demoData[activeDemo].content}
            </div>
            <div className="text-center">
              <button 
                onClick={closeDemo}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-2 rounded-lg transition-all duration-200"
              >
                Close Demo
              </button>
            </div>
            <div className="text-center mt-3 text-xs opacity-70">
              Powered by AWS Bedrock AI
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;