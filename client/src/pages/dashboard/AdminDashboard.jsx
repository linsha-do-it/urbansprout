import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiCall } from '../../utils/api';
import { FaCrown, FaUsers, FaStore, FaChartLine, FaCog, FaLock, FaLeaf, FaShoppingBag, FaBox, FaFileAlt } from 'react-icons/fa';
import io from 'socket.io-client';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentSystemActivity, setRecentSystemActivity] = useState([]);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    loadDashboardData();
    
    // Connect to Socket.IO for real-time updates
    const socket = io('http://localhost:5001', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // Listen for admin activity updates
    socket.on('admin_activity', (activity) => {
      console.log('New admin activity received:', activity);
      setRecentSystemActivity(prev => {
        const newActivity = {
          type: 'admin_action',
          title: activity.title || 'Admin Action',
          description: activity.description || 'Admin performed an action',
          timestamp: activity.timestamp || new Date(),
          icon: activity.icon || 'cog',
          adminName: activity.adminName
        };
        
        // Add to beginning and keep only 3 most recent
        const updated = [newActivity, ...prev].slice(0, 3);
        return updated;
      });
    });

    // Cleanup socket connection on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading admin dashboard data...');
      const response = await apiCall('/admin/dashboard');
      console.log('Dashboard API response:', response);
      if (response.success) {
        setStats(response.data.stats);
        setRecentSystemActivity(response.data.recentSystemActivity || []);
        console.log('Dashboard stats loaded:', response.data.stats);
        console.log('Recent system activity loaded:', response.data.recentSystemActivity);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getActivityIcon = (iconType) => {
    switch (iconType) {
      case 'users':
        return <FaUsers className="text-forest-green-500 text-sm" />;
      case 'shopping-bag':
        return <FaShoppingBag className="text-blue-600 text-sm" />;
      case 'file-text':
        return <FaFileAlt className="text-yellow-600 text-sm" />;
      default:
        return <FaUsers className="text-gray-600 text-sm" />;
    }
  };

  const getActivityIconBg = (iconType) => {
    switch (iconType) {
      case 'users':
        return 'bg-forest-green-100';
      case 'shopping-bag':
        return 'bg-blue-100';
      case 'file-text':
        return 'bg-yellow-100';
      default:
        return 'bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

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
        <div className="bg-gradient-to-r from-amber-800 to-yellow-900 rounded-lg p-6 text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">Admin Dashboard 👑</h2>
          <p className="text-amber-50">
            Manage the UrbanSprout platform and monitor system performance.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</h3>
                <p className="text-gray-600 text-sm">Total Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-forest-green-100 p-3 rounded-lg">
                <FaShoppingBag className="text-forest-green-500 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</h3>
                <p className="text-gray-600 text-sm">Total Orders</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FaBox className="text-purple-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</h3>
                <p className="text-gray-600 text-sm">Total Products</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FaChartLine className="text-yellow-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">₹{stats?.totalRevenue || 0}</h3>
                <p className="text-gray-600 text-sm">Total Revenue (Delivered Orders)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">User Management</h3>
            </div>
            <p className="text-gray-600">Manage users, roles, and permissions</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-forest-green-100 p-3 rounded-lg">
                <FaStore className="text-forest-green-500 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">Vendor Approval</h3>
            </div>
            <p className="text-gray-600">Review and approve vendor applications</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <FaLock className="text-red-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-4">Content Moderation</h3>
            </div>
            <p className="text-gray-600">Review flagged content and comments</p>
          </button>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent System Activity</h3>
            <div className="space-y-4">
              {recentSystemActivity.length > 0 ? (
                recentSystemActivity.map((activity, index) => (
                  <div key={index} className="flex items-start">
                    <div className={`${getActivityIconBg(activity.icon)} p-2 rounded-full mr-3`}>
                      {getActivityIcon(activity.icon)}
                    </div>
                 <div>
                   <h4 className="font-medium text-gray-900">{activity.title}</h4>
                   <p className="text-gray-600 text-sm">
                     {activity.description}
                     {activity.adminName && <span className="text-blue-600 font-medium"> by {activity.adminName}</span>}
                     {' • '}{formatTimeAgo(activity.timestamp)}
                   </p>
                 </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Server Status</span>
                <span className="px-2 py-1 text-xs bg-forest-green-100 text-forest-green-800 rounded-full">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Database</span>
                <span className="px-2 py-1 text-xs bg-forest-green-100 text-forest-green-800 rounded-full">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">API Response Time</span>
                <span className="text-gray-900 font-medium">145ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Active Sessions</span>
                <span className="text-gray-900 font-medium">234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Storage Used</span>
                <span className="text-gray-900 font-medium">67%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Admin Tools */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FaCog className="text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">System Settings</span>
            </button>
            <button className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FaChartLine className="text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Analytics</span>
            </button>
            <button className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FaLock className="text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Security Logs</span>
            </button>
            <button className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FaUsers className="text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Bulk Actions</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;