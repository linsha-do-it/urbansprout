// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

// Switch to the urbansprout database
db = db.getSiblingDB('urbansprout');

// Create application user
db.createUser({
  user: 'urbansprout',
  pwd: 'urbansprout123',
  roles: [
    {
      role: 'readWrite',
      db: 'urbansprout'
    }
  ]
});

// Create initial collections with indexes
db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('plants');
db.createCollection('blogs');
db.createCollection('notifications');
db.createCollection('usergardens');
db.createCollection('carts');
db.createCollection('wishlists');
db.createCollection('discounts');
db.createCollection('adminactivities');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ createdAt: -1 });

db.products.createIndex({ name: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ stock: 1 });
db.products.createIndex({ createdAt: -1 });

db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });

db.plants.createIndex({ name: 1 });
db.plants.createIndex({ category: 1 });
db.plants.createIndex({ difficulty: 1 });

db.blogs.createIndex({ title: 1 });
db.blogs.createIndex({ author: 1 });
db.blogs.createIndex({ status: 1 });
db.blogs.createIndex({ createdAt: -1 });

db.notifications.createIndex({ userId: 1 });
db.notifications.createIndex({ read: 1 });
db.notifications.createIndex({ createdAt: -1 });

db.usergardens.createIndex({ userId: 1 });
db.usergardens.createIndex({ plantId: 1 });

db.carts.createIndex({ userId: 1 });
db.wishlists.createIndex({ userId: 1 });

db.adminactivities.createIndex({ adminId: 1 });
db.adminactivities.createIndex({ action: 1 });
db.adminactivities.createIndex({ timestamp: -1 });

print('✅ MongoDB initialization completed successfully!');
print('📊 Created database: urbansprout');
print('👤 Created user: urbansprout');
print('📋 Created collections and indexes');




