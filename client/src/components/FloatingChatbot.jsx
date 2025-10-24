import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaComment } from 'react-icons/fa';
import PlantChatbotEmbedded from './PlantChatbotEmbedded';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';

// Cute Pineapple Face Component
const AppleFace = ({ className = "w-6 h-6" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pineapple green leafy top */}
      <g>
        {/* Center leaf */}
        <path d="M50 5 L48 20 L52 20 Z" fill="#4CAF50" />
        {/* Left leaves */}
        <path d="M45 8 L40 18 L44 18 Z" fill="#66BB6A" />
        <path d="M40 10 L33 20 L37 20 Z" fill="#81C784" />
        {/* Right leaves */}
        <path d="M55 8 L60 18 L56 18 Z" fill="#66BB6A" />
        <path d="M60 10 L67 20 L63 20 Z" fill="#81C784" />
      </g>
      
      {/* Pineapple body - yellow/golden oval shape */}
      <ellipse cx="50" cy="60" rx="28" ry="35" fill="#FDD835" />
      <ellipse cx="50" cy="60" rx="24" ry="31" fill="#FFEB3B" />
      
      {/* Pineapple texture pattern - diamond/crosshatch */}
      <g opacity="0.3" stroke="#F9A825" strokeWidth="1.5">
        <line x1="35" y1="35" x2="65" y2="35" />
        <line x1="32" y1="45" x2="68" y2="45" />
        <line x1="30" y1="55" x2="70" y2="55" />
        <line x1="32" y1="65" x2="68" y2="65" />
        <line x1="35" y1="75" x2="65" y2="75" />
        <line x1="40" y1="85" x2="60" y2="85" />
      </g>
      <g opacity="0.3" stroke="#F9A825" strokeWidth="1.5">
        <line x1="38" y1="30" x2="38" y2="90" />
        <line x1="50" y1="25" x2="50" y2="95" />
        <line x1="62" y1="30" x2="62" y2="90" />
      </g>
      
      {/* Shine/highlight */}
      <ellipse cx="40" cy="45" rx="8" ry="12" fill="#FFF9C4" opacity="0.6" />
      
      {/* Left eye - cute and sparkly */}
      <g>
        <ellipse cx="40" cy="55" rx="4.5" ry="6" fill="#1A1A1A" />
        <circle cx="41.5" cy="53" r="1.5" fill="white" />
      </g>
      
      {/* Right eye - cute and sparkly */}
      <g>
        <ellipse cx="60" cy="55" rx="4.5" ry="6" fill="#1A1A1A" />
        <circle cx="61.5" cy="53" r="1.5" fill="white" />
      </g>
      
      {/* Sweet smile */}
      <path
        d="M 42 68 Q 50 75, 58 68"
        stroke="#F57F17"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Rosy cheeks */}
      <ellipse cx="32" cy="62" rx="4" ry="3" fill="#FFB74D" opacity="0.5" />
      <ellipse cx="68" cy="62" rx="4" ry="3" fill="#FFB74D" opacity="0.5" />
    </svg>
  );
};

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
              <div className="relative z-10">
                {isMinimized ? (
                  <FaComment className="w-6 h-6" />
                ) : (
                  <AppleFace className="w-8 h-8" />
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
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <AppleFace className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Sprouty Pineapple</h3>
                    <p className="text-xs text-green-100">Your Tropical Garden Buddy</p>
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
