import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/layout/Navbar'

// Import page components
import Home from './pages/Home'
import UrbanSproutLanding from './UrbanSproutLanding'
import Login from './pages/auth/NewLogin'
import Signup from './pages/auth/Signup'
import AdminRegister from './pages/auth/AdminRegister'
import ResetPassword from './pages/auth/ResetPassword'
import PlantSuggestion from './pages/PlantSuggestion'
import Unauthorized from './pages/Unauthorized'
import Admin from './pages/Admin'
import Blog from './pages/Blog'
import Store from './pages/Store'
import ProductDetail from './pages/ProductDetail'
import Profile from './pages/Profile'

// Import admin components
import AdminLayout from './components/admin/AdminLayout'
import UnifiedAdminDashboard from './pages/admin/UnifiedAdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminProducts from './pages/admin/AdminProducts'
import AdminBlogPosts from './pages/admin/AdminBlogPosts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminSettings from './pages/admin/AdminSettings'
import InventoryInsights from './pages/admin/InventoryInsights'

// Import dashboard components
import AdminDashboard from './pages/dashboard/AdminDashboard'
import BeginnerDashboard from './pages/dashboard/BeginnerDashboard'
import ExpertDashboard from './pages/dashboard/ExpertDashboard'
import VendorDashboard from './pages/dashboard/VendorDashboard'

// Import My Garden Journal components
import MyGardenJournal from './pages/MyGardenJournal'
import MyOrders from './pages/MyOrders'
import MyActivity from './pages/MyActivity'
import PlantDetail from './pages/PlantDetail'
import NotificationDebug from './pages/NotificationDebug'

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null, allowedRoles = [], redirectToSignup = false }) => {
  const { user, loading } = useAuth()

  console.log('ProtectedRoute - user:', user, 'loading:', loading, 'requiredRole:', requiredRole);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to login');
    return <Navigate to={redirectToSignup ? "/signup" : "/login"} replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    console.log('ProtectedRoute - Role mismatch. User role:', user.role, 'Required:', requiredRole);
    return <Navigate to="/unauthorized" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('ProtectedRoute - User role not in allowed roles. User role:', user.role, 'Allowed:', allowedRoles);
    return <Navigate to="/unauthorized" replace />
  }

  console.log('ProtectedRoute - Access granted');
  return children
}

// Dashboard Component - routes to appropriate dashboard based on user role
const Dashboard = () => {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  const userRole = user.role || localStorage.getItem('urbansprout_user_role')
  
  switch (userRole) {
    case 'admin':
      return <AdminDashboard />
    case 'expert':
      return <ExpertDashboard />
    case 'vendor':
      return <VendorDashboard />
    case 'beginner':
    default:
      return <BeginnerDashboard />
  }
}

const App = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<UrbanSproutLanding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin-register" element={
            <>
              <Navbar />
              <div className="pt-[82px]">
                <AdminRegister />
              </div>
            </>
          } />
          <Route path="/reset-password/:token" element={
            <>
              <Navbar />
              <div className="pt-[82px]">
                <ResetPassword />
              </div>
            </>
          } />
          <Route path="/blog" element={
            <>
              <Navbar />
              <div className="pt-[82px]">
                <Blog />
              </div>
            </>
          } />
          <Route path="/community" element={
            <>
              <Navbar />
              <div className="pt-[82px]">
                <Blog />
              </div>
            </>
          } />
          <Route path="/store" element={
            <>
              <Navbar />
              <div className="pt-[82px]">
                <Store />
              </div>
            </>
          } />
          <Route path="/product/:id" element={
            <>
              <Navbar />
              <div className="pt-[82px]">
                <ProductDetail />
              </div>
            </>
          } />
          <Route path="/plant-suggestion" element={
            <>
              <Navbar />
              <div className="pt-[82px]">
                <PlantSuggestion />
              </div>
            </>
          } />
          <Route path="/unauthorized" element={
            <>
              <Navbar />
              <div className="pt-[82px]">
                <Unauthorized />
              </div>
            </>
          } />

          {/* Protected Routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Navbar />
              <div className="pt-[82px]">
                <Profile />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/notification-debug" element={
            <ProtectedRoute>
              <Navbar />
              <div className="pt-[82px]">
                <NotificationDebug />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Navbar />
              <div className="pt-[82px]">
                <Dashboard />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/my-garden-journal" element={
            <ProtectedRoute>
              <Navbar />
              <div className="pt-[82px]">
                <MyGardenJournal />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/my-orders" element={
            <ProtectedRoute>
              <Navbar />
              <div className="pt-[82px]">
                <MyOrders />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/my-activity" element={
            <ProtectedRoute>
              <Navbar />
              <div className="pt-[82px]">
                <MyActivity />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/plant-detail/:plantId" element={
            <ProtectedRoute>
              <Navbar />
              <div className="pt-[82px]">
                <PlantDetail />
              </div>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <Navbar />
              <div className="pt-[82px]">
                <AdminDashboard />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <AdminProducts />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/blog" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <AdminBlogPosts />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <AdminOrders />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/inventory-insights" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <InventoryInsights />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App