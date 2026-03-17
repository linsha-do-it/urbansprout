import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const NotificationDebug = () => {
  const { user, token } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔔 Testing notifications...');
      console.log('User:', user);
      console.log('Token:', token);
      
      // Test unread count
      const unreadResponse = await apiCall('/notifications/unread-count');
      console.log('Unread count response:', unreadResponse);
      
      if (unreadResponse.success) {
        setUnreadCount(unreadResponse.data.unreadCount);
      }
      
      // Test notifications list
      const notificationsResponse = await apiCall('/notifications?limit=10');
      console.log('Notifications response:', notificationsResponse);
      
      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.data.notifications);
      }
      
      setDebugInfo({
        user: user ? { email: user.email, id: user._id, role: user.role } : null,
        token: token ? 'Present' : 'Missing',
        unreadCount: unreadResponse.success ? unreadResponse.data.unreadCount : 'Error',
        notificationsCount: notificationsResponse.success ? notificationsResponse.data.notifications.length : 'Error',
        apiBaseUrl: 'http://localhost:5001/api'
      });
      
    } catch (err) {
      console.error('❌ Error testing notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      testNotifications();
    }
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">🔔 Notification System Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Debug Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Debug Information</h2>
          <div className="space-y-2 text-sm">
            <div><strong>User:</strong> {debugInfo.user ? JSON.stringify(debugInfo.user, null, 2) : 'Not logged in'}</div>
            <div><strong>Token:</strong> {debugInfo.token || 'Not available'}</div>
            <div><strong>API Base URL:</strong> {debugInfo.apiBaseUrl || 'Not set'}</div>
            <div><strong>Unread Count:</strong> {debugInfo.unreadCount || 'Not fetched'}</div>
            <div><strong>Notifications Count:</strong> {debugInfo.notificationsCount || 'Not fetched'}</div>
          </div>
        </div>

        {/* Current State */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Current State</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Unread Count:</strong> {unreadCount}</div>
            <div><strong>Notifications:</strong> {notifications.length}</div>
            <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
            <div><strong>Error:</strong> {error || 'None'}</div>
          </div>
        </div>
      </div>

      {/* Test Button */}
      <div className="mt-6">
        <button
          onClick={testNotifications}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Notifications'}
        </button>
      </div>

      {/* Notifications List */}
      {notifications.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Recent Notifications</h2>
          <div className="space-y-2">
            {notifications.map((notif, index) => (
              <div key={notif._id} className={`p-3 rounded-lg border ${notif.isRead ? 'bg-gray-50' : 'bg-blue-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{notif.title}</div>
                    <div className="text-sm text-gray-600">{notif.message}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(notif.createdAt).toLocaleString()} - {notif.isRead ? 'Read' : 'Unread'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{notif.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold">Error:</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default NotificationDebug;




