import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { FaLeaf, FaStore, FaBook, FaSeedling, FaUser, FaSignOutAlt, FaTachometerAlt } from 'react-icons/fa'
import Avatar from '../Avatar'

const DashboardNavbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👑'
      case 'expert': return '🌟'
      case 'vendor': return '🏪'
      default: return '🌱'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500'
      case 'expert': return 'bg-purple-500'
      case 'vendor': return 'bg-green-500'
      default: return 'bg-blue-500'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <FaLeaf className="text-2xl text-green-600" />
              <span className="text-xl font-bold text-gray-900">UrbanSprout</span>
            </Link>
            
            {/* Role Badge */}
            <div className="flex items-center space-x-2">
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getRoleColor(user?.role)}`}>
                <span className="mr-1">{getRoleIcon(user?.role)}</span>
                {user?.role || 'User'}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/dashboard" 
              className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
            >
              <FaTachometerAlt className="mr-1" />
              Dashboard
            </Link>
            <Link 
              to="/plant-suggestion" 
              className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
            >
              <FaSeedling className="mr-1" />
              Plant Assistant
            </Link>
            <Link 
              to="/blog" 
              className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
            >
              <FaBook className="mr-1" />
              Community Blog
            </Link>
            <Link 
              to="/store" 
              className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
            >
              <FaStore className="mr-1" />
              Store
            </Link>
            <Link 
              to="/profile" 
              className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
            >
              <FaUser className="mr-1" />
              Profile
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="hidden sm:flex items-center space-x-3">
              <Link to="/profile" className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2 transition-colors">
                <Avatar user={user} size="sm" />
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || user?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </Link>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <FaSignOutAlt className="mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 border-t border-gray-200 mt-3">
          <nav className="flex flex-wrap gap-4 pt-3">
            <Link 
              to="/dashboard" 
              className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              <FaTachometerAlt className="mr-1" />
              Dashboard
            </Link>
            <Link 
              to="/plant-suggestion" 
              className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              <FaSeedling className="mr-1" />
              Plant Assistant
            </Link>
            <Link 
              to="/blog" 
              className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              <FaBook className="mr-1" />
              Community Blog
            </Link>
            <Link 
              to="/store" 
              className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              <FaStore className="mr-1" />
              Store
            </Link>
            <Link 
              to="/profile" 
              className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              <FaUser className="mr-1" />
              Profile
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default DashboardNavbar
