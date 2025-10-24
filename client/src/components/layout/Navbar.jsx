import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Leaf, User, LogOut, Shield, BarChart3, Users, Package, FileText, ShoppingBag, Cog } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'
import NotificationIcon from '../NotificationIcon'
import Logo from '../Logo'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, clearAllData } = useAuth()

  // Handle scroll effect for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Define navigation items based on user role
  const getNavItems = () => {
    const baseItems = [
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: 'Plant Suggestion', path: '/plant-suggestion', requiresAuth: true },
      { name: 'Store', path: '/store', requiresAuth: true },
      { name: 'Dashboard', path: '/dashboard', requiresAuth: true },
    ]

    // For admin users, show no navigation items (admin panel and dashboard will be separate buttons)
    if (user?.role === 'admin') {
      return []
    }

    // Hide Home when a user is logged in
    return isAuthenticated ? baseItems.filter(item => item.name !== 'Home') : baseItems
  }

  const navItems = getNavItems()

  const handleNavClick = (item) => {
    if (item.requiresAuth && !isAuthenticated) {
      navigate('/signup')
    } else if (item.adminOnly && user?.role !== 'admin') {
      navigate('/unauthorized')
    } else {
      navigate(item.path)
    }
  }

  const handleAdminPanelClick = (path) => {
    navigate(path)
  }

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
    setUserMenuOpen(false)
  }

  // Development helper: Double-click logo to clear all data
  const handleLogoClearData = () => {
    if (process.env.NODE_ENV === 'development') {
      clearAllData();
      navigate('/');
      setUserMenuOpen(false);
      alert('All authentication data cleared! Please refresh the page.');
    }
  }

  const getDashboardPath = () => {
    if (!user) return '/dashboard'
    switch (user.role) {
      case 'admin': return '/admin/dashboard'
      case 'vendor': return '/vendor/dashboard'
      case 'expert': return '/expert/dashboard'
      default: return '/dashboard'
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'vendor': return 'bg-green-100 text-green-800'
      case 'expert': return 'bg-purple-100 text-purple-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out",
      isScrolled 
        ? "bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/20" 
        : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-[82px]">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 group"
            onDoubleClick={handleLogoClearData}
            title="Double-click to clear all data (development)"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <Logo size="xl" className="w-full h-full object-cover" />
              </div>
            </motion.div>
            <motion.span 
              className="text-2xl font-bold bg-gradient-to-r from-forest-green-600 to-forest-green-800 bg-clip-text text-transparent"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              UrbanSprout
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Only show navigation items if there are any (not for admin users) */}
            {navItems.length > 0 && navItems.map((item) => (
              <motion.button
                key={item.name}
                onClick={() => handleNavClick(item)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative px-6 py-3 text-sm font-medium transition-all duration-300 ease-out rounded-xl group",
                  isActive(item.path)
                    ? "text-forest-green-700 bg-forest-green-50/50"
                    : "text-gray-600 hover:text-forest-green-700 hover:bg-white/50"
                )}
              >
                <span className="relative z-10">{item.name}</span>
                {isActive(item.path) && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-forest-green-100/80 to-forest-green-50/80 rounded-xl border border-forest-green-200/50"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-forest-green-100/60 to-forest-green-50/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />
              </motion.button>
            ))}
            
            {/* Admin Panel Button - Only for admin users */}
            {user?.role === 'admin' && (
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200/50">
                <motion.button
                  onClick={() => handleAdminPanelClick('/admin/users')}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-300 ease-out rounded-xl group",
                    location.pathname.startsWith('/admin') && location.pathname !== '/admin'
                      ? "text-forest-green-700 bg-forest-green-50/50"
                      : "text-gray-600 hover:text-forest-green-700 hover:bg-white/50"
                  )}
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin Panel</span>
                </motion.button>
                
                {/* Admin Dashboard Button - Only for admin users */}
                <motion.button
                  onClick={() => handleAdminPanelClick('/admin')}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-300 ease-out rounded-xl group",
                    location.pathname === '/admin'
                      ? "text-forest-green-700 bg-forest-green-50/50"
                      : "text-gray-600 hover:text-forest-green-700 hover:bg-white/50"
                  )}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </motion.button>
              </div>
            )}
            
            {/* Auth Section */}
            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200/50">
              {isAuthenticated ? (
                <>
                  {/* Notification Icon */}
                  <div className="relative">
                    <NotificationIcon />
                  </div>
                  
                  <div className="relative">
                    <motion.button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/50 transition-all duration-300 group"
                    >
                      {user.avatar ? (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-forest-green-400 to-forest-green-600 rounded-full blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                          <img
                            src={user.avatar.startsWith('/api/profile-photo/') ? `http://localhost:5001${user.avatar}` : user.avatar}
                            alt={user.name}
                            className="relative w-10 h-10 rounded-full border-2 border-white/50 shadow-lg object-cover"
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-forest-green-400 to-forest-green-600 rounded-full blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                          <div className="relative w-10 h-10 bg-gradient-to-br from-forest-green-500 to-forest-green-600 rounded-full flex items-center justify-center shadow-lg">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="text-left">
                        <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </div>
                      </div>
                    </motion.button>
                  
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-3 w-56 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl py-2 z-50"
                        >
                          <Link
                            to="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-forest-green-50/50 hover:text-forest-green-700 transition-all duration-200 rounded-lg mx-2"
                          >
                            <User className="w-4 h-4 mr-3" />
                            Profile
                          </Link>
                          <div className="border-t border-gray-200/50 my-2"></div>
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50/50 hover:text-red-700 transition-all duration-200 rounded-lg mx-2"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/login"
                      className="text-sm font-medium text-gray-600 hover:text-forest-green-700 transition-colors duration-300 px-4 py-2 rounded-xl hover:bg-white/50"
                    >
                      Login
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/signup"
                      className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-forest-green-600 to-forest-green-700 rounded-xl hover:from-forest-green-700 hover:to-forest-green-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Sign Up
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-xl text-gray-600 hover:text-forest-green-700 hover:bg-white/50 transition-all duration-300"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden bg-white/90 backdrop-blur-xl border-t border-white/20"
            >
              <div className="py-6 px-6 space-y-3">
                {/* Only show navigation items if there are any (not for admin users) */}
                {navItems.length > 0 && navItems.map((item) => (
                  <motion.button
                    key={item.name}
                    onClick={() => {
                      handleNavClick(item)
                      setIsOpen(false)
                    }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300",
                      isActive(item.path)
                        ? "text-forest-green-700 bg-forest-green-50/50"
                        : "text-gray-600 hover:text-forest-green-700 hover:bg-white/50"
                    )}
                  >
                    {item.name}
                  </motion.button>
                ))}
            
                {/* Admin Dashboard Button for Mobile - Only for admin users */}
                {user?.role === 'admin' && (
                  <div className="pt-4 border-t border-gray-200/50">
                    <motion.button
                      onClick={() => {
                        handleAdminPanelClick('/admin')
                        setIsOpen(false)
                      }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "w-full text-left px-4 py-3 text-sm font-medium transition-all duration-300 rounded-xl",
                        location.pathname === '/admin'
                          ? "text-forest-green-700 bg-forest-green-50/50"
                          : "text-gray-600 hover:text-forest-green-700 hover:bg-white/50"
                      )}
                    >
                      <BarChart3 className="h-4 w-4 inline mr-3" />
                      Admin Dashboard
                    </motion.button>
                  </div>
                )}
            
                {/* Admin Panel Section for Mobile - Only for admin users */}
                {user?.role === 'admin' && (
                  <div className="pt-4 border-t border-gray-200/50">
                    <div className="px-4 py-3">
                      <div className="flex items-center space-x-2 text-sm font-semibold text-forest-green-700">
                        <Shield className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <motion.button
                        onClick={() => {
                          handleAdminPanelClick('/admin/users')
                          setIsOpen(false)
                        }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full text-left px-6 py-3 text-sm font-medium transition-all duration-300 rounded-xl",
                          location.pathname === '/admin/users'
                            ? "text-forest-green-700 bg-forest-green-50/50"
                            : "text-gray-600 hover:text-forest-green-700 hover:bg-white/50"
                        )}
                      >
                        <Users className="h-4 w-4 inline mr-3" />
                        Users
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          handleAdminPanelClick('/admin/products')
                          setIsOpen(false)
                        }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full text-left px-6 py-3 text-sm font-medium transition-all duration-300 rounded-xl",
                          location.pathname === '/admin/products'
                            ? "text-forest-green-700 bg-forest-green-50/50"
                            : "text-gray-600 hover:text-forest-green-700 hover:bg-white/50"
                        )}
                      >
                        <Package className="h-4 w-4 inline mr-3" />
                        Products
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          handleAdminPanelClick('/admin/blog')
                          setIsOpen(false)
                        }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full text-left px-6 py-3 text-sm font-medium transition-all duration-300 rounded-xl",
                          location.pathname === '/admin/blog'
                            ? "text-forest-green-700 bg-forest-green-50/50"
                            : "text-gray-600 hover:text-forest-green-700 hover:bg-white/50"
                        )}
                      >
                        <FileText className="h-4 w-4 inline mr-3" />
                        Blog Posts
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          handleAdminPanelClick('/admin/orders')
                          setIsOpen(false)
                        }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full text-left px-6 py-3 text-sm font-medium transition-all duration-300 rounded-xl",
                          location.pathname === '/admin/orders'
                            ? "text-forest-green-700 bg-forest-green-50/50"
                            : "text-gray-600 hover:text-forest-green-700 hover:bg-white/50"
                        )}
                      >
                        <ShoppingBag className="h-4 w-4 inline mr-3" />
                        Orders
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          handleAdminPanelClick('/admin/settings')
                          setIsOpen(false)
                        }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full text-left px-6 py-3 text-sm font-medium transition-all duration-300 rounded-xl",
                          location.pathname === '/admin/settings'
                            ? "text-forest-green-700 bg-forest-green-50/50"
                            : "text-gray-600 hover:text-forest-green-700 hover:bg-white/50"
                        )}
                      >
                        <Cog className="h-4 w-4 inline mr-3" />
                        Settings
                      </motion.button>
                    </div>
                  </div>
                )}
            
                <div className={navItems.length > 0 ? "pt-4 space-y-3 border-t border-gray-200/50" : "space-y-3"}>
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-3 bg-gradient-to-r from-forest-green-50/50 to-forest-green-100/50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar.startsWith('/api/profile-photo/') ? `http://localhost:5001${user.avatar}` : user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full border-2 border-white/50 shadow-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-forest-green-500 to-forest-green-600 rounded-full flex items-center justify-center shadow-lg">
                              <User className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                            <div className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(user.role)}`}>
                              {user.role}
                            </div>
                          </div>
                        </div>
                      </div>
                      <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                        <Link
                          to="/profile"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-forest-green-700 hover:bg-white/50 rounded-xl transition-all duration-300"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                      </motion.div>
                      <motion.button
                        onClick={() => {
                          handleLogout()
                          setIsOpen(false)
                        }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50/50 hover:text-red-700 rounded-xl transition-all duration-300"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                        <Link
                          to="/login"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-forest-green-700 hover:bg-white/50 rounded-xl transition-all duration-300"
                        >
                          Login
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                        <Link
                          to="/signup"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-forest-green-600 to-forest-green-700 hover:from-forest-green-700 hover:to-forest-green-800 rounded-xl transition-all duration-300 shadow-lg"
                        >
                          Sign Up
                        </Link>
                      </motion.div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

export default Navbar