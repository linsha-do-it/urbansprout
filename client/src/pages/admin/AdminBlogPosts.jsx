import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiCall } from '../../utils/api';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Eye
} from 'lucide-react';

const AdminBlogPosts = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadBlogPosts();
  }, [currentPage, searchTerm, filterStatus]);

  const loadBlogPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus && { approvalStatus: filterStatus })
      });
      
      const response = await apiCall(`/admin/blog?${params}`);
      if (response.success) {
        setBlogPosts(response.data.posts);
        setTotalPages(response.data.pagination.pages);
        setTotalItems(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error loading blog posts:', error);
      setMessage('Error loading blog posts');
    } finally {
      setLoading(false);
    }
  };

  const approveBlogPost = async (postId) => {
    if (!window.confirm('Are you sure you want to approve this blog post?')) return;
    
    try {
      const response = await apiCall(`/admin/blog/${postId}/approve`, {
        method: 'PUT'
      });
      
      if (response.success) {
        setMessage('Blog post approved successfully');
        loadBlogPosts();
      }
    } catch (error) {
      console.error('Error approving blog post:', error);
      setMessage('Error approving blog post');
    }
  };

  const rejectBlogPost = async (postId) => {
    const reason = window.prompt('Please provide a reason for rejecting this blog post:');
    if (!reason || reason.trim().length === 0) {
      setMessage('Rejection reason is required');
      return;
    }
    
    try {
      const response = await apiCall(`/admin/blog/${postId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: reason.trim() })
      });
      
      if (response.success) {
        setMessage('Blog post rejected successfully');
        loadBlogPosts();
      }
    } catch (error) {
      console.error('Error rejecting blog post:', error);
      setMessage('Error rejecting blog post');
    }
  };

  const deleteBlogPost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      const response = await apiCall(`/admin/blog/${postId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        setMessage('Blog post deleted successfully');
        loadBlogPosts();
      }
    } catch (error) {
      console.error('Error deleting blog post:', error);
      setMessage('Error deleting blog post');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blog Post Management</h1>
              <p className="text-gray-600 text-sm">Moderate and manage blog posts</p>
            </div>
            <button
              onClick={loadBlogPosts}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 w-4" />
                <input
                  type="text"
                  placeholder="Search blog posts by title or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
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

        {/* Blog Posts Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : blogPosts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No blog posts found
                    </td>
                  </tr>
                ) : (
                  blogPosts.map((post) => (
                    <tr key={post._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-12 w-12">
                            {post.image ? (
                              <img className="h-12 w-12 rounded-lg object-cover" src={post.image} alt={post.title} />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-300 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{post.title}</div>
                            <div className="text-sm text-gray-500 truncate">{post.content?.substring(0, 100)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.author || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.category || 'General'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(post.approvalStatus || 'pending')}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(post.approvalStatus || 'pending')}`}>
                            {post.approvalStatus || 'pending'}
                          </span>
                        </div>
                        {post.rejectionReason && (
                          <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
                            Reason: {post.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {(post.approvalStatus === 'pending' || !post.approvalStatus) && (
                            <>
                              <button
                                onClick={() => approveBlogPost(post._id)}
                                className="text-green-600 hover:text-green-500"
                                title="Approve post"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => rejectBlogPost(post._id)}
                                className="text-red-600 hover:text-red-500"
                                title="Reject post"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteBlogPost(post._id)}
                            className="text-red-600 hover:text-red-500"
                            title="Delete post"
                          >
                            <Trash2 className="h-4 w-4" />
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
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
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
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
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
    </div>
  );
};

export default AdminBlogPosts;



