import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaStore, FaBox, FaChartLine, FaDollarSign, FaShoppingCart } from 'react-icons/fa';

const VendorDashboard = () => {
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
        <div className="bg-gradient-to-r from-forest-green-500 to-teal-600 rounded-lg p-6 text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">Vendor Dashboard 🏪</h2>
          <p className="text-green-100">
            Manage your plant inventory and grow your business with UrbanSprout!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-forest-green-100 p-3 rounded-lg">
                <FaDollarSign className="text-forest-green-500 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">₹2,450</h3>
                <p className="text-gray-600 text-sm">Monthly Revenue</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FaShoppingCart className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">47</h3>
                <p className="text-gray-600 text-sm">Orders This Month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FaBox className="text-purple-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">23</h3>
                <p className="text-gray-600 text-sm">Products Listed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FaChartLine className="text-yellow-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">4.7</h3>
                <p className="text-gray-600 text-sm">Store Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-forest-green-100 p-3 rounded-lg">
                <FaBox className="text-forest-green-500 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">Add Product</h3>
            </div>
            <p className="text-gray-600">List new plants and gardening supplies</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FaShoppingCart className="text-blue-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">Manage Orders</h3>
            </div>
            <p className="text-gray-600">Process and track customer orders</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FaChartLine className="text-purple-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">View Analytics</h3>
            </div>
            <p className="text-gray-600">Track sales performance and trends</p>
          </button>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">#ORD-001234</h4>
                  <p className="text-gray-600 text-sm">Snake Plant + Pot • ₹45.99</p>
                </div>
                <span className="px-2 py-1 text-xs bg-forest-green-100 text-forest-green-800 rounded-full">
                  Shipped
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">#ORD-001235</h4>
                  <p className="text-gray-600 text-sm">Monstera Deliciosa • ₹89.99</p>
                </div>
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Processing
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">#ORD-001236</h4>
                  <p className="text-gray-600 text-sm">Pothos Bundle • ₹29.99</p>
                </div>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  New
                </span>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <img
                  src="https://images.unsplash.com/photo-1509423350716-97f2360af2e4?w=60&h=60&fit=crop&crop=center"
                  alt="Snake Plant"
                  className="w-12 h-12 rounded-lg object-cover mr-3"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Snake Plant</h4>
                  <p className="text-gray-600 text-sm">15 sold this month</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹45.99</p>
                  <p className="text-forest-green-500 text-sm">+12%</p>
                </div>
              </div>
              <div className="flex items-center">
                <img
                  src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=60&h=60&fit=crop&crop=center"
                  alt="Pothos"
                  className="w-12 h-12 rounded-lg object-cover mr-3"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Golden Pothos</h4>
                  <p className="text-gray-600 text-sm">12 sold this month</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹29.99</p>
                  <p className="text-forest-green-500 text-sm">+8%</p>
                </div>
              </div>
              <div className="flex items-center">
                <img
                  src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=60&h=60&fit=crop&crop=center"
                  alt="Monstera"
                  className="w-12 h-12 rounded-lg object-cover mr-3"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Monstera Deliciosa</h4>
                  <p className="text-gray-600 text-sm">8 sold this month</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹89.99</p>
                  <p className="text-forest-green-500 text-sm">+5%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VendorDashboard;