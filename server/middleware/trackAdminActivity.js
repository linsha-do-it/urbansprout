const AdminActivityService = require('../utils/adminActivityService');

// Middleware to track admin activities
const trackAdminActivity = (action, getDescription, getTargetId = null, getTargetModel = null) => {
  return async (req, res, next) => {
    // Store original response methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Override res.json to capture response
    res.json = function(data) {
      // Log activity if request was successful
      if (data && (data.success !== false)) {
        const adminId = req.user?.id;
        const adminName = req.user?.name || 'Admin';
        
        if (adminId) {
          let description = '';
          let targetId = null;
          let targetModel = null;

          try {
            // Generate description
            if (typeof getDescription === 'function') {
              description = getDescription(req, data);
            } else {
              description = getDescription;
            }

            // Get target ID if function provided
            if (getTargetId && typeof getTargetId === 'function') {
              targetId = getTargetId(req, data);
            } else if (getTargetId) {
              targetId = getTargetId;
            }

            // Get target model if function provided
            if (getTargetModel && typeof getTargetModel === 'function') {
              targetModel = getTargetModel(req, data);
            } else if (getTargetModel) {
              targetModel = getTargetModel;
            }

            // Log the activity asynchronously (don't wait)
            AdminActivityService.logActivity(
              adminId,
              adminName,
              action,
              description,
              targetId,
              targetModel,
              { method: req.method, url: req.originalUrl }
            ).catch(err => console.error('Error logging admin activity:', err));
          } catch (error) {
            console.error('Error in activity tracking:', error);
          }
        }
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    // Override res.send for non-JSON responses
    res.send = function(data) {
      // Similar logic for non-JSON responses
      if (res.statusCode < 400) {
        const adminId = req.user?.id;
        const adminName = req.user?.name || 'Admin';
        
        if (adminId) {
          let description = '';
          let targetId = null;
          let targetModel = null;

          try {
            if (typeof getDescription === 'function') {
              description = getDescription(req, data);
            } else {
              description = getDescription;
            }

            if (getTargetId && typeof getTargetId === 'function') {
              targetId = getTargetId(req, data);
            } else if (getTargetId) {
              targetId = getTargetId;
            }

            if (getTargetModel && typeof getTargetModel === 'function') {
              targetModel = getTargetModel(req, data);
            } else if (getTargetModel) {
              targetModel = getTargetModel;
            }

            AdminActivityService.logActivity(
              adminId,
              adminName,
              action,
              description,
              targetId,
              targetModel,
              { method: req.method, url: req.originalUrl }
            ).catch(err => console.error('Error logging admin activity:', err));
          } catch (error) {
            console.error('Error in activity tracking:', error);
          }
        }
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

module.exports = trackAdminActivity;


