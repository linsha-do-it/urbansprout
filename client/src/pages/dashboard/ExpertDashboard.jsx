import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaStar, FaEdit, FaUsers, FaChartLine } from 'react-icons/fa';

const ExpertDashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-forest-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-green-100 rounded-full opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">Expert Dashboard 🌟</h2>
          <p className="text-purple-100">
            Share your knowledge and help the UrbanSprout community grow!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FaEdit className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">12</h3>
                <p className="text-gray-600 text-sm">Articles Written</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-forest-green-100 p-3 rounded-lg">
                <FaUsers className="text-forest-green-500 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">248</h3>
                <p className="text-gray-600 text-sm">People Helped</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FaStar className="text-yellow-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">4.8</h3>
                <p className="text-gray-600 text-sm">Expert Rating</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FaChartLine className="text-purple-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">1.2k</h3>
                <p className="text-gray-600 text-sm">Monthly Views</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FaEdit className="text-blue-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">Write Article</h3>
            </div>
            <p className="text-gray-600">Share your plant knowledge with the community</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-forest-green-100 p-3 rounded-lg">
                <FaUsers className="text-forest-green-500 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">Answer Questions</h3>
            </div>
            <p className="text-gray-600">Help beginners with their plant care questions</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FaChartLine className="text-purple-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">View Analytics</h3>
            </div>
            <p className="text-gray-600">Track your impact and engagement metrics</p>
          </button>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Questions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Questions</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900">Why are my plant leaves turning yellow?</h4>
                <p className="text-gray-600 text-sm">Asked by Sarah M. • 2 hours ago</p>
              </div>
              <div className="border-l-4 border-forest-green-500 pl-4">
                <h4 className="font-medium text-gray-900">Best plants for low light conditions?</h4>
                <p className="text-gray-600 text-sm">Asked by Mike R. • 5 hours ago</p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-medium text-gray-900">How often should I water my succulents?</h4>
                <p className="text-gray-600 text-sm">Asked by Emma L. • 1 day ago</p>
              </div>
            </div>
          </div>

          {/* Your Articles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Recent Articles</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <img
                  src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=60&h=60&fit=crop&crop=center"
                  alt="Article"
                  className="w-12 h-12 rounded-lg object-cover mr-3"
                />
                <div>
                  <h4 className="font-medium text-gray-900">Complete Guide to Indoor Plant Care</h4>
                  <p className="text-gray-600 text-sm">Published 3 days ago • 156 views</p>
                </div>
              </div>
              <div className="flex items-start">
                <img
                  src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=60&h=60&fit=crop&crop=center"
                  alt="Article"
                  className="w-12 h-12 rounded-lg object-cover mr-3"
                />
                <div>
                  <h4 className="font-medium text-gray-900">Troubleshooting Common Plant Problems</h4>
                  <p className="text-gray-600 text-sm">Published 1 week ago • 243 views</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExpertDashboard;