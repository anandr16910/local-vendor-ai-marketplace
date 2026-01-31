'use client';

import React, { useState } from 'react';
import AgriculturalAI, { PricePredictionRequest, PricePredictionResponse } from '../services/bedrock-ai';

const PricePrediction: React.FC = () => {
  const [formData, setFormData] = useState<PricePredictionRequest>({
    product: '',
    location: '',
    season: '',
    quantity: 0
  });
  
  const [prediction, setPrediction] = useState<PricePredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const products = [
    'Tomatoes', 'Onions', 'Potatoes', 'Carrots', 'Cabbage', 'Cauliflower',
    'Apples', 'Bananas', 'Mangoes', 'Oranges', 'Grapes', 'Pomegranates',
    'Basmati Rice', 'Jasmine Rice', 'Brown Rice', 'Wheat', 'Dal (Lentils)', 'Chickpeas'
  ];

  const locations = [
    'Mumbai, Maharashtra', 'Delhi, Delhi', 'Bangalore, Karnataka', 
    'Chennai, Tamil Nadu', 'Kolkata, West Bengal', 'Hyderabad, Telangana',
    'Pune, Maharashtra', 'Ahmedabad, Gujarat', 'Jaipur, Rajasthan'
  ];

  const seasons = ['Summer', 'Monsoon', 'Winter', 'Spring'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await AgriculturalAI.predictPrice(formData);
      setPrediction(result);
    } catch (err) {
      setError('Failed to get price prediction. Please try again.');
      console.error('Price prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PricePredictionRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        🤖 AI Price Prediction
      </h2>
      <p className="text-gray-600 text-center mb-8">
        Get AI-powered price predictions for agricultural products using AWS Bedrock
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product
              </label>
              <select
                value={formData.product}
                onChange={(e) => handleInputChange('product', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product} value={product}>{product}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Select location</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Season
              </label>
              <select
                value={formData.season}
                onChange={(e) => handleInputChange('season', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Select season</option>
                {seasons.map(season => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (kg)
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter quantity in kg"
                min="1"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Predicting...' : 'Get AI Price Prediction'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          {prediction && (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                📊 Price Prediction Results
              </h3>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{prediction.predictedPrice}/kg
                  </div>
                  <div className="text-sm text-gray-600">
                    Confidence: {prediction.confidence}%
                  </div>
                </div>

                <div className="bg-white p-4 rounded-md shadow-sm">
                  <h4 className="font-semibold text-gray-700 mb-2">Key Factors:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {prediction.factors.map((factor, index) => (
                      <li key={index} className="text-sm text-gray-600">{factor}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-md shadow-sm">
                  <h4 className="font-semibold text-gray-700 mb-2">AI Recommendation:</h4>
                  <p className="text-sm text-gray-600">{prediction.recommendation}</p>
                </div>
              </div>
            </div>
          )}

          {!prediction && !loading && (
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 text-center">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-gray-600">
                Fill out the form to get AI-powered price predictions for your agricultural products
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
              <div className="animate-spin text-4xl mb-4">🤖</div>
              <p className="text-blue-600">
                AI is analyzing market data and generating price predictions...
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This AI price prediction is powered by AWS Bedrock and considers multiple factors including seasonal patterns, market demand, and regional variations. Use as guidance alongside your market knowledge.
        </p>
      </div>
    </div>
  );
};

export default PricePrediction;