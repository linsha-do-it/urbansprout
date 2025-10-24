const AdminActivity = require('../models/AdminActivity');

class AdminActivityService {
  static async logActivity(adminId, adminName, action, description, targetId = null, targetModel = null, metadata = {}) {
    try {
      const activity = new AdminActivity({
        adminId,
        adminName,
        action,
        description,
        targetId,
        targetModel,
        metadata
      });

      await activity.save();
      
      // Emit real-time update to connected clients
      const io = require('./socketIO');
      if (io) {
        io.emit('admin_activity', {
          id: activity._id,
          adminName: activity.adminName,
          action: activity.action,
          description: activity.description,
          timestamp: activity.timestamp,
          icon: this.getActionIcon(action)
        });
      }

      return activity;
    } catch (error) {
      console.error('Error logging admin activity:', error);
      return null;
    }
  }

  static getActionIcon(action) {
    const iconMap = {
      'user_created': 'users',
      'user_updated': 'users', 
      'user_deleted': 'users',
      'product_created': 'shopping-bag',
      'product_updated': 'shopping-bag',
      'product_deleted': 'shopping-bag',
      'order_updated': 'shopping-bag',
      'order_cancelled': 'shopping-bag',
      'blog_approved': 'file-text',
      'blog_rejected': 'file-text',
      'blog_deleted': 'file-text',
      'discount_created': 'tag',
      'discount_updated': 'tag',
      'discount_deleted': 'tag',
      'settings_updated': 'cog',
      'category_created': 'folder',
      'category_updated': 'folder',
      'category_deleted': 'folder'
    };
    return iconMap[action] || 'cog';
  }

  static async getRecentActivities(limit = 3) {
    try {
      const activities = await AdminActivity.find()
        .populate('adminId', 'name')
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return activities.map(activity => ({
        type: 'admin_action',
        title: this.getActionTitle(activity.action),
        description: activity.description,
        timestamp: activity.timestamp,
        icon: this.getActionIcon(activity.action),
        adminName: activity.adminName
      }));
    } catch (error) {
      console.error('Error fetching recent admin activities:', error);
      return [];
    }
  }

  static getActionTitle(action) {
    const titleMap = {
      'user_created': 'User Created',
      'user_updated': 'User Updated', 
      'user_deleted': 'User Deleted',
      'product_created': 'Product Added',
      'product_updated': 'Product Updated',
      'product_deleted': 'Product Removed',
      'order_updated': 'Order Updated',
      'order_cancelled': 'Order Cancelled',
      'blog_approved': 'Blog Approved',
      'blog_rejected': 'Blog Rejected',
      'blog_deleted': 'Blog Deleted',
      'discount_created': 'Discount Created',
      'discount_updated': 'Discount Updated',
      'discount_deleted': 'Discount Deleted',
      'settings_updated': 'Settings Updated',
      'category_created': 'Category Created',
      'category_updated': 'Category Updated',
      'category_deleted': 'Category Deleted'
    };
    return titleMap[action] || 'Admin Action';
  }
}

module.exports = AdminActivityService;


