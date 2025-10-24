import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaLeaf, 
  FaSun, 
  FaHome, 
  FaClock, 
  FaSeedling
} from 'react-icons/fa'
import { apiCall } from '../utils/api'

const PlantChatbotEmbedded = ({ onClose, user }) => {
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)

  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'bot',
      content: "Hi there! I'm Sprouty, your friendly garden buddy! I'm super excited to help you grow amazing vegetables and fruits in any space you have! I specialize in hybrid varieties, container gardening, and fast-growing plants that don't need much room. Whether you want dwarf fruit trees, compact vegetables, or quick-harvest greens, I'll help you succeed! What delicious plants would you like to grow together?",
      timestamp: new Date(),
      buttons: [
        "I'm a beginner, help me start",
        "Show me container-friendly vegetables", 
        "What hybrid fruits can I grow in pots?",
        "Tell me about fast-growing varieties"
      ]
    }
    setMessages([welcomeMessage])
    setSessionId(`session_${Date.now()}`)
  }, [])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      const response = await apiCall('/chatbot', {
        method: 'POST',
        body: JSON.stringify({
          message: messageText,
          userId: sessionId
        })
      })

      if (response.success) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: response.data.message,
          timestamp: new Date(),
          buttons: response.data.buttons || [],
          plants: response.data.plants || [],
          storeItems: response.data.storeItems || []
        }
        
        setTimeout(() => {
          setMessages(prev => [...prev, botMessage])
          setIsTyping(false)
        }, 800) // Reduced typing delay for better responsiveness
      } else {
        // Handle API errors more gracefully
        const errorMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: response.message || "That's a great question! Let me help you discover some amazing plants you can grow!",
          timestamp: new Date(),
          buttons: ["I'm a beginner, help me start", "Show me container-friendly vegetables", "Tell me about fast-growing varieties"]
        }
        setMessages(prev => [...prev, errorMessage])
        setIsTyping(false)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "Oops! I'm having trouble connecting right now, but don't worry - Sprouty is still excited to help you grow amazing plants! Try asking about specific plants like 'container tomatoes', 'dwarf fruit trees', or 'fast-growing lettuce'.",
        timestamp: new Date(),
        buttons: ["I'm a beginner, help me start", "Show me container-friendly vegetables", "Try again"]
      }
      setMessages(prev => [...prev, errorMessage])
      setIsTyping(false)
    }
  }

  const handleButtonClick = (buttonText) => {
    sendMessage(buttonText)
  }

  const handleInputSubmit = (e) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      sendMessage(inputMessage.trim())
      setInputMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleInputSubmit(e)
    }
  }


  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatMessageContent = (content) => {
    if (!content) return content;
    
    // First, clean up any remaining asterisks or markdown symbols
    let cleanContent = content.replace(/\*+/g, ''); // Remove all asterisks
    cleanContent = cleanContent.replace(/#+/g, ''); // Remove all hashtags
    cleanContent = cleanContent.replace(/_+/g, ''); // Remove underscores
    
    // Split content by double line breaks to create paragraphs
    const paragraphs = cleanContent.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // Check if paragraph starts with a dash (bullet point)
      if (paragraph.trim().startsWith('-')) {
        const bulletPoints = paragraph.split('\n').filter(line => line.trim().startsWith('-'));
        const otherText = paragraph.split('\n').filter(line => !line.trim().startsWith('-')).join(' ');
        
        return (
          <div key={index} className="mb-3">
            {otherText && <p className="mb-2">{formatTextWithEmphasis(otherText)}</p>}
            <ul className="space-y-1 ml-4">
              {bulletPoints.map((bullet, bulletIndex) => {
                const bulletText = bullet.replace(/^-\s*/, '').trim();
                return (
                  <li key={bulletIndex} className="text-sm">
                    <span className="text-green-600 font-bold">•</span> {formatTextWithEmphasis(bulletText)}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }
      
      // Regular paragraph
      return (
        <p key={index} className={`${index > 0 ? 'mt-3' : ''} leading-relaxed`}>
          {formatTextWithEmphasis(paragraph.trim())}
        </p>
      );
    });
  }

  const formatTextWithEmphasis = (text) => {
    // Keywords that should be emphasized (made bold)
    const emphasisKeywords = [
      'Space:', 'Sunlight:', 'Care Level:', 'Container:', 'Requirements:', 'Hybrid:', 'Varieties:',
      'Growing Time:', 'Harvest:', 'Watering:', 'Soil:', 'Temperature:', 'Fertilizer:', 'Spacing:',
      'SPACE', 'SUNLIGHT', 'CARE LEVEL', 'CONTAINER', 'REQUIREMENTS', 'HYBRID', 'VARIETIES',
      'GROWING TIME', 'HARVEST', 'WATERING', 'SOIL', 'TEMPERATURE', 'FERTILIZER', 'SPACING'
    ];
    
    let formattedText = text;
    
    // Make keywords bold
    emphasisKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      formattedText = formattedText.replace(regex, (match) => `<strong>${match}</strong>`);
    });
    
    // Convert to JSX
    return <span dangerouslySetInnerHTML={{ __html: formattedText }} />;
  }

  const getPlantIcon = (type) => {
    switch (type) {
      case 'vegetable': return <span className="text-pink-500 font-bold text-lg">V</span>
      case 'fruit': return <span className="text-pink-500 font-bold text-lg">F</span>
      case 'herb': return <span className="text-pink-500 font-bold text-lg">H</span>
      default: return <span className="text-pink-500 font-bold text-lg">P</span>
    }
  }

  const getMaintenanceIcon = (level) => {
    switch (level) {
      case 'low': return <FaClock className="text-green-500" />
      case 'medium': return <FaClock className="text-yellow-500" />
      case 'high': return <FaClock className="text-red-500" />
      default: return <FaClock className="text-gray-500" />
    }
  }

  const getSunlightIcon = (level) => {
    switch (level) {
      case 'low': return <FaSun className="text-blue-500" />
      case 'partial': return <FaSun className="text-yellow-500" />
      case 'full': return <FaSun className="text-orange-500" />
      default: return <FaSun className="text-gray-500" />
    }
  }

  const getSpaceIcon = (level) => {
    switch (level) {
      case 'small': return <FaHome className="text-green-500" />
      case 'medium': return <FaHome className="text-blue-500" />
      case 'large': return <FaHome className="text-purple-500" />
      default: return <FaHome className="text-gray-500" />
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                {/* Message Bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-green-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  <div className="text-sm leading-relaxed">
                    {formatMessageContent(message.content)}
                  </div>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>

                {/* Quick Reply Buttons */}
                {message.buttons && message.buttons.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.buttons.map((button, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleButtonClick(button)}
                        className="block w-full text-left px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-colors text-sm"
                      >
                        {button}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Plant Suggestions */}
                {message.plants && message.plants.length > 0 && (
                  <div className="mt-3 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">🌱 Plant Suggestions:</h4>
                    {message.plants.map((plant, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{getPlantIcon(plant.type)}</div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-800">{plant.name}</h5>
                            <p className="text-xs text-gray-600 mb-2">{plant.description}</p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                {getSunlightIcon(plant.sunlight || 'partial')}
                                <span>{plant.sunlight || 'Partial'} sun</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {getMaintenanceIcon(plant.maintenance || 'low')}
                                <span>{plant.maintenance || 'Low'} care</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <FaSeedling className="text-green-500" />
                                <span>{plant.growTime}</span>
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <button
                                onClick={async () => {
                                  // Add to user's garden using API
                                  try {
                                    const { apiCall } = await import('../utils/api');
                                    const response = await apiCall('/garden/add', {
                                      method: 'POST',
                                      body: JSON.stringify({ plant })
                                    });

                                    if (response.success) {
                                      alert(`Added ${plant.name} to your garden! 🌱`);
                                    } else {
                                      throw new Error(response.message || 'Failed to add plant to garden');
                                    }
                                  } catch (error) {
                                    console.error('Failed to add to garden:', error);
                                    
                                    // Fallback to localStorage for offline functionality
                                    try {
                                      const key = `my_garden_${user?.id || user?.uid || user?.email || 'guest'}`
                                      const existing = JSON.parse(localStorage.getItem(key) || '[]')
                                      if (!existing.includes(plant.name)) {
                                        const updated = [...existing, plant.name]
                                        localStorage.setItem(key, JSON.stringify(updated))
                                        
                                        // Also save plant image
                                        const imageKey = `plant_images_${user?.id || user?.uid || user?.email || 'guest'}`
                                        const existingImages = JSON.parse(localStorage.getItem(imageKey) || '{}')
                                        existingImages[plant.name] = plant.image || '/api/placeholder/300/200'
                                        localStorage.setItem(imageKey, JSON.stringify(existingImages))
                                        
                                        alert(`Added ${plant.name} to your garden! 🌱 (Saved locally)`)
                                      } else {
                                        alert(`${plant.name} is already in your garden!`)
                                      }
                                    } catch (localError) {
                                      console.error('Local storage fallback failed:', localError)
                                      alert('Failed to add plant to garden. Please try again.')
                                    }
                                  }
                                }}
                                className="px-3 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-colors"
                              >
                                Add to Garden
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Store Items */}
                {message.storeItems && message.storeItems.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700">🛒 Recommended Items:</h4>
                    {message.storeItems.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-2"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h6 className="text-sm font-medium text-blue-800">{item.name}</h6>
                            <p className="text-xs text-blue-600">{item.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleInputSubmit} className="flex space-x-2 mb-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about vegetables, fruits, growing tips, or specific varieties..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Send
          </button>
        </form>
        
      </div>
    </div>
  )
}

export default PlantChatbotEmbedded



