import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaLeaf, 
  FaSun, 
  FaHome, 
  FaClock, 
  FaSeedling,
  FaTimes,
  FaRobot
} from 'react-icons/fa'
import { apiCall } from '../utils/api'

const PlantChatbot = ({ onClose, user }) => {
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
      content: "Hi! 🌱 I'm your edible plant assistant! I specialize in helping you grow delicious vegetables and fruits in small spaces. I can help you with tomatoes, lettuce, carrots, peppers, strawberries, and many other edible plants. What would you like to grow?",
      timestamp: new Date(),
      buttons: [
        "I'm a beginner, help me start",
        "What vegetables can I grow?", 
        "What fruits can I grow?",
        "Show me quick growing options"
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
          content: response.message || "I didn't quite understand that. Let me help you get started!",
          timestamp: new Date(),
          buttons: ["I'm a beginner, give me suggestions", "Show me quick growing options", "I want specific recommendations"]
        }
        setMessages(prev => [...prev, errorMessage])
        setIsTyping(false)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm having trouble connecting right now, but I can still help! Try asking about specific plants like 'lettuce', 'tomatoes', or 'herbs'.",
        timestamp: new Date(),
        buttons: ["I'm a beginner, give me suggestions", "Show me quick growing options", "Try again"]
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

  const handleRestart = () => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'bot',
      content: "Let's start fresh! 🌱 I'm here to help you grow delicious vegetables and fruits. What would you like to know?",
      timestamp: new Date(),
      buttons: [
        "I'm a beginner, help me start",
        "What vegetables can I grow?", 
        "What fruits can I grow?",
        "Show me quick growing options"
      ]
    }
    setMessages([welcomeMessage])
    setSessionId(`session_${Date.now()}`)
  }

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <FaRobot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Edible Plant Assistant</h3>
              <p className="text-xs text-green-100">Vegetables & Fruits Expert</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

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
                    <p className="text-sm leading-relaxed">{message.content}</p>
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
          
          <button
            onClick={handleRestart}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            🔄 Start Over
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default PlantChatbot
