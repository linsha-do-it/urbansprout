import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, X, AlertCircle, CheckCircle, Info, MessageSquare } from 'lucide-react';
import { apiCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';

const NotificationIcon = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const notificationCache = useRef(new Map());
  const lastFetchTime = useRef(0);
  const CACHE_DURATION = 30000; // 30 seconds

  // Clear cache when user changes
  useEffect(() => {
    // console.log('🔔 User changed, clearing notification cache');
    notificationCache.current.clear();
    lastFetchTime.current = 0;
    setNotifications([]);
    setUnreadCount(0);
  }, [user?._id || user?.id || user?.uid]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !token) {
      console.log('🔔 No user or token for WebSocket connection');
      return;
    }

    // console.log('🔔 Initializing WebSocket connection for user:', user.email);

    const newSocket = io('http://localhost:5001', {
      auth: {
        token: token
      },
      transports: ['polling', 'websocket'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from notification server:', reason);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to notification server after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to notification server');
      setIsConnected(false);
    });

    newSocket.on('new_notification', (notification) => {
      console.log('New notification received:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    });

    newSocket.on('unread_count_update', (data) => {
      setUnreadCount(data.unreadCount);
    });

    newSocket.on('notification_read', (data) => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === data.notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
    });

    newSocket.on('all_notifications_read', () => {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
        newSocket.close();
      }
    };
  }, [user, token]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch notifications with caching
  const fetchNotifications = useCallback(async (forceRefresh = false) => {
    // console.log('🔔 fetchNotifications called', { 
    //   forceRefresh, 
    //   userId: user?._id, 
    //   userEmail: user?.email,
    //   tokenExists: !!token 
    // });

    const userId = user?._id || user?.id || user?.uid;
    if (!userId) {
      // console.log('🔔 No user ID available for fetching notifications');
      return;
    }

    const now = Date.now();
    const cacheKey = `notifications_${userId}`;
    
    // Use cache if not forcing refresh and cache is still valid
    if (!forceRefresh && 
        notificationCache.current.has(cacheKey) && 
        (now - lastFetchTime.current) < CACHE_DURATION) {
      const cached = notificationCache.current.get(cacheKey);
      setNotifications(cached.notifications);
      setUnreadCount(cached.unreadCount);
      // console.log('🔔 Using cached notifications for user:', user.email);
      return;
    }

    try {
      setLoading(true);
      // console.log('🔔 Starting API call for notifications...');
      // console.log('🔔 User:', user?.email, 'ID:', user?._id);
      // console.log('🔔 Token available:', !!token);
      // console.log('🔔 API URL:', '/notifications?limit=20');
      
      const response = await apiCall('/notifications?limit=20');
      // console.log('🔔 Raw API response:', response);
      
      if (response && response.success) {
        const data = response.data;
        // console.log('🔔 Parsed data:', data);
        // console.log('🔔 Notifications array length:', data?.notifications?.length || 0);
        // console.log('🔔 Unread count:', data?.unreadCount || 0);
        
        if (data?.notifications && Array.isArray(data.notifications)) {
          // console.log('🔔 Setting notifications:', data.notifications.map(n => ({
          //   id: n._id,
          //   title: n.title,
          //   message: n.message,
          //   type: n.type
          // })));
          setNotifications(data.notifications);
        } else {
          // console.log('🔔 No notifications array found, setting empty array');
          setNotifications([]);
        }
        
        setUnreadCount(data?.unreadCount || 0);
        // console.log(`🔔 Final state: ${data?.notifications?.length || 0} notifications, ${data?.unreadCount || 0} unread`);
        
        // Cache the result with user-specific key
        notificationCache.current.set(cacheKey, data);
        lastFetchTime.current = now;
      } else {
        console.error('❌ API returned error or invalid response:', response);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      // console.error('❌ Error stack:', error.stack);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      // console.log('🔔 fetchNotifications completed');
    }
  }, [user, token]);

  // Fetch unread count only (lightweight)
  const fetchUnreadCount = useCallback(async (retryCount = 0) => {
    // console.log('🔔 fetchUnreadCount called', { 
    //   retryCount, 
    //   userId: user?._id, 
    //   userEmail: user?.email,
    //   tokenExists: !!token 
    // });

    const userId = user?._id || user?.id || user?.uid;
    if (!userId) {
      // console.log('🔔 No user ID available for fetching unread count');
      return;
    }

    try {
      // console.log(`🔔 Fetching unread count for user: ${user?.email} (attempt ${retryCount + 1})`);
      const response = await apiCall('/notifications/unread-count');
      // console.log('🔔 Unread count API response:', response);
      
      if (response && response.success) {
        const unreadCount = response.data?.unreadCount || 0;
        // console.log(`🔔 Setting unread count: ${unreadCount}`);
        setUnreadCount(unreadCount);
      } else {
        console.error('❌ Unread count API returned error:', response);
        if (retryCount < 2) {
          // console.log('🔄 Retrying unread count in 2 seconds...');
          setTimeout(() => fetchUnreadCount(retryCount + 1), 2000);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      if (retryCount < 2) {
        // console.log('🔄 Retrying unread count in 2 seconds...');
        setTimeout(() => fetchUnreadCount(retryCount + 1), 2000);
      }
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Send to server via socket
      if (socket && isConnected) {
        socket.emit('mark_notification_read', { notificationId });
      } else {
        // Fallback to API call
        await apiCall(`/notifications/${notificationId}/read`, {
          method: 'PUT'
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update on error
      fetchNotifications(true);
    }
  }, [socket, isConnected, fetchNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);

      // Send to server via socket
      if (socket && isConnected) {
        socket.emit('mark_all_read');
      } else {
        // Fallback to API call
        await apiCall('/notifications/read-all', {
          method: 'PUT'
        });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Revert optimistic update on error
      fetchNotifications(true);
    }
  }, [socket, isConnected, fetchNotifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await apiCall('/notifications/clear-all', {
        method: 'DELETE'
      });
      
      if (response && response.success) {
        setNotifications([]);
        setUnreadCount(0);
        // Clear cache
        notificationCache.current.clear();
        lastFetchTime.current = 0;
        console.log('✅ All notifications cleared successfully');
      }
    } catch (error) {
      console.error('❌ Error clearing all notifications:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const deletedNotif = notifications.find(notif => notif._id === notificationId);
      
      // Optimistic update
      setNotifications(prev => 
        prev.filter(notif => notif._id !== notificationId)
      );
      
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // API call
      await apiCall(`/notifications/${notificationId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Revert optimistic update on error
      fetchNotifications(true);
    }
  }, [notifications, fetchNotifications]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Initial load and periodic refresh
  useEffect(() => {
    if (user && token) {
      // console.log('🔔 User and token found, fetching notifications and unread count...', user.email);
      // console.log('🔔 Token available:', !!token);
      // console.log('🔔 User ID:', user._id);
      
      // Fetch both notifications and unread count
      fetchNotifications();
      fetchUnreadCount();
      
      // Set up periodic refresh every 30 seconds
      const interval = setInterval(() => {
        // console.log('🔔 Periodic refresh of unread count');
        fetchUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      // console.log('🔔 No user or token found, skipping notification fetch', { user: !!user, token: !!token });
    }
  }, [user, token, fetchNotifications, fetchUnreadCount]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'blog_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'blog_rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'blog_deleted':
        return <X className="h-4 w-4 text-red-500" />;
      case 'comment_approved':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'comment_rejected':
        return <X className="h-4 w-4 text-red-500" />;
      case 'order_placed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'order_status_update':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'order_shipped':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'order_delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'order_cancelled':
        return <X className="h-4 w-4 text-red-500" />;
      case 'blog_like':
        return <span className="text-red-500 text-lg">❤️</span>;
      case 'blog_comment':
        return <span className="text-blue-500 text-lg">💬</span>;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!user) return null;

  // Debug info (can be removed in production)
  // console.log('🔔 NotificationIcon render:', {
  //   user: user?.email,
  //   unreadCount,
  //   notificationsCount: notifications.length,
  //   isConnected,
  //   loading
  // });

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => {
          if (unreadCount > 0) {
            clearAllNotifications();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title={unreadCount > 0 ? "Clear all notifications" : "Notifications"}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {isConnected && (
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full" title="Connected" />
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="text-gray-400 mb-2">🔔</div>
                <div>No notifications yet</div>
                <div className="text-xs text-gray-400 mt-1">
                  You'll see notifications here when you receive likes, comments, or order updates
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                                title="Mark as read"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              className="text-xs text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => fetchNotifications(true)}
              className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Refresh notifications
            </button>
            <button
              onClick={() => {
                console.log('🔔 Force clearing cache and refetching...');
                notificationCache.current.clear();
                lastFetchTime.current = 0;
                fetchNotifications(true);
                fetchUnreadCount();
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium mt-2"
            >
              Force refresh (clear cache)
            </button>
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="w-full text-sm text-red-600 hover:text-red-800 font-medium mt-2"
              >
                Clear all notifications
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;