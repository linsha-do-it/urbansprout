const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  constructor() {
    this.connectedUsers = new Map(); // userId -> socket connection
  }

  // Add user connection
  addConnection(userId, socket) {
    this.connectedUsers.set(userId.toString(), socket);
    console.log(`User ${userId} connected to notifications`);
  }

  // Remove user connection
  removeConnection(userId) {
    this.connectedUsers.delete(userId.toString());
    console.log(`User ${userId} disconnected from notifications`);
  }

  // Send notification to specific user
  async sendNotification(userId, notificationData) {
    try {
      // Create notification in database
      const notification = new Notification({
        userId,
        userEmail: notificationData.userEmail,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        relatedId: notificationData.relatedId,
        relatedModel: notificationData.relatedModel,
        isRead: false
      });

      await notification.save();

      // Send real-time notification if user is connected
      const socket = this.connectedUsers.get(userId.toString());
      if (socket) {
        socket.emit('new_notification', {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt,
          relatedId: notification.relatedId,
          relatedModel: notification.relatedModel
        });
        console.log(`Real-time notification sent to user ${userId}`);
      }

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  async sendBulkNotification(userIds, notificationData) {
    const notifications = [];
    
    for (const userId of userIds) {
      try {
        const notification = await this.sendNotification(userId, notificationData);
        notifications.push(notification);
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
      }
    }

    return notifications;
  }

  // Send notification to all users of a specific role
  async sendRoleNotification(role, notificationData) {
    try {
      const users = await User.find({ role }).select('_id email');
      const userIds = users.map(user => user._id);
      
      return await this.sendBulkNotification(userIds, notificationData);
    } catch (error) {
      console.error('Error sending role notification:', error);
      throw error;
    }
  }

  // Update unread count for connected user
  async updateUnreadCount(userId) {
    try {
      const unreadCount = await Notification.countDocuments({
        userId,
        isRead: false
      });

      const socket = this.connectedUsers.get(userId.toString());
      if (socket) {
        socket.emit('unread_count_update', { unreadCount });
      }

      return unreadCount;
    } catch (error) {
      console.error('Error updating unread count:', error);
      throw error;
    }
  }

  // Mark notification as read and notify client
  async markAsRead(userId, notificationId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
      );

      if (notification) {
        // Update unread count
        await this.updateUnreadCount(userId);
        
        // Notify client
        const socket = this.connectedUsers.get(userId.toString());
        if (socket) {
          socket.emit('notification_read', { notificationId });
        }
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );

      // Update unread count
      await this.updateUnreadCount(userId);

      // Notify client
      const socket = this.connectedUsers.get(userId.toString());
      if (socket) {
        socket.emit('all_notifications_read');
      }

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users list
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }
}

module.exports = new NotificationService();




