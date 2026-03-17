import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaComment } from 'react-icons/fa';
import PlantChatbotEmbedded from './PlantChatbotEmbedded';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { user } = useAuth();

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const minimizeChatbot = () => {
    setIsMinimized(true);
    setIsOpen(false);
  };

  const closeChatbot = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Chatbot Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={toggleChatbot}
              className="group relative w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-white"
            >
              {/* Pulse animation */}
              <div className="absolute inset-0 rounded-full bg-green-400 opacity-75 animate-ping"></div>
              
              {/* Main button content */}
              <div className="relative z-10 text-2xl">
                {isMinimized ? (
                  <FaComment className="w-6 h-6" />
                ) : (
                  <span className="text-yellow-300">🍍</span>
                )}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Chat with Sprouty!
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Chatbot Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeChatbot}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Custom Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-2xl">
                    🍍
                  </div>
                  <div>
                    <h3 className="font-semibold">Sprouty</h3>
                    <p className="text-xs text-green-100">Your Friendly Garden Buddy</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={minimizeChatbot}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                    title="Minimize"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <button
                    onClick={closeChatbot}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                    title="Close"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chatbot Content */}
              <div className="h-[calc(100%-80px)]">
                <PlantChatbotEmbedded onClose={closeChatbot} user={user} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized Chatbot Indicator */}
      <AnimatePresence>
        {isMinimized && !isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <motion.button
              onClick={toggleChatbot}
              className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaComment className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatbot;
