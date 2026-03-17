import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Leaf, Menu, X, Send, Check } from 'lucide-react'
import Logo from '../components/Logo'

// Scroll-triggered wrapper
const AnimateOnScroll = ({ children, className = '', delay = 0 }) => {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const NewHomePage = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Overview', href: '#overview' },
    { label: 'Why UrbanSprout?', href: '#why' },
    { label: 'Community', href: '#community' },
    { label: 'Resources', href: '/blog' },
    { label: 'Store', href: '/store' },
  ]

  const collageImages = [
    { src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop', label: 'Planting' },
    { src: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop', label: 'Growing' },
    { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', label: 'Teaching' },
    { src: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop', label: 'Community' },
    { src: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&h=400&fit=crop', label: 'Selling' },
    { src: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=400&fit=crop', label: 'Helping' },
  ]

  const featureCards = [
    {
      title: 'Grow Together',
      description: 'Connect with plant parents who share tips, swaps, and support. Our community makes every beginner feel welcome and every expert valued.',
      icon: '🌱',
    },
    {
      title: 'Safe & Trusted',
      description: 'UrbanSprout keeps your garden data and preferences private. Buy and sell with confidence through verified vendors and secure transactions.',
      icon: '🛡️',
    },
    {
      title: '5-Star Support',
      description: 'Quick, friendly help for everything from plant ID to order issues. We’re here so you can focus on growing, not troubleshooting.',
      icon: '⭐',
    },
  ]

  const userTypes = [
    {
      id: 'beginner',
      title: 'Beginners',
      subtitle: 'Start your plant journey with guidance that fits your space, time, and light—and a community that cheers you on.',
      bullets: [
        'Personalized plant suggestions for your space and lifestyle',
        'Care reminders and tips so you never miss a watering',
        'Join the community and learn from other plant parents',
        'Track your plants and see your green thumb grow',
      ],
      image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&h=500&fit=crop',
      overlayTitle: 'Your Plants',
      overlayItems: ['Succulents', 'Herbs', 'Indoor greens', 'Low light'],
    },
    {
      id: 'vendor',
      title: 'Vendors',
      subtitle: 'Reach plant lovers who are ready to buy. List your plants and products, manage orders, and grow your green business.',
      bullets: [
        'List plants, pots, and gardening gear in one place',
        'Set your own prices and manage inventory easily',
        'Get paid securely with transparent payouts',
        'Showcase your storefront to the whole community',
      ],
      image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600&h=500&fit=crop',
      overlayTitle: 'Your Listings',
      overlayItems: ['Seeds', 'Pots', 'Soil', 'Tools'],
    },
    {
      id: 'expert',
      title: 'Experts',
      subtitle: 'Share your knowledge through courses and advice. Help beginners succeed and build your reputation in the plant community.',
      bullets: [
        'Create and sell courses on plant care and gardening',
        'Answer questions and earn recognition in the community',
        'Reach learners who want to grow their skills',
        'Build a following as a trusted plant expert',
      ],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=500&fit=crop',
      overlayTitle: 'Your Impact',
      overlayItems: ['Courses', 'Q&A', 'Guides', 'Workshops'],
    },
  ]

  const testimonials = [
    {
      quote: 'UrbanSprout helped me go from killing succulents to growing a balcony full of herbs. The reminders and community tips are game-changers.',
      name: 'Priya Sharma',
      role: 'Plant parent',
      badge: 'Beginner',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
      bgColor: 'bg-lavender-100',
    },
    {
      quote: 'Our small nursery finally has a place to reach plant lovers beyond our neighborhood. Sales are up and the community is so supportive.',
      name: 'Raj Mehta',
      role: 'Nursery owner',
      badge: 'Vendor',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      bgColor: 'bg-amber-50',
    },
    {
      quote: 'I moved from employee benefits to a personalized plant-learning experience. My students actually finish the courses and come back for more.',
      name: 'Dr. Kavya Reddy',
      role: 'Horticulturist',
      badge: 'Expert',
      image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face',
      bgColor: 'bg-mint-100',
    },
  ]

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* Header - Tedy style */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center">
                <Logo size="sm" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-semibold text-gray-900">UrbanSprout</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
                link.href.startsWith('#') ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                Join the community
              </Link>
              <Link
                to="/login"
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>

            <button
              type="button"
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2">
            {navLinks.map((link) =>
              link.href.startsWith('#') ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="block py-2 text-gray-600 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="block py-2 text-gray-600 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
            <div className="pt-4 flex flex-col gap-2">
              <Link to="/signup" className="btn bg-emerald-500 text-white text-center py-2.5 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Join the community
              </Link>
              <Link to="/login" className="btn bg-gray-900 text-white text-center py-2.5 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Sign in
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero - central image, minimal text */}
      <section id="overview" className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-4">
        <div className="w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="rounded-2xl overflow-hidden shadow-2xl aspect-square max-h-[85vh] object-cover"
          >
            <img
              src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&h=900&fit=crop"
              alt="Plant community—planting, growing, and learning together"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Trusted by / strap line */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">Trusted by plant parents everywhere</p>
          <AnimateOnScroll>
            <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto">
              UrbanSprout helps you grow—whether you’re planting your first succulent, selling from your nursery, or teaching the next generation of gardeners.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Collage - "Works like a charm" style categories */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-semibold text-gray-900 mb-4">
              Works like a charm
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Plant, sell, teach, and grow together—all in one place. Your space, your pace, your community.
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.1}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {collageImages.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="relative rounded-2xl overflow-hidden aspect-square group"
                >
                  <img
                    src={item.src}
                    alt={item.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-3 left-3 right-3 text-white font-medium text-sm sm:text-base drop-shadow">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Going beyond - 3 feature cards */}
      <section id="why" className="py-20 sm:py-28 bg-[#E8E6F7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-semibold text-gray-900 mb-4">
              More than just plants
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              UrbanSprout is your full toolkit: learn, buy, sell, and connect with a community that gets it. We help plant moms, dads, and everyone in between grow.
            </p>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {featureCards.map((card, i) => (
              <AnimateOnScroll key={card.title} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-4xl mb-4">{card.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{card.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{card.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* User types: Beginner, Vendor, Expert */}
      <section id="community" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {userTypes.map((type, sectionIndex) => (
            <AnimateOnScroll key={type.id} delay={0.1}>
              <div
                className={`flex flex-col gap-12 lg:gap-16 mb-24 last:mb-0 ${
                  sectionIndex % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'
                }`}
              >
                <div className="lg:w-1/2 flex flex-col justify-center">
                  <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-gray-900 mb-3">
                    {type.title}
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">{type.subtitle}</p>
                  <ul className="space-y-4">
                    {type.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        </span>
                        <span className="text-gray-700">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="lg:w-1/2 relative">
                  <div className="rounded-2xl overflow-hidden shadow-xl">
                    <img
                      src={type.image}
                      alt={type.title}
                      className="w-full h-[320px] sm:h-[400px] object-cover"
                    />
                  </div>
                  <div className="absolute bottom-6 right-6 left-6 sm:left-auto sm:w-56 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
                    <p className="text-sm font-semibold text-gray-900 mb-2">{type.overlayTitle}</p>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {type.overlayItems.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* Testimonials - staggered cards */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-semibold text-gray-900 mb-4">
              Trusted by plant parents
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Plant mommies, plant daddies, vendors, and experts—see what the community is saying.
            </p>
          </AnimateOnScroll>

          <div className="space-y-6 sm:space-y-8">
            {testimonials.map((t, i) => (
              <AnimateOnScroll key={t.name} delay={i * 0.15}>
                <div
                  className={`rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row gap-8 items-start ${t.bgColor}`}
                  style={{
                    marginLeft: i % 2 === 0 ? 0 : 'clamp(0rem, 5vw, 3rem)',
                    marginRight: i % 2 === 1 ? 0 : 'clamp(0rem, 5vw, 3rem)',
                  }}
                >
                  <div className="flex-1">
                    <span className="text-6xl font-serif text-gray-400 leading-none">"</span>
                    <p className="text-lg text-gray-800 mt-2 mb-6">{t.quote}</p>
                    <p className="text-sm font-medium text-gray-700">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-center gap-3">
                    <div className="rounded-xl overflow-hidden w-24 h-24 sm:w-28 sm:h-28">
                      <img
                        src={t.image}
                        alt={t.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 bg-white/80 px-3 py-1.5 rounded-lg">
                      {t.badge}
                    </span>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Schedule a demo style */}
      <section className="py-20 sm:py-28 bg-[#E8E6F7]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-gray-900 mb-4">
              Ready to grow?
            </h2>
            <p className="text-lg text-gray-700 mb-10">
              Join UrbanSprout and start planting, selling, or teaching—with a community that grows together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl text-base font-medium transition-colors"
              >
                <Leaf className="w-5 h-5" />
                Join the community
              </Link>
              <Link
                to="/store"
                className="inline-flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-xl text-base font-medium transition-colors"
              >
                Browse the store
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Logo size="sm" className="opacity-80" />
              <span className="font-semibold text-white">UrbanSprout</span>
            </div>
            <div className="flex gap-8">
              <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
              <Link to="/store" className="hover:text-white transition-colors">Store</Link>
              <a href="#overview" className="hover:text-white transition-colors">Overview</a>
            </div>
          </div>
          <p className="mt-8 text-center sm:text-left text-sm">
            © {new Date().getFullYear()} UrbanSprout. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Pastel colors used by testimonials - ensure Tailwind can compile */}
      <style>{`
        .bg-lavender-100 { background-color: #EDE9F7; }
        .bg-mint-100 { background-color: #D1FAE5; }
      `}</style>
    </div>
  )
}

export default NewHomePage
