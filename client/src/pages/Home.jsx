import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Leaf, Users, Target, ArrowRight } from 'lucide-react'

const Home = () => {
  const navigate = useNavigate()
  const [activeSlide, setActiveSlide] = useState(0)

  const sliderContent = [
    {
      id: 0,
      title: "About Us",
      subtitle: "Growing Green Communities",
      description: "UrbanSprout is dedicated to transforming urban spaces into thriving green environments. We believe that every city dweller deserves access to nature and the benefits of plant life.",
      icon: Users,
      color: "from-forest-green-500 to-forest-green-600"
    },
    {
      id: 1,
      title: "What We Do",
      subtitle: "Cultivating Urban Gardens",
      description: "We provide expert plant recommendations, urban gardening solutions, and comprehensive care guides to help you create your perfect green space, whether it's a balcony garden or indoor oasis.",
      icon: Target,
      color: "from-forest-green-600 to-forest-green-700"
    },
    {
      id: 2,
      title: "Start Planting",
      subtitle: "Begin Your Green Journey",
      description: "Ready to transform your space? Join our community of urban gardeners and get personalized plant recommendations, expert advice, and everything you need to start growing.",
      icon: Leaf,
      color: "from-forest-green-700 to-forest-green-800",
      action: () => navigate('/login')
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute opacity-10"
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + i * 10}%`,
              }}
            >
              <Leaf className="h-8 w-8 text-cream-100" />
            </motion.div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-cream-100 mb-6 text-shadow"
          >
            Cultivate Your
            <span className="block text-cream-300">Urban Oasis</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl text-cream-200 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Transform your urban space into a thriving green sanctuary. Get personalized plant recommendations, expert care guides, and join a community of passionate urban gardeners.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-cream-500 text-forest-green-800 font-semibold rounded-lg hover:bg-cream-400 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Get Plant Suggestions
            </button>
            <button
              onClick={() => document.getElementById('slider-section').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 border-2 border-cream-300 text-cream-100 font-semibold rounded-lg hover:bg-cream-100 hover:text-forest-green-800 transition-all duration-300 transform hover:scale-105"
            >
              Learn More
            </button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ChevronRight className="h-6 w-6 text-cream-200 rotate-90" />
        </motion.div>
      </section>

      {/* Rectangle Slider Section */}
      <section id="slider-section" className="py-20 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-forest-green-800 mb-4">
              Discover UrbanSprout
            </h2>
            <p className="text-lg text-forest-green-600 max-w-2xl mx-auto">
              Explore what makes us the perfect partner for your urban gardening journey
            </p>
          </motion.div>

          {/* Slider Buttons */}
          <div className="flex flex-col lg:flex-row gap-4 mb-12 justify-center">
            {sliderContent.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => setActiveSlide(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-xl transition-all duration-300 flex-1 max-w-sm ${
                  activeSlide === index
                    ? 'bg-forest-green-500 text-cream-100 shadow-xl'
                    : 'bg-white text-forest-green-700 hover:bg-forest-green-50 shadow-md'
                }`}
              >
                <div className="flex items-center justify-center mb-3">
                  {React.createElement(item.icon, { className: "h-8 w-8" })}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className={`text-sm ${
                  activeSlide === index ? 'text-cream-200' : 'text-forest-green-600'
                }`}>
                  {item.subtitle}
                </p>
              </motion.button>
            ))}
          </div>

          {/* Slider Content */}
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className={`h-2 bg-gradient-to-r ${sliderContent[activeSlide].color}`}></div>
            <div className="p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-full bg-gradient-to-r ${sliderContent[activeSlide].color} mr-4`}>
                      {React.createElement(sliderContent[activeSlide].icon, { className: "h-6 w-6 text-cream-100" })}
                    </div>
                    <h3 className="text-2xl font-bold text-forest-green-800">
                      {sliderContent[activeSlide].title}
                    </h3>
                  </div>
                  <h4 className="text-xl text-forest-green-600 mb-4">
                    {sliderContent[activeSlide].subtitle}
                  </h4>
                  <p className="text-forest-green-700 leading-relaxed mb-6">
                    {sliderContent[activeSlide].description}
                  </p>
                  
                  {sliderContent[activeSlide].action && (
                    <motion.button
                      onClick={sliderContent[activeSlide].action}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center px-6 py-3 bg-forest-green-500 text-cream-100 font-semibold rounded-lg hover:bg-forest-green-600 transition-colors duration-300"
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </motion.button>
                  )}
                </div>
                
                <div className="flex-1 max-w-md">
                  <div className={`aspect-square rounded-2xl bg-gradient-to-br ${sliderContent[activeSlide].color} p-8 flex items-center justify-center`}>
                    {React.createElement(sliderContent[activeSlide].icon, { className: "h-24 w-24 text-cream-100 opacity-80" })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-forest-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-forest-green-800 mb-4">
              Why Choose UrbanSprout?
            </h2>
            <p className="text-lg text-forest-green-600 max-w-2xl mx-auto">
              We make urban gardening accessible, enjoyable, and successful for everyone
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Expert Recommendations",
                description: "Get personalized plant suggestions based on your space, experience level, and preferences.",
                icon: "🌱"
              },
              {
                title: "Community Support",
                description: "Join a thriving community of urban gardeners sharing tips, experiences, and inspiration.",
                icon: "👥"
              },
              {
                title: "Comprehensive Guides",
                description: "Access detailed care instructions, troubleshooting tips, and seasonal gardening advice.",
                icon: "📚"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-forest-green-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-forest-green-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home