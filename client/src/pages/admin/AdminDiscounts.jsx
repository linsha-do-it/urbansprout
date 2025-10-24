import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiCall } from '../../utils/api';
import { 
  Percent, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  SortAsc,
  SortDesc,
  DollarSign,
  Tag,
  Users,
  Package,
  X
} from 'lucide-react';

const AdminDiscounts = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [discounts, setDiscounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [message, setMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage',
    value: '',
    applicableTo: 'all',
    category: '',
    products: [],
    startDate: '',
    endDate: '',
    usageLimit: '',
    minOrderValue: '',
    maxDiscountAmount: '',
    description: '',
    active: true
  });

  const [validation, setValidation] = useState({
    nameError: '',
    valueError: '',
    startDateError: '',
    endDateError: '',
    isValid: true
  });

  useEffect(() => {
    loadDiscounts();
    loadCategories();
    loadProducts();
  }, [currentPage, searchTerm, filterStatus]);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus && { status: filterStatus })
      });
      
      const response = await apiCall(`/admin/products/discounts?${params}`);
      if (response.success) {
        setDiscounts(response.data.discounts);
        setTotalPages(response.data.pagination.pages);
        setTotalItems(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error loading discounts:', error);
      setMessage('Error loading discounts');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiCall('/admin/products/categories');
      if (response.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await apiCall('/admin/products?limit=1000');
      if (response.success) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'percentage',
      value: '',
      applicableTo: 'all',
      category: '',
      products: [],
      startDate: '',
      endDate: '',
      usageLimit: '',
      minOrderValue: '',
      maxDiscountAmount: '',
      description: '',
      active: true
    });
    setValidation({
      nameError: '',
      valueError: '',
      startDateError: '',
      endDateError: '',
      isValid: true
    });
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      nameError: '',
      valueError: '',
      startDateError: '',
      endDateError: ''
    };

    if (!formData.name.trim()) {
      errors.nameError = 'Discount name is required';
      isValid = false;
    }

    if (!formData.value || parseFloat(formData.value) < 0) {
      errors.valueError = 'Discount value must be positive';
      isValid = false;
    }

    if (formData.type === 'percentage' && parseFloat(formData.value) > 100) {
      errors.valueError = 'Percentage discount cannot exceed 100%';
      isValid = false;
    }

    if (!formData.startDate) {
      errors.startDateError = 'Start date is required';
      isValid = false;
    }

    if (!formData.endDate) {
      errors.endDateError = 'End date is required';
      isValid = false;
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        errors.endDateError = 'End date must be after start date';
        isValid = false;
      }
    }

    setValidation({ ...errors, isValid });
    return isValid;
  };

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage('Please fix validation errors');
      return;
    }

    try {
      const discountData = {
        ...formData,
        value: parseFloat(formData.value),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        products: formData.applicableTo === 'products' ? formData.products : undefined,
        category: formData.applicableTo === 'category' ? formData.category : undefined
      };

      const response = await apiCall('/admin/products/discounts', {
        method: 'POST',
        body: JSON.stringify(discountData)
      });

      if (response.success) {
        setMessage('Discount created successfully');
        setShowCreateModal(false);
        resetForm();
        loadDiscounts();
      }
    } catch (error) {
      console.error('Error creating discount:', error);
      setMessage('Error creating discount: ' + error.message);
    }
  };

  const handleEditDiscount = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage('Please fix validation errors');
      return;
    }

    try {
      const discountData = {
        ...formData,
        value: parseFloat(formData.value),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        products: formData.applicableTo === 'products' ? formData.products : undefined,
        category: formData.applicableTo === 'category' ? formData.category : undefined
      };

      const response = await apiCall(`/admin/products/discounts/${editingDiscount._id}`, {
        method: 'PUT',
        body: JSON.stringify(discountData)
      });

      if (response.success) {
        setMessage('Discount updated successfully');
        setShowEditModal(false);
        setEditingDiscount(null);
        resetForm();
        loadDiscounts();
      }
    } catch (error) {
      console.error('Error updating discount:', error);
      setMessage('Error updating discount: ' + error.message);
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    if (!window.confirm('Are you sure you want to delete this discount?')) return;
    
    try {
      const response = await apiCall(`/admin/products/discounts/${discountId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        setMessage('Discount deleted successfully');
        loadDiscounts();
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      setMessage('Error deleting discount');
    }
  };

  const openEditModal = (discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name || '',
      type: discount.type || 'percentage',
      value: discount.value || '',
      applicableTo: discount.applicableTo || 'all',
      category: discount.category || '',
      products: discount.products ? discount.products.map(p => p._id) : [],
      startDate: discount.startDate ? new Date(discount.startDate).toISOString().slice(0, 16) : '',
      endDate: discount.endDate ? new Date(discount.endDate).toISOString().slice(0, 16) : '',
      usageLimit: discount.usageLimit || '',
      minOrderValue: discount.minOrderValue || '',
      maxDiscountAmount: discount.maxDiscountAmount || '',
      description: discount.description || '',
      active: discount.active !== false
    });
    setShowEditModal(true);
  };

  const getStatusBadgeColor = (discount) => {
    const status = discount.status;
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (discount) => {
    const status = discount.status;
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'inactive':
        return <EyeOff className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Discount Management</h1>
              <p className="text-gray-600 text-sm">Create and manage product discounts</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Discount
              </button>
              <button
                onClick={loadDiscounts}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search discounts by name..."
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
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('successfully') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Discounts Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type & Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicable To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : discounts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No discounts found
                    </td>
                  </tr>
                ) : (
                  discounts.map((discount) => (
                    <tr key={discount._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{discount.name}</div>
                          <div className="text-sm text-gray-500">{discount.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {discount.type === 'percentage' ? (
                            <Percent className="h-4 w-4 text-blue-600 mr-1" />
                          ) : (
                            <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {discount.applicableTo === 'all' && <Package className="h-4 w-4 text-gray-600 mr-1" />}
                          {discount.applicableTo === 'category' && <Tag className="h-4 w-4 text-blue-600 mr-1" />}
                          {discount.applicableTo === 'products' && <Users className="h-4 w-4 text-green-600 mr-1" />}
                          <span className="capitalize">
                            {discount.applicableTo === 'all' ? 'All Products' : 
                             discount.applicableTo === 'category' ? discount.category :
                             `${discount.products?.length || 0} Products`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>Start: {formatDate(discount.startDate)}</div>
                          <div>End: {formatDate(discount.endDate)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(discount)}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(discount)}`}>
                            {discount.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {discount.usageLimit ? 
                          `${discount.usedCount || 0}/${discount.usageLimit}` : 
                          `${discount.usedCount || 0}/∞`
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(discount)}
                            className="text-blue-600 hover:text-blue-500"
                            title="Edit discount"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDiscount(discount._id)}
                            className="text-red-600 hover:text-red-500"
                            title="Delete discount"
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

      {/* Create/Edit Discount Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {showCreateModal ? 'Create New Discount' : 'Edit Discount'}
                </h2>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingDiscount(null);
                    resetForm();
                  }} 
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={showCreateModal ? handleCreateDiscount : handleEditDiscount}>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validation.nameError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="e.g., Summer Sale 20% Off"
                        required
                      />
                      {validation.nameError && (
                        <p className="text-red-500 text-xs mt-1">{validation.nameError}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount Value *</label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validation.valueError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder={formData.type === 'percentage' ? '20' : '100'}
                      min="0"
                      max={formData.type === 'percentage' ? '100' : undefined}
                      step="0.01"
                      required
                    />
                    {validation.valueError && (
                      <p className="text-red-500 text-xs mt-1">{validation.valueError}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.type === 'percentage' ? 'Enter percentage (0-100)' : 'Enter amount in ₹'}
                    </p>
                  </div>

                  {/* Applicable To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Applicable To *</label>
                    <select
                      value={formData.applicableTo}
                      onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value, category: '', products: [] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Products</option>
                      <option value="category">Specific Category</option>
                      <option value="products">Specific Products</option>
                    </select>
                  </div>

                  {formData.applicableTo === 'category' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category._id}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.applicableTo === 'products' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Products *</label>
                      <select
                        multiple
                        value={formData.products}
                        onChange={(e) => {
                          const selectedProducts = Array.from(e.target.selectedOptions, option => option.value);
                          setFormData({ ...formData, products: selectedProducts });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} - ₹{product.regularPrice}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple products</p>
                    </div>
                  )}

                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validation.startDateError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        min={new Date().toISOString().slice(0, 16)}
                        required
                      />
                      {validation.startDateError && (
                        <p className="text-red-500 text-xs mt-1">{validation.startDateError}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validation.endDateError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        min={formData.startDate || new Date().toISOString().slice(0, 16)}
                        required
                      />
                      {validation.endDateError && (
                        <p className="text-red-500 text-xs mt-1">{validation.endDateError}</p>
                      )}
                    </div>
                  </div>

                  {/* Additional Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Usage Limit</label>
                      <input
                        type="number"
                        value={formData.usageLimit}
                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Unlimited"
                        min="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Order Value</label>
                      <input
                        type="number"
                        value={formData.minOrderValue}
                        onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Discount Amount</label>
                      <input
                        type="number"
                        value={formData.maxDiscountAmount}
                        onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="No limit"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Optional description of the discount"
                    />
                  </div>

                  {showEditModal && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="active"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                        Active
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setEditingDiscount(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {showCreateModal ? 'Create Discount' : 'Update Discount'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDiscounts;

