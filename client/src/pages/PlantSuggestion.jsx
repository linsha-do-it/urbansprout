import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLeaf, FaSun, FaHome, FaClock, FaSeedling, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import FloatingChatbot from '../components/FloatingChatbot';
import Logo from '../components/Logo';

const PlantSuggestion = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const questions = [
    {
      id: 'space',
      title: 'What space do you have available?',
      subtitle: 'Choose the option that best describes your growing space',
      options: [
        { value: 'small', label: 'Small Space', description: 'Windowsill, small balcony, or limited indoor space', icon: <FaHome className="w-6 h-6" /> },
        { value: 'medium', label: 'Medium Space', description: 'Patio, small garden bed, or dedicated growing area', icon: <FaHome className="w-6 h-6" /> },
        { value: 'large', label: 'Large Space', description: 'Full garden, multiple beds, or large outdoor area', icon: <FaHome className="w-6 h-6" /> }
      ]
    },
    {
      id: 'sunlight',
      title: 'How much sunlight do you get?',
      subtitle: 'Select the sunlight conditions in your growing area',
      options: [
        { value: 'full_sun', label: 'Full Sun', description: '6+ hours of direct sunlight daily', icon: <FaSun className="w-6 h-6" /> },
        { value: 'partial_sun', label: 'Partial Sun', description: '3-6 hours of direct sunlight daily', icon: <FaSun className="w-6 h-6" /> },
        { value: 'shade', label: 'Shade/Low Light', description: 'Less than 3 hours of direct sunlight', icon: <FaSun className="w-6 h-6" /> }
      ]
    },
    {
      id: 'experience',
      title: 'What\'s your gardening experience?',
      subtitle: 'Help us tailor recommendations to your skill level',
      options: [
        { value: 'beginner', label: 'Beginner', description: 'New to gardening, want easy-to-grow plants', icon: <FaSeedling className="w-6 h-6" /> },
        { value: 'intermediate', label: 'Intermediate', description: 'Some experience, ready for moderate challenges', icon: <FaLeaf className="w-6 h-6" /> },
        { value: 'advanced', label: 'Advanced', description: 'Experienced gardener, comfortable with complex plants', icon: <FaLeaf className="w-6 h-6" /> }
      ]
    },
    {
      id: 'time',
      title: 'How much time can you dedicate?',
      subtitle: 'Choose based on your available time for plant care',
      options: [
        { value: 'low', label: 'Low Maintenance', description: 'Minimal time, prefer low-maintenance plants', icon: <FaClock className="w-6 h-6" /> },
        { value: 'medium', label: 'Moderate Care', description: 'Regular care, weekly attention', icon: <FaClock className="w-6 h-6" /> },
        { value: 'high', label: 'High Maintenance', description: 'Daily attention, intensive care', icon: <FaClock className="w-6 h-6" /> }
      ]
    }
  ];

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      generateResults();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateResults = async () => {
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams({
        sunlight: answers.sunlight || '',
        experience: answers.experience || '',
        space: answers.space || '',
        time: answers.time || ''
      });

      const response = await apiCall(`/plants/quiz?${params.toString()}`, { method: 'GET' });

      if (response.success && response.plants && response.plants.length > 0) {
        setResults({
          plants: response.plants,
          recommendations: 'Here are plants tailored to your answers',
          combinationKey: 'dynamic'
        });
      } else {
        // No plants found in database
        setResults({
          plants: [],
          recommendations: 'No plants found matching your criteria. Please add some plants to the database first.',
          combinationKey: 'empty'
        });
      }
    } catch (error) {
      console.error('Error fetching plant suggestions:', error);
      // Show error message instead of fallback plants
      setResults({
        plants: [],
        recommendations: 'Unable to fetch plant suggestions. Please check your connection and try again.',
        combinationKey: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setResults(null);
  };

  const handleAddToGarden = async (plant) => {
    try {
      const response = await apiCall('/garden/add', {
        method: 'POST',
        body: JSON.stringify({ plant })
      });

      if (response.success) {
        alert(`Added ${plant.name} to your garden!`);
      } else {
        throw new Error(response.message || 'Failed to add plant to garden');
      }
    } catch (error) {
      console.error('Failed to add to garden:', error);
      
      // Fallback to localStorage for offline functionality
      try {
        const key = `my_garden_${user?.id || user?.uid || user?.email || 'guest'}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.includes(plant.name)) {
          const updated = [...existing, plant.name];
          localStorage.setItem(key, JSON.stringify(updated));

          // Persist image mapping so MyGardenJournal can render images
          const imagesKey = `plant_images_${user?.id || user?.uid || user?.email || 'guest'}`;
          const existingImages = JSON.parse(localStorage.getItem(imagesKey) || '{}');
          existingImages[plant.name] = plant.image;
          localStorage.setItem(imagesKey, JSON.stringify(existingImages));

          alert(`Added ${plant.name} to your garden! (Saved locally)`);
        } else {
          alert(`${plant.name} is already in your garden!`);
        }
      } catch (localError) {
        console.error('Local storage fallback failed:', localError);
        alert('Failed to add plant to garden. Please try again.');
      }
    }
  };

  if (results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 py-8 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-forest-green-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-green-100 rounded-full opacity-10 animate-pulse delay-500"></div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center justify-center w-16 h-16 bg-forest-green-100 rounded-full mb-4">
              <FaLeaf className="w-8 h-8 text-forest-green-600" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Perfect Plants!</h1>
            <p className="text-gray-600">{results.recommendations}</p>
          </div>

          {results.plants.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {results.plants.map((plant, index) => (
                <motion.div key={plant.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.1 }} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-white/20">
                  <div className="relative h-48">
                    <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3">
                      <span className="bg-forest-green-100 text-forest-green-700 px-3 py-1 rounded-full text-sm font-medium">{plant.category}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{plant.name}</h3>
                    <p className="text-gray-600 mb-4">{plant.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Growing Time:</span>
                        <span className="font-medium">{plant.growingTime}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Sunlight:</span>
                        <span className="font-medium">{plant.sunlight}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Difficulty:</span>
                        <span className="font-medium">{plant.difficulty}</span>
                      </div>
                    </div>
                    <button onClick={() => handleAddToGarden(plant)} className="w-full mt-4 bg-forest-green-600 text-white py-2 px-4 rounded-lg hover:bg-forest-green-700 transition-colors">
                      Add to My Garden
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-md mx-auto border border-white/20">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaLeaf className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Plants Found</h3>
                <p className="text-gray-600 mb-6">
                  {results.combinationKey === 'empty' 
                    ? "There are no plants in the database that match your criteria. Please add some plants first."
                    : "Unable to fetch plant suggestions. Please check your connection and try again."
                  }
                </p>
                <div className="space-y-3">
                  <button onClick={resetQuiz} className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                    Take Quiz Again
                  </button>
                  {results.combinationKey === 'empty' && (
                    <p className="text-sm text-gray-500">
                      💡 Tip: Use Postman to add plants to your database first!
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <div className="text-center">
            <button onClick={resetQuiz} className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors mr-4">
              Take Quiz Again
            </button>
            {results.plants.length > 0 && (
              <button onClick={() => window.location.href = '/my-garden-journal'} className="bg-forest-green-600 text-white px-6 py-3 rounded-lg hover:bg-forest-green-700 transition-colors">
                View My Garden Journal
              </button>
            )}
          </div>
        </div>
        
        {/* Floating Chatbot */}
        <FloatingChatbot />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 flex items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-forest-green-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-green-100 rounded-full opacity-10 animate-pulse delay-500"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-forest-green-100 rounded-full mb-4">
            <Logo size="lg" className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Finding Your Perfect Plants...</h2>
          <p className="text-gray-600">This may take a moment</p>
        </div>
        
        {/* Floating Chatbot */}
        <FloatingChatbot />
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 py-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-forest-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-green-100 rounded-full opacity-10 animate-pulse delay-500"></div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center justify-center w-16 h-16 bg-forest-green-100 rounded-full mb-4">
            <FaLeaf className="w-8 h-8 text-forest-green-600" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plant Suggestion Quiz</h1>
          <p className="text-gray-600">Answer a few questions to get personalized plant recommendations</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div className="bg-forest-green-600 h-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentQuestion.title}</h2>
            <p className="text-gray-600 mb-8">{currentQuestion.subtitle}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentQuestion.options.map((option, index) => (
                <motion.button key={option.value} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} onClick={() => handleAnswer(currentQuestion.id, option.value)} className={`p-6 rounded-lg border-2 transition-all text-left ${answers[currentQuestion.id] === option.value ? 'border-forest-green-500 bg-forest-green-50' : 'border-gray-200 hover:border-forest-green-300 hover:bg-forest-green-50'}`}>
                  <div className="flex items-center mb-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${answers[currentQuestion.id] === option.value ? 'bg-forest-green-100 text-forest-green-600' : 'bg-gray-100 text-gray-600'}`}>
                      {option.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900">{option.label}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between">
          <button onClick={prevStep} disabled={currentStep === 0} className={`flex items-center px-6 py-3 rounded-lg transition-colors ${currentStep === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-700'}`}>
            <FaArrowLeft className="mr-2" />
            Previous
          </button>

          <button onClick={nextStep} disabled={!answers[currentQuestion.id]} className={`flex items-center px-6 py-3 rounded-lg transition-colors ${!answers[currentQuestion.id] ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-forest-green-600 text-white hover:bg-forest-green-700'}`}>
            {currentStep === questions.length - 1 ? 'Get Results' : 'Next'}
            <FaArrowRight className="ml-2" />
          </button>
        </div>
        
        {/* Floating Chatbot */}
        <FloatingChatbot />
      </div>
    </div>
  );
};

export default PlantSuggestion;

