import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiCall } from '../../utils/api';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mail,
  Shield,
  AlertTriangle,
  Clock,
  Eye,
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
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const AdminUsers = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [emailData, setEmailData] = useState({ subject: '', message: '' });
  const [suspendData, setSuspendData] = useState({ reason: '', duration: 24 });
  const [notesData, setNotesData] = useState({ notes: '' });

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

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  const loadUserDetails = useCallback(async (userId) => {
    try {
      const response = await apiCall(`/admin/users/${userId}/details`);
      if (response.success) {
        setUserDetails(response.data.user);
        setShowUserDetails(true);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  }, []);

  const handleUserAction = useCallback(async (userId, action, data = {}) => {
    try {
      let endpoint = '';
      let method = 'PUT';
      
      switch (action) {
        case 'block':
          endpoint = `/admin/users/${userId}/block`;
          break;
        case 'suspend':
          endpoint = `/admin/users/${userId}/suspend`;
          break;
        case 'resetPassword':
          endpoint = `/admin/users/${userId}/reset-password`;
          method = 'POST';
          break;
        case 'sendEmail':
          endpoint = `/admin/users/${userId}/send-email`;
          method = 'POST';
          break;
        case 'updateNotes':
          endpoint = `/admin/users/${userId}/notes`;
          break;
        case 'flag':
          endpoint = `/admin/users/${userId}/flag`;
          break;
        case 'changeRole':
          endpoint = `/admin/users/${userId}/role`;
          break;
        case 'delete':
          endpoint = `/admin/users/${userId}`;
          method = 'DELETE';
          break;
        default:
          return;
      }

      const response = await apiCall(endpoint, {
        method,
        body: JSON.stringify(data)
      });

      if (response.success) {
        setMessage(response.message);
        loadUsers();
        setShowEmailModal(false);
        setShowSuspendModal(false);
        setShowNotesModal(false);
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
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

  const roles = ['admin', 'vendor', 'expert', 'beginner'];
  const statuses = ['active', 'inactive', 'blocked', 'suspended'];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
            <div className="flex items-center justify-end">
              <span className="text-sm text-gray-500">
                {totalItems} total users
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
            message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

      {/* Users Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={selectAllUsers}
                      className="flex items-center"
                    >
                      {selectedUsers.length === users.length ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">ID</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-40">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">Email</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Role</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Joined</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Last Login</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className={user.isFlagged ? 'bg-yellow-50' : ''}>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <button
                          onClick={() => toggleUserSelection(user._id)}
                          className="flex items-center"
                        >
                          {selectedUsers.includes(user._id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                        {user._id.slice(-8)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {user.avatar ? (
                              <img className="h-8 w-8 rounded-full" src={user.avatar} alt={user.name} />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <Users className="h-4 w-4 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              <span className="truncate max-w-32">{user.name}</span>
                              {user.isFlagged && <Flag className="h-3 w-3 text-red-500 ml-1 flex-shrink-0" />}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="truncate max-w-40 block">{user.email}</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => loadUserDetails(user._id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEmailModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Send Email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowNotesModal(true);
                              setNotesData({ notes: user.adminNotes || '' });
                            }}
                            className="text-purple-600 hover:text-purple-900"
                            title="Admin Notes"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction(user._id, 'flag', { reason: 'Manual flag' })}
                            className={user.isFlagged ? "text-red-600 hover:text-red-900" : "text-gray-600 hover:text-gray-900"}
                            title={user.isFlagged ? "Unflag User" : "Flag User"}
                          >
                            <Flag className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * 10, totalItems)}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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

      {/* User Details Modal */}
      {showUserDetails && userDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">User Details</h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-16 w-16">
                  {userDetails.avatar ? (
                    <img className="h-16 w-16 rounded-full" src={userDetails.avatar} alt={userDetails.name} />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                      <Users className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{userDetails.name}</h4>
                  <p className="text-gray-600">{userDetails.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getRoleBadge(userDetails.role)}
                    {getStatusBadge(userDetails.status)}
                    {userDetails.isFlagged && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <Flag className="w-3 h-3 mr-1" />
                        Flagged
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <p className="text-sm text-gray-900">{userDetails._id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joined Date</label>
                  <p className="text-sm text-gray-900">{formatDate(userDetails.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Login</label>
                  <p className="text-sm text-gray-900">{formatDate(userDetails.lastLogin)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Verified</label>
                  <p className="text-sm text-gray-900">{userDetails.emailVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {userDetails.activity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Activity Summary</label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Blog Posts</p>
                      <p className="text-2xl font-bold text-blue-600">{userDetails.activity.blogPosts}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-900">Orders</p>
                      <p className="text-2xl font-bold text-green-600">{userDetails.activity.orders}</p>
                    </div>
                  </div>
                </div>
              )}

              {userDetails.adminNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{userDetails.adminNotes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setSelectedUser(userDetails);
                    setShowEmailModal(true);
                    setShowUserDetails(false);
                  }}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(userDetails);
                    setShowSuspendModal(true);
                    setShowUserDetails(false);
                  }}
                  className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Suspend
                </button>
                {userDetails.role !== 'admin' && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this user?')) {
                        handleUserAction(userDetails._id, 'delete');
                        setShowUserDetails(false);
                      }
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Send Email to {selectedUser.name}</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                  rows={6}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email message"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUserAction(selectedUser._id, 'sendEmail', emailData)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Suspend User: {selectedUser.name}</h3>
              <button
                onClick={() => setShowSuspendModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <input
                  type="text"
                  value={suspendData.reason}
                  onChange={(e) => setSuspendData({ ...suspendData, reason: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Suspension reason"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (hours)</label>
                <select
                  value={suspendData.duration}
                  onChange={(e) => setSuspendData({ ...suspendData, duration: parseInt(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>1 hour</option>
                  <option value={24}>24 hours</option>
                  <option value={72}>3 days</option>
                  <option value={168}>1 week</option>
                  <option value={720}>1 month</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUserAction(selectedUser._id, 'suspend', suspendData)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Suspend User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Admin Notes: {selectedUser.name}</h3>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={notesData.notes}
                  onChange={(e) => setNotesData({ ...notesData, notes: e.target.value })}
                  rows={6}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add admin notes about this user..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUserAction(selectedUser._id, 'updateNotes', notesData)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkActions && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Bulk Actions ({selectedUsers.length} users)</h3>
              <button
                onClick={() => setShowBulkActions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleBulkAction('block', { reason: 'Bulk block operation' })}
                className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Ban className="h-5 w-5 mr-2" />
                Block Users
              </button>
              <button
                onClick={() => handleBulkAction('unblock')}
                className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Unlock className="h-5 w-5 mr-2" />
                Unblock Users
              </button>
              <button
                onClick={() => {
                  // Filter out admin users from deletion
                  const nonAdminUsers = selectedUsers.filter(userId => {
                    const user = users.find(u => u._id === userId);
                    return user && user.role !== 'admin';
                  });
                  
                  if (nonAdminUsers.length === 0) {
                    alert('No non-admin users selected for deletion');
                    return;
                  }
                  
                  if (nonAdminUsers.length < selectedUsers.length) {
                    const adminCount = selectedUsers.length - nonAdminUsers.length;
                    if (!confirm(`Admin users cannot be deleted. ${adminCount} admin user(s) will be skipped. Continue with deleting ${nonAdminUsers.length} non-admin user(s)?`)) {
                      return;
                    }
                  } else {
                    if (!confirm('Are you sure you want to delete all selected users?')) {
                      return;
                    }
                  }
                  
                  handleBulkAction('delete', { userIds: nonAdminUsers });
                }}
                className="flex items-center justify-center px-4 py-3 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete Users
              </button>
              <button
                onClick={() => handleBulkAction('suspend', { reason: 'Bulk suspend operation', duration: 24 })}
                className="flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Clock className="h-5 w-5 mr-2" />
                Suspend Users
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;