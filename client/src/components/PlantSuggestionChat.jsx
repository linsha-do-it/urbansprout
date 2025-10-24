import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Leaf, Sun, Clock, Home, Zap, Salad, Coffee } from 'lucide-react';

const PlantSuggestionChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    space: '',
    sunlight: '',
    time: '',
    purpose: ''
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize chat with welcome message
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: "🌱 Hi! I'm your plant suggestion assistant! I'll help you find the perfect plants based on your space, time, and sunlight availability.",
        timestamp: new Date(),
        suggestions: [
          { text: "I need specific recommendations", keyword: "specific" },
          { text: "Show me quick-growing plants", keyword: "quick" },
          { text: "Plants for salads", keyword: "salad" },
          { text: "Plants for smoothies", keyword: "smoothie" }
        ]
      }
    ]);
  }, []);

  const quickSuggestions = [
    { text: "I have a small space", keyword: "small_space", icon: <Home className="w-4 h-4" /> },
    { text: "I have a large space", keyword: "large_space", icon: <Home className="w-4 h-4" /> },
    { text: "Full sun available", keyword: "full_sun", icon: <Sun className="w-4 h-4" /> },
    { text: "Partial shade only", keyword: "partial_shade", icon: <Sun className="w-4 h-4" /> },
    { text: "I want quick results", keyword: "quick_growing", icon: <Zap className="w-4 h-4" /> },
    { text: "I have time to wait", keyword: "slow_growing", icon: <Clock className="w-4 h-4" /> },
    { text: "For fresh salads", keyword: "salad_plants", icon: <Salad className="w-4 h-4" /> },
    { text: "For smoothies", keyword: "smoothie_plants", icon: <Coffee className="w-4 h-4" /> }
  ];

  const getPlantRecommendations = async (keyword, preferences = {}) => {
    try {
      const response = await fetch('/api/plants/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword, preferences })
      });
      
      const data = await response.json();
      return data.plants || [];
    } catch (error) {
      console.error('Error fetching plant recommendations:', error);
      return [];
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: suggestion.text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(async () => {
      const plants = await getPlantRecommendations(suggestion.keyword, userPreferences);
      
      let botResponse = '';
      let plantSuggestions = [];

      switch (suggestion.keyword) {
        case 'specific':
          botResponse = "Let me ask you a few questions to give you the best recommendations. What's your available space?";
          setUserPreferences(prev => ({ ...prev, space: 'asking' }));
          break;
        case 'quick':
          botResponse = "Here are some quick-growing plants that will give you results in 30-60 days:";
          plantSuggestions = plants.filter(plant => plant.quick_growing === 'Yes');
          break;
        case 'salad':
          botResponse = "Perfect! Here are the best plants for fresh, delicious salads:";
          plantSuggestions = plants.filter(plant => plant.salad_suitable === 'Yes');
          break;
        case 'smoothie':
          botResponse = "Great choice! These plants are perfect for nutritious smoothies:";
          plantSuggestions = plants.filter(plant => plant.smoothie_suitable === 'Yes');
          break;
        case 'small_space':
          botResponse = "Perfect for small spaces! Here are compact plants that thrive in containers:";
          plantSuggestions = plants.filter(plant => plant.space_needed === 'Small' && plant.container_friendly === 'Yes');
          break;
        case 'large_space':
          botResponse = "With a large space, you have many options! Here are some great choices:";
          plantSuggestions = plants.filter(plant => plant.space_needed === 'Large');
          break;
        case 'full_sun':
          botResponse = "Excellent! Full sun gives you access to many sun-loving plants:";
          plantSuggestions = plants.filter(plant => plant.sunlight_requirement === 'Full Sun');
          break;
        case 'partial_shade':
          botResponse = "No problem! Many plants thrive in partial shade:";
          plantSuggestions = plants.filter(plant => plant.sunlight_requirement === 'Partial Shade');
          break;
        case 'quick_growing':
          botResponse = "Here are the fastest-growing plants for quick results:";
          plantSuggestions = plants.filter(plant => plant.quick_growing === 'Yes').sort((a, b) => parseInt(a.growing_time_days) - parseInt(b.growing_time_days));
          break;
        case 'slow_growing':
          botResponse = "These plants take more time but are worth the wait:";
          plantSuggestions = plants.filter(plant => plant.growing_time_days > 90);
          break;
        case 'salad_plants':
          botResponse = "Fresh salad ingredients! These plants are perfect for salads:";
          plantSuggestions = plants.filter(plant => plant.salad_suitable === 'Yes');
          break;
        case 'smoothie_plants':
          botResponse = "Nutritious smoothie ingredients! These plants are great for smoothies:";
          plantSuggestions = plants.filter(plant => plant.smoothie_suitable === 'Yes');
          break;
        default:
          botResponse = "Here are some plant suggestions based on your preferences:";
          plantSuggestions = plants.slice(0, 6);
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
        plants: plantSuggestions.slice(0, 6), // Limit to 6 plants
        suggestions: suggestion.keyword === 'specific' ? [
          { text: "Small (containers)", keyword: "small_space" },
          { text: "Medium (garden bed)", keyword: "medium_space" },
          { text: "Large (full garden)", keyword: "large_space" }
        ] : quickSuggestions.slice(0, 4)
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I understand! Let me help you find the perfect plants. Try clicking on one of the suggestions below to get started!",
        timestamp: new Date(),
        suggestions: quickSuggestions.slice(0, 4)
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Real-world pricing for plants in INR
  const getPlantPrice = (plantName, type = 'low') => {
    const prices = {
      'Lettuce': { low: 15, high: 25 },
      'Spinach': { low: 20, high: 35 },
      'Green Onions': { low: 10, high: 20 },
      'Kale': { low: 25, high: 40 },
      'Swiss Chard': { low: 20, high: 30 },
      'Asian Greens': { low: 15, high: 25 },
      'Rhubarb': { low: 50, high: 80 },
      'Asparagus': { low: 100, high: 150 },
      'Jerusalem Artichoke': { low: 40, high: 60 },
      'Cherry Tomatoes': { low: 30, high: 50 },
      'Strawberries': { low: 25, high: 40 },
      'Basil': { low: 20, high: 30 },
      'Cilantro': { low: 15, high: 25 },
      'Parsley': { low: 18, high: 28 },
      'Guava': { low: 80, high: 120 },
      'Passion Fruit': { low: 60, high: 100 },
      'Okra': { low: 25, high: 40 },
      'Dragon Fruit': { low: 150, high: 250 },
      'Rambutan': { low: 120, high: 200 }
    };
    
    const plantPrices = prices[plantName] || { low: 20, high: 50 };
    return type === 'high' ? plantPrices.high : plantPrices.low;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <Bot className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Plant Suggestion Bot</h2>
          <p className="text-sm text-gray-500">Always here to help</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} space-x-2`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-blue-500' 
                  : 'bg-green-500'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={`px-4 py-2 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>

                {/* Plant Cards */}
                {message.plants && message.plants.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.plants.map((plant, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Leaf className="w-4 h-4 text-green-600" />
                          <h4 className="font-semibold text-green-800">{plant.name}</h4>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {plant.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{plant.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {plant.growing_time_days} days
                          </span>
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                            {plant.sunlight_requirement}
                          </span>
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {plant.space_needed} space
                          </span>
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                            ₹{getPlantPrice(plant.name)} - ₹{getPlantPrice(plant.name, 'high')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 italic">{plant.growing_tips}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg p-3 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {suggestion.icon && suggestion.icon}
                          <span className="text-sm text-gray-700">{suggestion.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlantSuggestionChat;
