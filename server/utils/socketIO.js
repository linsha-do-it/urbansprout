const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const notificationService = require('../utils/notificationService');

const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175"
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.name} (${socket.userId}) connected`);
    
    // Add user to notification service
    notificationService.addConnection(socket.userId, socket);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Send initial unread count
    try {
      await notificationService.updateUnreadCount(socket.userId);
    } catch (error) {
      console.error('Error sending initial unread count:', error);
    }

    // Handle notification read
    socket.on('mark_notification_read', async (data) => {
      try {
        await notificationService.markAsRead(socket.userId, data.notificationId);
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark notification as read' });
      }
    });

    // Handle mark all as read
    socket.on('mark_all_read', async () => {
      try {
        await notificationService.markAllAsRead(socket.userId);
      } catch (error) {
        socket.emit('error', { message: 'Failed to mark all notifications as read' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} (${socket.userId}) disconnected`);
      notificationService.removeConnection(socket.userId);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  return io;
};

module.exports = setupSocketIO;
