import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiCall } from '../../utils/api';
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck, 
  UserX,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mail,
  Shield,
  AlertTriangle,
  Flag,
  CheckSquare,
  Square,
  Send,
  Lock,
  Unlock,
  Ban,
  UserMinus,
  UserPlus,
  MessageSquare,
  Calendar,
  XCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('users'); // Default to users
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  // User management states
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [message, setMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  // Navigation items
  const navigationItems = [
    { id: 'users', name: 'Users', icon: Users, color: 'blue' },
    { id: 'products', name: 'Products', icon: Package, color: 'green' },
    { id: 'orders', name: 'Orders', icon: ShoppingBag, color: 'purple' },
    { id: 'blog', name: 'Blog Posts', icon: FileText, color: 'orange' },
    { id: 'analytics', name: 'Analytics', icon: BarChart3, color: 'indigo' },
    { id: 'settings', name: 'Settings', icon: Shield, color: 'gray' }
  ];

  useEffect(() => {
    loadDashboardData();
    loadUsers();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterRole, filterStatus]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading admin dashboard data...');
      const response = await apiCall('/admin/dashboard');
      console.log('Dashboard API response:', response);
      if (response.success) {
        setStats(response.data.stats);
        console.log('Dashboard stats loaded:', response.data.stats);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(filterRole && { role: filterRole }),
        ...(filterStatus && { status: filterStatus })
      });
      
      const response = await apiCall(`/admin/users?${params}`);
      if (response.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
        setTotalItems(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Error loading users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, filterRole, filterStatus]);

  const handleUserAction = useCallback(async (userId, action, data = {}) => {
    try {
      const response = await apiCall(`/admin/users/${userId}/${action}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (response.success) {
        setMessage(`User ${action} successful`);
        loadUsers();
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      setMessage(`Error performing ${action}`);
    }
  }, [loadUsers]);

  const handleBulkAction = useCallback(async (operation, data = {}) => {
    try {
      const response = await apiCall('/admin/users/bulk', {
        method: 'POST',
        body: JSON.stringify({
          userIds: selectedUsers,
          operation,
          data
        })
      });

      if (response.success) {
        setMessage(`Bulk ${operation} completed`);
        setSelectedUsers([]);
        setShowBulkActions(false);
        loadUsers();
      }
    } catch (error) {
      console.error(`Error bulk ${operation}:`, error);
      setMessage(`Error performing bulk ${operation}`);
    }
  }, [selectedUsers, loadUsers]);

  const toggleUserSelection = useCallback((userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const selectAllUsers = useCallback(() => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  }, [selectedUsers.length, users]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      blocked: { color: 'bg-red-100 text-red-800', icon: XCircle },
      suspended: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle }
    };
    
    const badge = badges[status] || badges.inactive;
    const Icon = badge.icon;
    const displayStatus = status || 'inactive';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      vendor: 'bg-green-100 text-green-800',
      expert: 'bg-purple-100 text-purple-800',
      beginner: 'bg-blue-100 text-blue-800'
    };
    
    const displayRole = role || 'beginner';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[role] || badges.beginner}`}>
        {displayRole.charAt(0).toUpperCase() + displayRole.slice(1)}
      </span>
    );
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'blue',
      change: stats?.userGrowth || 0
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'green',
      change: stats?.orderGrowth || 0
    },
    {
      title: 'Total Revenue',
      value: `₹${stats?.totalRevenue || 0}`,
      icon: DollarSign,
      color: 'purple',
      change: stats?.revenueGrowth || 0
    },
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'orange',
      change: stats?.productGrowth || 0
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      purple: 'bg-purple-500 text-white',
      orange: 'bg-orange-500 text-white',
      indigo: 'bg-indigo-500 text-white',
      gray: 'bg-gray-500 text-white'
    };
    return colors[color] || colors.gray;
  };

  const renderDashboardOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Admin Dashboard 👑</h2>
        <p className="text-red-100">
          Welcome back, {user?.name}! Manage the UrbanSprout platform and monitor system performance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                {card.change !== 0 && (
                  <p className={`text-sm ${card.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.change > 0 ? '+' : ''}{card.change}% from last month
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${getColorClasses(card.color)}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {navigationItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`p-3 rounded-lg ${getColorClasses(item.color)} mb-2`}>
                <item.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 text-sm">Manage users and their roles</p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedUsers.length > 0 && (
              <button
                onClick={() => setShowBulkActions(true)}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Bulk Actions ({selectedUsers.length})
              </button>
            )}
            <button
              onClick={loadUsers}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="vendor">Vendor</option>
              <option value="expert">Expert</option>
              <option value="beginner">Beginner</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterRole('');
                setFilterStatus('');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={selectAllUsers}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleUserSelection(user._id)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUserAction(user._id, 'activate')}
                        className="text-green-600 hover:text-green-900"
                        title="Activate User"
                      >
                        <UserCheck className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUserAction(user._id, 'block')}
                        className="text-red-600 hover:text-red-900"
                        title="Block User"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUserAction(user._id, 'suspend')}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Suspend User"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * 10, totalItems)}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-red-50 border-red-500 text-red-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'users':
        return renderUserManagement();
      case 'products':
        return <div className="text-center py-12"><Package className="h-12 w-12 mx-auto text-gray-400 mb-4" /><p className="text-gray-500">Product management coming soon...</p></div>;
      case 'orders':
        return <div className="text-center py-12"><ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" /><p className="text-gray-500">Order management coming soon...</p></div>;
      case 'blog':
        return <div className="text-center py-12"><FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" /><p className="text-gray-500">Blog management coming soon...</p></div>;
      case 'analytics':
        return <div className="text-center py-12"><BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" /><p className="text-gray-500">Analytics coming soon...</p></div>;
      case 'settings':
        return <div className="text-center py-12"><Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" /><p className="text-gray-500">Settings coming soon...</p></div>;
      default:
        return renderDashboardOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`${
                      activeView === item.id
                        ? 'bg-red-100 text-red-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left`}
                  >
                    <item.icon
                      className={`${
                        activeView === item.id ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs font-medium text-gray-500">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col">
        {/* Top bar - Mobile only */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            <div className="flex space-x-2">
              {navigationItems.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    activeView === item.id
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 min-h-0 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      {/* Message */}
      {message && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;


