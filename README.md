# 🌱 UrbanSprout - Complete Plant Care & E-commerce Platform

A comprehensive web application that combines plant care tracking, e-commerce functionality, and community features for urban gardening enthusiasts.

## ✨ Key Features

### 🏠 Multi-Role Dashboard System
- **Beginner Dashboard**: Plant care guides, basic tutorials, community support
- **Expert Dashboard**: Content creation tools, Q&A management, expert badge
- **Vendor Dashboard**: Product management, inventory control, business analytics
- **Admin Dashboard**: Complete platform management, user administration, system analytics

### 📖 My Garden Journal
- **Plant Grid View**: Beautiful photo grid of all your plants
- **Smart Filtering**: Filter by Herbs, Fruits, and Vegetables
- **Plant Details**: Click any plant to see detailed information
- **Growth Timeline**: Track your plant's journey with notes and dates
- **Care Reminders**: Interactive reminders for watering, sunlight, and pruning
- **Image Upload**: Upload and manage plant photos
- **Status Tracking**: Monitor plant growth stages

### 🛒 E-commerce Store
- **Product Catalog**: Comprehensive plant and gardening supplies store
- **Advanced Filtering**: Filter by category, price range, ratings
- **Shopping Cart**: Add to cart, wishlist functionality
- **Payment Integration**: Razorpay payment gateway support
- **Order Management**: Complete order tracking and status updates
- **Inventory Management**: Stock tracking and low-stock alerts

### 🤖 AI-Powered Plant Suggestion Chatbot
- **Personalized Recommendations**: Get plant suggestions based on your preferences
- **Add to Garden**: One-click addition to your journal
- **Image Integration**: Automatically saves plant images
- **Smart Filtering**: Filter suggestions by environment, care level, etc.

### 👥 User Management & Authentication
- **Multi-Role System**: Beginner, Expert, Vendor, Admin roles
- **Firebase Authentication**: Secure login with Google OAuth
- **Professional Verification**: Expert and vendor ID verification
- **User Profiles**: Comprehensive user profiles with preferences
- **Account Management**: Password reset, email verification

### 📝 Community Blog System
- **Blog Creation**: Users can create and submit blog posts
- **Content Moderation**: Admin approval system for blog posts
- **Comment System**: Community interaction and feedback
- **Expert Content**: Verified expert contributions

### 🔔 Notification System
- **Real-time Notifications**: Socket.IO powered notifications
- **Email Notifications**: Order updates, blog approvals, system alerts
- **In-app Notifications**: Dashboard notification center
- **Admin Notifications**: System-wide announcements

### 🛡️ Admin Panel
- **User Management**: Complete user administration with bulk operations
- **Product Management**: Add, edit, archive products and categories
- **Order Management**: Process orders, update status, send notifications
- **Blog Moderation**: Approve/reject blog posts and comments
- **Analytics Dashboard**: Platform statistics and insights
- **System Settings**: Platform configuration and maintenance

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB database (local or cloud)
- Firebase project (for authentication)
- Razorpay account (for payments)

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd UrbanSprout-main
   ```

2. **Install Dependencies**
   
   **Backend:**
   ```bash
   cd server
   npm install
   ```
   
   **Frontend:**
   ```bash
   cd client
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/urbansprout
   
   # Server
   PORT=5001
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key
   
   # Firebase (for authentication)
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   
   # Email Service (optional)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # Razorpay (for payments)
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   
   # CORS
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Database Setup**
   ```bash
   cd server
   npm run setup:urban
   ```

5. **Start the Application**
   
   **Terminal 1 - Backend Server:**
   ```bash
   cd server
   npm run dev
   ```
   
   **Terminal 2 - Frontend Client:**
   ```bash
   cd client
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001
   - API Health Check: http://localhost:5001/api/health

## 📁 Project Structure

```
UrbanSprout-main/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── admin/          # Admin-specific components
│   │   │   ├── layout/         # Layout components (Navbar, Footer)
│   │   │   └── ...            # Other components
│   │   ├── pages/              # Page components
│   │   │   ├── admin/          # Admin pages
│   │   │   ├── auth/           # Authentication pages
│   │   │   ├── dashboard/      # Role-based dashboards
│   │   │   └── ...            # Other pages
│   │   ├── contexts/           # React contexts
│   │   ├── config/             # Configuration files
│   │   ├── utils/              # Utility functions
│   │   └── App.jsx            # Main app component
│   ├── package.json
│   └── vite.config.js
├── server/                     # Node.js backend
│   ├── controllers/            # Route controllers
│   ├── models/                 # MongoDB models
│   ├── routes/                 # API routes
│   ├── middleware/             # Custom middleware
│   ├── utils/                  # Utility functions
│   ├── scripts/                # Setup and utility scripts
│   ├── config/                 # Configuration files
│   ├── server.js              # Main server file
│   └── package.json
├── .env                       # Environment variables
└── README.md                  # This file
```

## 🎯 User Roles & Permissions

### 🌱 Beginner
- Access to plant care guides and tutorials
- Basic plant tracking in garden journal
- Community support and Q&A
- Basic store browsing and purchasing

### 🌟 Expert
- All beginner features
- Create and publish blog posts
- Answer community questions
- Expert badge and verification
- Advanced plant care recommendations

### 🏪 Vendor
- All beginner features
- Product listing and management
- Inventory tracking
- Order processing
- Business analytics dashboard

### 👑 Admin
- Complete platform access
- User management and moderation
- Product and category management
- Order processing and tracking
- Blog content moderation
- System analytics and settings
- Bulk operations and system maintenance

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router** - Client-side routing
- **Firebase** - Authentication and real-time features
- **Socket.IO Client** - Real-time communication
- **Razorpay** - Payment integration

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Socket.IO** - Real-time communication
- **Nodemailer** - Email service
- **Razorpay** - Payment processing
- **Firebase Admin** - Server-side Firebase integration

### Development Tools
- **ESLint** - Code linting
- **Nodemon** - Development server
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 🔧 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /firebase-auth` - Firebase authentication
- `POST /forgot-password` - Password reset request
- `POST /reset-password/:token` - Password reset
- `GET /me` - Get current user profile
- `PUT /profile` - Update user profile

### Store (`/api/store`)
- `GET /` - Get products with filters
- `GET /:id` - Get single product
- `POST /cart` - Add to cart
- `GET /cart` - Get user cart
- `POST /wishlist` - Add to wishlist
- `POST /orders` - Create order
- `POST /payment/create` - Create payment
- `POST /payment/verify` - Verify payment

### Admin (`/api/admin`)
- `GET /dashboard` - Admin dashboard stats
- `GET /users` - Get all users
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `POST /users/bulk` - Bulk user operations
- `GET /products` - Get all products
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `GET /orders` - Get all orders
- `PUT /orders/:id` - Update order status
- `GET /blog` - Get blog posts for moderation
- `PUT /blog/:id/approve` - Approve blog post
- `PUT /blog/:id/reject` - Reject blog post

### Plants (`/api/plants`)
- `GET /` - Get plant suggestions
- `POST /` - Add plant to garden
- `GET /garden` - Get user's garden
- `PUT /:id` - Update plant details
- `DELETE /:id` - Remove plant from garden

### Blog (`/api/blog`)
- `GET /` - Get published blog posts
- `POST /` - Create blog post
- `GET /:id` - Get single blog post
- `POST /:id/comments` - Add comment
- `PUT /:id/like` - Like/unlike blog post

## 🎨 Design Features

- **Modern UI**: Clean, green-themed design with intuitive navigation
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Interactive Elements**: Smooth animations and transitions
- **Accessibility**: WCAG compliant design patterns
- **Dark/Light Mode**: Theme switching capability
- **Progressive Web App**: Offline functionality and app-like experience

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions system
- **Input Validation**: Comprehensive data validation
- **CORS Protection**: Cross-origin request security
- **Rate Limiting**: API request throttling
- **Password Hashing**: Bcrypt password encryption
- **Email Verification**: Account verification system

## 📊 Database Models

### User Model
- Personal information (name, email, avatar)
- Role and permissions (beginner, expert, vendor, admin)
- Professional verification (for experts/vendors)
- Account status and security settings
- User preferences and settings

### Product Model
- Product details (name, description, SKU)
- Pricing (regular price, discount price)
- Inventory management (stock, low-stock threshold)
- Media (images, specifications)
- Vendor information and ratings

### Order Model
- Order details (items, quantities, pricing)
- Customer information and shipping address
- Payment information and status
- Order tracking and status updates
- Vendor and admin notes

### Plant Model
- Plant information (name, species, care requirements)
- User garden associations
- Growth tracking and notes
- Care reminders and schedules
- Image galleries

### Blog Model
- Blog post content and metadata
- Author information and verification
- Approval status and moderation
- Comments and interactions
- Categories and tags

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set:
- Database connection string
- Firebase configuration
- Email service credentials
- Payment gateway keys
- JWT secret key

### Production Build
```bash
# Build frontend
cd client
npm run build

# Start production server
cd server
npm start
```

### Docker Deployment (Optional)
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🔮 Future Enhancements

- Mobile app development
- Advanced plant disease detection
- Community marketplace features
- AI-powered plant care recommendations
- Integration with IoT plant sensors
- Multi-language support
- Advanced analytics and reporting

---

**UrbanSprout** - Growing green communities, one plant at a time! 🌱