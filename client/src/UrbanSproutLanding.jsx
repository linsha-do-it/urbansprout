import React, { useState, useEffect } from 'react'
import { apiCall } from '@/utils/api'
import Logo from './components/Logo'

const UrbanSproutLanding = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [communityStats, setCommunityStats] = useState({
    totalUsers: 0,
    totalPlants: 0,
    citiesCount: 0
  })

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    // Add fade-in animation on mount
    setIsVisible(true)

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch community stats
  useEffect(() => {
    const fetchCommunityStats = async () => {
      try {
        const response = await apiCall('/stats/community')
        if (response.success) {
          setCommunityStats(response.data)
        }
      } catch (error) {
        console.error('Error fetching community stats:', error)
        // Keep default values if API fails
      }
    }

    fetchCommunityStats()
  }, [])

  const communityPosts = [
    {
      text: "UrbanSprout is literally chef's kiss! 🍅 My cherry tomatoes are popping off in Mumbai balcony. The reminders are so clutch!",
      name: "Priya Sharma",
      city: "Mumbai",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      text: "UrbanSprout sherikkum adipoli! 🌿 My spinach harvest is absolutely fire! Tracking system next level aanu - never missed watering even during my crazy work schedule.",
      name: "Linsha Ajsal",
      city: "Kerala",
      avatar: "https://share.icloud.com/photos/0204qPBQZ2J-bHssJW_k75l1w"
    },
    {
      text: "Bell peppers thriving in my Bangalore kitchen! This app is pure gold ✨",
      name: "Fathima Ali",
      city: "Bangalore",
      avatar: "https://media.istockphoto.com/id/1429143997/photo/confident-muslim-woman-looking-away-traveling-in-new-york.jpg?s=2048x2048&w=is&k=20&c=10-LbFvCUUp60L1NngPF14bdxDYM-_b1tdzjnAfeDII="
    },
    {
      text: "Cucumber plants were looking sus, but UrbanSprout community came through! These people really know their stuff!",
      name: "Rohan Singh",
      city: "Pune",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    {
      text: "UrbanSprout ரொம்ப நல்லா இருக்கு! 🍓 என் பால்கனியில் ஸ்ட்ராபெர்ரி வளர்த்தது அடி பூமி! டெய்லி ரிமைண்டர்ஸ் ரொம்ப ஹெல்ப்ஃபுல் - இந்த ஆப் சூப்பர்!",
      name: "Ayisha Mohammed",
      city: "Tamil Nadu",
      avatar: "https://images.unsplash.com/photo-1689083591947-a67106e7841e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1287"
    },
    {
      text: "Vertical lettuce growing in my tiny Mumbai kitchen is hitting different! UrbanSprout's space optimization tips are straight up genius!",
      name: "Kavya Reddy",
      city: "Mumbai",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face"
    },
    {
      text: "UrbanSprout bilkul mast hai! 🥕 My carrots from Delhi terrace = chef's kiss! App kaafi helpful hai - tracking system zabardast hai!",
      name: "Mohammed Ali",
      city: "Delhi",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
    }
  ]

  const bottomRowPosts = [
    {
      text: "UrbanSprout's microgreens guide is absolutely slaying! 🌱 Growing fresh greens in my Kochi kitchen has never been this easy.",
      name: "Ameena Rahman",
      city: "Kerala",
      avatar: "https://media.istockphoto.com/id/1764234653/photo/mother-and-her-baby-girl-on-the-beach.jpg?s=2048x2048&w=is&k=20&c=xbBzVbEUC5MkLA1p3eQNojrN3RlPdBHujn6ZWiJLp44="
    },
    {
      text: "ത്രിവേന്ദ്രം ഫ്ലാറ്റിലേയും ടെറസിലേയും പുതിനയും കൊത്തമ്പുല്ലും ഇങ്ങനെ ഫ്രെഷായി വളർത്താം എന്നുള്ളത് പൊളി ആണേ! 😍 സ്പേസ് കുറവാണെങ്കിലും UrbanSprout ടിപ്പ്സും ഐഡിയാസും കൊടുത്താൽ ചെടികൾ പറക്കും പോലെ വളരും! 🌿🔥 ശെരിക്കും അടിപൊളി ആപ്പ് മച്ചാനേ! 👏",
      name: "Deepa Nair",
      city: "Kerala",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      text: "UrbanSprout's herb garden recommendations for my Kolkata balcony are chef's kiss! 🌿",
      name: "Sourav Das",
      city: "Kolkata",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face"
    },
    {
      text: "हैदराबाद में मेरे बालकनी का टमाटर हार्वेस्ट बिल्कुल जबरदस्त है! 🍅 UrbanSprout का सनलाइट ट्रैकिंग फीचर मेरे बालकनी के माइक्रोक्लाइमेट को समझने में काफी मददगार रहा!",
      name: "Rajesh Kumar",
      city: "Hyderabad",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      text: "Chilli plants thriving in my Kozhikode kitchen! UrbanSprout's beginner-friendly approach made everything so simple. The daily tracking features are clutch!",
      name: "Nisha Menon",
      city: "Kerala",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    },
    {
      text: "Cucumber harvest in Ahmedabad is bussin'! 🥒",
      name: "Vikram Patel",
      city: "Ahmedabad",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
    },
    {
      text: "UrbanSprout's vertical gardening tips for my small Jaipur terrace are absolutely legendary! The space optimization features are game-changing.",
      name: "Priyanka Sharma",
      city: "Jaipur",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 font-sans" style={{ fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out transform ${
        isScrolled 
          ? 'bg-gradient-to-r from-forest-green-50/95 via-forest-green-100/95 to-forest-green-50/95 backdrop-blur-md shadow-lg translate-y-0' 
          : 'bg-transparent translate-y-0'
      } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo - Left */}
            <div className="flex-shrink-0 navbar-logo">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg bg-white">
                  <Logo size="md" className="w-full h-full object-cover" />
                </div>
                <h1 className={`text-2xl font-bold transition-all duration-500 ease-in-out transform ${
                  isScrolled ? 'text-gray-900 scale-100' : 'text-gray-900 scale-105'
                }`}>
                  UrbanSprout
                </h1>
              </div>
            </div>

            {/* Center Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a 
                href="/store" 
                className={`navbar-item nav-link text-sm font-medium transition-all duration-300 ease-in-out hover:text-green-500 hover:scale-105 transform hover:shadow-sm ${
                  isScrolled ? 'text-gray-700' : 'text-gray-700'
                }`}
                style={{ animationDelay: '0.1s' }}
              >
                Store
              </a>
                <a
                  href="/blog"
                  className={`navbar-item nav-link text-sm font-medium transition-all duration-300 ease-in-out hover:text-green-500 hover:scale-105 transform hover:shadow-sm ${
                    isScrolled ? 'text-gray-700' : 'text-gray-700'
                  }`}
                  style={{ animationDelay: '0.2s' }}
                >
                  Community
                </a>
              <a 
                href="#about" 
                className={`navbar-item nav-link text-sm font-medium transition-all duration-300 ease-in-out hover:text-green-500 hover:scale-105 transform hover:shadow-sm ${
                  isScrolled ? 'text-gray-700' : 'text-gray-700'
                }`}
                style={{ animationDelay: '0.3s' }}
              >
                About Us
              </a>
            </nav>

            {/* Right Side Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a 
                href="/login" 
                className={`navbar-item nav-link text-sm font-medium transition-all duration-300 ease-in-out hover:text-forest-green-800 hover:scale-105 transform hover:shadow-sm ${
                  isScrolled ? 'text-gray-700' : 'text-gray-700'
                }`}
                style={{ animationDelay: '0.4s' }}
              >
                Login
              </a>
              <a href="/signup" className="navbar-signup bg-gradient-to-r from-forest-green-600 to-forest-green-700 hover:from-forest-green-700 hover:to-forest-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:-translate-y-0.5" style={{ animationDelay: '0.5s' }}>
                Sign Up
              </a>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className={`p-2 rounded-md transition-all duration-300 ease-in-out hover:scale-110 transform ${
                isScrolled ? 'text-gray-700' : 'text-gray-700'
              }`}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pt-[82px]">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/30 via-orange-100/30 to-yellow-100/30"></div>
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-gray-900 mb-6 leading-tight tracking-tight fk-grotesk">
            Grow Your Garden,<br />
            <span className="bg-gradient-to-r from-forest-green-600 to-forest-green-700 bg-clip-text text-transparent">No Matter the Concrete.</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Your personal guide to planting success, tailored to your available space, time, and sunlight conditions.
          </p>
          <div className="flex justify-center items-center">
            <a href="/signup" className="bg-gradient-to-r from-forest-green-600 to-forest-green-700 hover:from-forest-green-700 hover:to-forest-green-800 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
              Start Planting Today
            </a>
          </div>
        </div>
      </section>

      {/* Student Success Stories Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm text-gray-500 mb-2 font-light">
              Student Success Stories
            </p>
            <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-6" style={{ fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
              What our gardeners are saying
            </h2>
            <p className="text-base text-gray-600 max-w-4xl mx-auto mb-12">
              Real stories from our growing community across India who are transforming their urban spaces into thriving green sanctuaries with UrbanSprout.
            </p>
            <a href="/signup" className="inline-block bg-white hover:bg-gray-50 text-gray-900 px-8 py-3 rounded-lg font-medium transition-colors duration-300 transform hover:scale-105 hover:shadow-lg border border-gray-200">
              Join Our Community
            </a>
          </div>
          
          {/* Animated Community Posts */}
          <div className="relative overflow-hidden">
            {/* Left sliding posts */}
            <div className="relative">
              {/* Left fade gradient */}
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-amber-50 via-amber-50/80 to-transparent z-10 pointer-events-none"></div>
              {/* Right fade gradient */}
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-amber-50 via-amber-50/80 to-transparent z-10 pointer-events-none"></div>
              
              <div className="flex animate-scroll space-x-6 max-w-4xl mx-auto">
                {communityPosts.map((post, index) => (
                <div 
                    key={`left-${index}`}
                    className="flex-shrink-0 bg-white rounded-2xl shadow-lg p-8 w-[400px] h-[280px] border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="h-full flex flex-col justify-between">
                      <p className="text-gray-700 text-sm leading-relaxed flex-1">{post.text}</p>
                      <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <img 
                            src={post.avatar} 
                            alt={post.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center" style={{display: 'none'}}>
                            <span className="text-green-600 text-sm font-semibold">
                              {post.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{post.name}</div>
                          <div className="text-xs text-gray-500">{post.city}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right sliding posts */}
            <div className="relative mt-8">
              {/* Left fade gradient */}
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-amber-50 via-amber-50/80 to-transparent z-10 pointer-events-none"></div>
              {/* Right fade gradient */}
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-amber-50 via-amber-50/80 to-transparent z-10 pointer-events-none"></div>
              
              <div className="flex animate-scroll-reverse space-x-6 max-w-4xl mx-auto">
                {bottomRowPosts.map((post, index) => (
                  <div 
                    key={`right-${index}`}
                    className="flex-shrink-0 bg-white rounded-2xl shadow-lg p-8 w-[400px] h-[280px] border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="h-full flex flex-col justify-between">
                      <p className="text-gray-700 text-sm leading-relaxed flex-1">{post.text}</p>
                    <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <img 
                            src={post.avatar} 
                            alt={post.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center" style={{display: 'none'}}>
                        <span className="text-green-600 text-sm font-semibold">
                              {post.name.split(' ').map(n => n[0]).join('')}
                        </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{post.name}</div>
                          <div className="text-xs text-gray-500">{post.city}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-6" style={{ fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
              Join Our Global Gardening Community
            </h2>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              Growing alone is tough. Our community helps you push through with expert advice, seasonal tips, and genuine connections that keep your urban garden thriving.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-forest-green-600 to-forest-green-700 bg-clip-text text-transparent mb-2">
                {communityStats.totalUsers > 0 ? `${communityStats.totalUsers.toLocaleString()}+` : 'Loading...'}
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">Urban Gardeners</div>
              <div className="text-gray-600">Active community members sharing their growing journey</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-forest-green-600 to-forest-green-700 bg-clip-text text-transparent mb-2">
                {communityStats.citiesCount > 0 ? `${communityStats.citiesCount}+` : 'Loading...'}
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">Cities Reached</div>
              <div className="text-gray-600">From Kerala to Kashmir, gardeners across India</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-forest-green-600 to-forest-green-700 bg-clip-text text-transparent mb-2">
                {communityStats.totalPlants > 0 ? `${communityStats.totalPlants.toLocaleString()}+` : 'Loading...'}
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-1">Plant Suggestions</div>
              <div className="text-gray-600">Curated recommendations for every space and climate</div>
            </div>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div>
              <h2 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-6" style={{ fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                Real gardens,<br />
                for the real world.
            </h2>
              <p className="text-base text-gray-600 mb-8">
                Stop dreaming about fresh herbs and start growing them today. Every seed you plant today becomes tomorrow's harvest. UrbanSprout gives you the tools, knowledge, and community to turn your balcony into a thriving garden right now.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="/signup" className="bg-gradient-to-r from-forest-green-600 to-forest-green-700 hover:from-forest-green-700 hover:to-forest-green-800 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-center">
                  Take Your First Step
                </a>
              </div>
            </div>

            {/* Right side - Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://plus.unsplash.com/premium_photo-1722073663401-649204f7ed9e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2651" 
                  alt="Urban gardening in action"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold text-white mb-4">UrbanSprout</h3>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Social</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <h3 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white/30 mb-6" style={{ fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
              UrbanSprout
            </h3>
            <p className="text-gray-400">
              © 2025 UrbanSprout. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for scrolling animation and fonts */}
      <style>{`
        @font-face {
          font-family: 'FK Grotesk Neue';
          src: url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          font-weight: 400 700;
          font-style: normal;
          font-display: swap;
        }
        
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        @keyframes scroll-reverse {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .animate-scroll-reverse {
          animation: scroll-reverse 30s linear infinite;
        }
        
        .animate-scroll:hover,
        .animate-scroll-reverse:hover {
          animation-play-state: paused;
        }
        
        .fk-grotesk {
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        /* Smooth navbar animations */
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .navbar-item {
          animation: slideInFromLeft 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .navbar-logo {
          animation: slideInFromLeft 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .navbar-signup {
          animation: slideInFromRight 0.6s ease-out forwards;
          opacity: 0;
        }
        
        /* Smooth hover effects */
        .nav-link {
          position: relative;
          overflow: hidden;
        }
        
        .nav-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.1), transparent);
          transition: left 0.5s;
        }
        
        .nav-link:hover::before {
          left: 100%;
        }
      `}</style>
    </div>
  )
}

export default UrbanSproutLanding
