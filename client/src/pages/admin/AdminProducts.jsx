import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiCall } from '../../utils/api';
import ProductFormModal from '../../components/admin/ProductFormModal';
import CategoryManagementModal from '../../components/admin/CategoryManagementModal';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Archive,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  AlertTriangle,
  Settings,
  Upload,
  X,
  Save,
  Tag,
  FileSpreadsheet,
  Download,
  Percent,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  ThumbsUp,
  ThumbsDown,
  Filter as FilterIcon,
  SortAsc,
  SortDesc
} from 'lucide-react';

const AdminProducts = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFeatured, setFilterFeatured] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [message, setMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ priceAdjustment: '', stockAdjustment: '', discountType: 'percentage', discountValue: '' });
  const [discountData, setDiscountData] = useState({ 
    name: '', 
    type: 'percentage', 
    value: '', 
    startDate: '', 
    endDate: '', 
    applicableTo: 'all',
    category: '',
    products: []
  });
  const [discountValidation, setDiscountValidation] = useState({ startDateError: '', endDateError: '', valueError: '', isValid: true });
  const [categoriesWithProducts, setCategoriesWithProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [filterStock, setFilterStock] = useState('');
  const [filterPriceRange, setFilterPriceRange] = useState({ min: '', max: '' });
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [upcomingDiscounts, setUpcomingDiscounts] = useState([]);
  const [showUpcomingDiscounts, setShowUpcomingDiscounts] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    sku: '',
    regularPrice: '',
    discountPrice: '',
    stock: '',
    lowStockThreshold: '10',
    images: [],
    featured: false,
    published: true,
    tags: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    linkedDiscount: ''
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadInventoryStats();
    loadReviews();
    loadCategoriesWithProducts();
    loadAvailableDiscounts();
    loadUpcomingDiscounts();
  }, [currentPage, searchTerm, filterCategory, filterStatus, filterFeatured, filterStock, filterPriceRange, sortBy, sortOrder]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterCategory && { category: filterCategory }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterFeatured && { featured: filterFeatured }),
        ...(filterStock && { stock: filterStock }),
        ...(filterPriceRange.min && { minPrice: filterPriceRange.min }),
        ...(filterPriceRange.max && { maxPrice: filterPriceRange.max }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      });
      
      const response = await apiCall(`/admin/products?${params}`);
      if (response.success) {
        setProducts(response.data.products);
        setTotalPages(response.data.pagination.pages);
        setTotalItems(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setMessage('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiCall('/admin/products/categories');
      if (response.success) {
        setCategories(response.data.categories);
      } else {
        // Fallback: get categories from products
        const productsResponse = await apiCall('/admin/products?limit=1000');
        if (productsResponse.success) {
          const uniqueCategories = [...new Set(productsResponse.data.products.map(product => product.category))];
          const categoryObjects = uniqueCategories.filter(cat => cat).map(cat => ({ _id: cat }));
          setCategories(categoryObjects);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback: use static categories if API fails
      const staticCategories = ['Tools', 'Fertilizers', 'Pots', 'Plant Care', 'Watering Cans', 'Soil & Compost', 'Garden Accessories', 'Indoor Growing', 'Outdoor Growing', 'Seeds', 'Planters', 'Garden Tools', 'Plant Food', 'Pest Control'].map(cat => ({ _id: cat }));
      setCategories(staticCategories);
    }
  };

  const loadInventoryStats = async () => {
    try {
      const response = await apiCall('/admin/products/inventory-stats');
      if (response.success) {
        setInventoryStats(response.data);
      }
    } catch (error) {
      console.error('Error loading inventory stats:', error);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await apiCall('/admin/products/reviews');
      if (response.success) {
        setReviews(response.data);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const loadCategoriesWithProducts = async () => {
    try {
      const response = await apiCall('/admin/products/categories-with-products');
      if (response.success) {
        setCategoriesWithProducts(response.data.categories);
      } else {
        // Fallback: get categories from products if endpoint doesn't exist
        const productsResponse = await apiCall('/admin/products?limit=1000');
        if (productsResponse.success) {
          const uniqueCategories = [...new Set(productsResponse.data.products.map(product => product.category))];
          setCategoriesWithProducts(uniqueCategories.filter(cat => cat));
        }
      }
    } catch (error) {
      console.error('Error loading categories with products:', error);
      // Fallback: use static categories if API fails
      setCategoriesWithProducts(['Tools', 'Fertilizers', 'Pots', 'Plant Care', 'Watering Cans', 'Soil & Compost', 'Garden Accessories', 'Indoor Growing', 'Outdoor Growing', 'Seeds', 'Planters', 'Garden Tools', 'Plant Food', 'Pest Control']);
    }
  };

  const loadAvailableDiscounts = async () => {
    try {
      setLoadingDiscounts(true);
      const response = await apiCall('/admin/products/discounts?status=active');
      if (response.success) {
        setAvailableDiscounts(response.data.discounts);
      }
    } catch (error) {
      console.error('Error loading available discounts:', error);
      setAvailableDiscounts([]);
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const loadUpcomingDiscounts = async () => {
    try {
      const response = await apiCall('/admin/products/upcoming-discounts');
      if (response.success) {
        setUpcomingDiscounts(response.data.upcomingDiscounts);
      }
    } catch (error) {
      console.error('Error loading upcoming discounts:', error);
      setUpcomingDiscounts([]);
    }
  };

  // Search products for autocomplete
  const searchProducts = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setProductSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await apiCall(`/admin/products?search=${encodeURIComponent(searchTerm)}&limit=10`);
      if (response.success) {
        const filteredProducts = response.data.products.filter(product => 
          !discountData.products.includes(product._id)
        );
        setProductSuggestions(filteredProducts);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setProductSuggestions([]);
    }
  };

  // Handle product search input
  const handleProductSearch = (value) => {
    setProductSearchTerm(value);
    setSelectedSuggestionIndex(-1);
    searchProducts(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || productSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < productSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          addProductToDiscount(productSuggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Add product to discount
  const addProductToDiscount = (product) => {
    const updatedProducts = [...discountData.products, product._id];
    handleDiscountDataChange('products', updatedProducts);
    setProductSearchTerm('');
    setShowSuggestions(false);
  };

  // Remove product from discount
  const removeProductFromDiscount = (productId) => {
    const updatedProducts = discountData.products.filter(id => id !== productId);
    handleDiscountDataChange('products', updatedProducts);
  };

  // Get selected products details
  const getSelectedProducts = () => {
    return products.filter(product => discountData.products.includes(product._id));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      sku: '',
      regularPrice: '',
      discountPrice: '',
      stock: '',
      lowStockThreshold: '10',
      images: [],
      featured: false,
      published: true,
      tags: '',
      weight: '',
      dimensions: {
        length: '',
        width: '',
        height: ''
      },
      linkedDiscount: ''
    });
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        regularPrice: parseFloat(formData.regularPrice),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        stock: parseInt(formData.stock),
        lowStockThreshold: parseInt(formData.lowStockThreshold),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: {
          length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : null,
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : null,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : null
        },
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };

      const response = await apiCall('/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });

      if (response.success) {
        setMessage('Product created successfully');
        setShowCreateModal(false);
        resetForm();
        loadProducts();
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setMessage('Error creating product: ' + error.message);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        regularPrice: parseFloat(formData.regularPrice),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        stock: parseInt(formData.stock),
        lowStockThreshold: parseInt(formData.lowStockThreshold),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: {
          length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : null,
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : null,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : null
        },
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };

      const response = await apiCall(`/admin/products/${editingProduct._id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });

      if (response.success) {
        setMessage('Product updated successfully');
        setShowEditModal(false);
        setEditingProduct(null);
        resetForm();
        loadProducts();
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setMessage('Error updating product: ' + error.message);
    }
  };

  const handleArchiveProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to archive this product?')) return;
    
    try {
      const response = await apiCall(`/admin/products/${productId}/archive`, {
        method: 'PUT'
      });
      
      if (response.success) {
        setMessage('Product archived successfully');
        loadProducts();
      }
    } catch (error) {
      console.error('Error archiving product:', error);
      setMessage('Error archiving product');
    }
  };

  const handleRestoreProduct = async (productId) => {
    try {
      const response = await apiCall(`/admin/products/${productId}/restore`, {
        method: 'PUT'
      });
      
      if (response.success) {
        setMessage('Product restored successfully');
        loadProducts();
      }
    } catch (error) {
      console.error('Error restoring product:', error);
      setMessage('Error restoring product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to permanently delete this product? This action cannot be undone.')) return;
    
    try {
      const response = await apiCall(`/admin/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        setMessage('Product deleted permanently');
        loadProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setMessage('Error deleting product');
    }
  };

  // Bulk operations
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(products.map(product => product._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId, checked) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleBulkArchive = async () => {
    if (selectedProducts.length === 0) {
      setMessage('Please select products to archive');
      return;
    }

    if (!window.confirm(`Are you sure you want to archive ${selectedProducts.length} products?`)) return;

    try {
      const response = await apiCall('/admin/products/bulk', {
        method: 'PUT',
        body: JSON.stringify({
          productIds: selectedProducts,
          updates: { archived: true, published: false }
        })
      });

      if (response.success) {
        setMessage(`${selectedProducts.length} products archived successfully`);
        setSelectedProducts([]);
        loadProducts();
      }
    } catch (error) {
      console.error('Error archiving products:', error);
      setMessage('Error archiving products');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      setMessage('Please select products to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete ${selectedProducts.length} products? This action cannot be undone.`)) return;

    try {
      // Delete products one by one (bulk delete endpoint would be ideal)
      const deletePromises = selectedProducts.map(productId => 
        apiCall(`/admin/products/${productId}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      setMessage(`${selectedProducts.length} products deleted permanently`);
      setSelectedProducts([]);
      loadProducts();
    } catch (error) {
      console.error('Error deleting products:', error);
      setMessage('Error deleting products');
    }
  };

  const handleBulkEdit = async () => {
    if (selectedProducts.length === 0) {
      setMessage('Please select products to edit');
      return;
    }

    try {
      const updates = {};
      
      if (bulkEditData.priceAdjustment) {
        const adjustment = parseFloat(bulkEditData.priceAdjustment);
        updates.priceAdjustment = bulkEditData.discountType === 'percentage' ? adjustment : adjustment;
        updates.priceAdjustmentType = bulkEditData.discountType;
      }
      
      if (bulkEditData.stockAdjustment) {
        updates.stockAdjustment = parseInt(bulkEditData.stockAdjustment);
      }

      const response = await apiCall('/admin/products/bulk-edit', {
        method: 'PUT',
        body: JSON.stringify({
          productIds: selectedProducts,
          updates
        })
      });

      if (response.success) {
        setMessage(`${selectedProducts.length} products updated successfully`);
        setSelectedProducts([]);
        setShowBulkEditModal(false);
        setBulkEditData({ priceAdjustment: '', stockAdjustment: '', discountType: 'percentage', discountValue: '' });
        loadProducts();
      }
    } catch (error) {
      console.error('Error bulk editing products:', error);
      setMessage('Error bulk editing products');
    }
  };

  const handleCSVUpload = async (file) => {
    // Validate file
    if (!file) {
      setMessage('Please select a file to upload');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage('File size must be less than 10MB');
      return;
    }

    // Check file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setMessage('Please upload a CSV or Excel file (.csv, .xlsx)');
      return;
    }

    console.log('CSV Upload started:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileExtension
    });
    
    try {
      setLoading(true);
      setMessage('Uploading file...');

      const formData = new FormData();
      formData.append('file', file);
      
      console.log('FormData created, sending request...');
      console.log('FormData contents:', {
        hasFile: formData.has('file'),
        file: formData.get('file'),
        fileType: formData.get('file')?.type,
        fileSize: formData.get('file')?.size
      });
      
      const response = await apiCall('/admin/products/upload-csv', {
        method: 'POST',
        body: formData
        // Don't set Content-Type header, let the browser set it with boundary
      });

      console.log('CSV Upload response:', response);

      if (response.success) {
        const { processed, errors, errorDetails } = response.data;
        
        let message;
        if (errors > 0) {
          message = `Upload completed: ${processed} products created successfully, ${errors} errors encountered.`;
          console.warn('CSV Upload Errors:', errorDetails);
        } else {
          message = `✅ Upload successful! ${processed} products created successfully.`;
        }
        
        setMessage(message);
        
        // Refresh products list to show newly created products
        await loadProducts();
        
        // Show detailed error information in console for debugging
        if (errorDetails && errorDetails.length > 0) {
          console.group('📋 Upload Error Details:');
          errorDetails.forEach((error, index) => {
            console.error(`${index + 1}. ${error}`);
          });
          console.groupEnd();
        }
      } else {
        setMessage('❌ Upload failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setMessage('❌ Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Live validation function for discount dates and value
  const validateDiscountData = (startDate, endDate, value) => {
    const now = new Date();
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;
    
    let startDateError = '';
    let endDateError = '';
    let valueError = '';
    let isValid = true;

    // Validate start date - can be today/now but not before
    if (startDate) {
      if (startDateObj < now) {
        startDateError = 'Start date cannot be in the past';
        isValid = false;
      }
    }

    // Validate end date - must be at least the day after start date
    if (endDate && startDate) {
      const nextDay = new Date(startDateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0); // Start of next day
      
      if (endDateObj < nextDay) {
        endDateError = 'End date must be at least the day after start date';
        isValid = false;
      }
    }

    // Validate discount value - cannot be negative
    if (value !== '' && value !== null && value !== undefined) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        valueError = 'Discount value cannot be negative';
        isValid = false;
      }
    }

    setDiscountValidation({ startDateError, endDateError, valueError, isValid });
    return isValid;
  };

  // Handle discount data changes with live validation
  const handleDiscountDataChange = (field, value) => {
    let newDiscountData = { ...discountData, [field]: value };
    
    // If start date changes, clear end date and reset validation
    if (field === 'startDate') {
      newDiscountData = { ...newDiscountData, endDate: '' };
      setDiscountValidation({ startDateError: '', endDateError: '', valueError: '', isValid: true });
    }
    
    // If applicableTo changes, clear category and products
    if (field === 'applicableTo') {
      newDiscountData = { ...newDiscountData, category: '', products: [] };
    }
    
    setDiscountData(newDiscountData);
    
    // Validate data when it changes
    if (field === 'startDate' || field === 'endDate' || field === 'value') {
      validateDiscountData(
        field === 'startDate' ? value : newDiscountData.startDate,
        field === 'endDate' ? value : newDiscountData.endDate,
        field === 'value' ? value : newDiscountData.value
      );
    }
  };


  const handleCreateDiscount = async () => {
    // Final validation before submission
    if (!validateDiscountData(discountData.startDate, discountData.endDate, discountData.value)) {
      setMessage('Please fix the validation errors before creating the discount');
      return;
    }

    try {
      // Clean up the data before sending
      const cleanDiscountData = {
        ...discountData,
        value: parseFloat(discountData.value),
        // Only include products if applicableTo is 'products'
        products: discountData.applicableTo === 'products' ? discountData.products : undefined,
        // Only include category if applicableTo is 'category'
        category: discountData.applicableTo === 'category' ? discountData.category : undefined
      };

      const response = await apiCall('/admin/products/discounts', {
        method: 'POST',
        body: JSON.stringify(cleanDiscountData)
      });

      if (response.success) {
        setMessage('Discount created successfully');
        setShowDiscountModal(false);
        setDiscountData({ 
          name: '', 
          type: 'percentage', 
          value: '', 
          startDate: '', 
          endDate: '', 
          applicableTo: 'all',
          category: '',
          products: []
        });
        setDiscountValidation({ startDateError: '', endDateError: '', valueError: '', isValid: true });
        setProductSearchTerm('');
        setProductSuggestions([]);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    } catch (error) {
      console.error('Error creating discount:', error);
      setMessage('Error creating discount: ' + error.message);
    }
  };

  const handleReviewAction = async (reviewId, action) => {
    try {
      const response = await apiCall(`/admin/products/reviews/${reviewId}/${action}`, {
        method: 'PUT'
      });

      if (response.success) {
        setMessage(`Review ${action}ed successfully`);
        loadReviews();
      }
    } catch (error) {
      console.error(`Error ${action}ing review:`, error);
      setMessage(`Error ${action}ing review`);
    }
  };

  // Apply discount to a specific product
  const applyDiscountToProduct = async (productId, discountId) => {
    try {
      const response = await apiCall(`/admin/products/${productId}/discount`, {
        method: 'PUT',
        body: JSON.stringify({ discountId, appliedBy: 'manual' })
      });

      if (response.success) {
        setMessage('Discount applied to product successfully');
        loadProducts(); // Reload products to show updated discount info
      }
    } catch (error) {
      console.error('Error applying discount to product:', error);
      setMessage('Error applying discount: ' + error.message);
    }
  };

  // Remove discount from a specific product
  const removeDiscountFromProduct = async (productId, discountId) => {
    try {
      const response = await apiCall(`/admin/products/${productId}/discount/${discountId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        setMessage('Discount removed from product successfully');
        loadProducts(); // Reload products to show updated discount info
      }
    } catch (error) {
      console.error('Error removing discount from product:', error);
      setMessage('Error removing discount: ' + error.message);
    }
  };

  // Apply discount to all products in a category
  const applyDiscountToCategory = async (discountId, category) => {
    try {
      const response = await apiCall(`/admin/discounts/${discountId}/apply-to-category`, {
        method: 'POST',
        body: JSON.stringify({ category })
      });

      if (response.success) {
        setMessage(`Discount applied to ${response.data.appliedCount} products in category "${category}"`);
        loadProducts(); // Reload products to show updated discount info
      }
    } catch (error) {
      console.error('Error applying discount to category:', error);
      setMessage('Error applying discount to category: ' + error.message);
    }
  };

  // Apply discount to multiple selected products
  const handleBulkApplyDiscount = async (discountId) => {
    try {
      let appliedCount = 0;
      let skippedCount = 0;

      for (const productId of selectedProducts) {
        try {
          await apiCall(`/admin/products/${productId}/discount`, {
            method: 'PUT',
            body: JSON.stringify({ discountId, appliedBy: 'manual' })
          });
          appliedCount++;
        } catch (error) {
          skippedCount++;
        }
      }

      setMessage(`Discount applied to ${appliedCount} products, ${skippedCount} already had this discount`);
      setSelectedProducts([]); // Clear selection
      loadProducts(); // Reload products to show updated discount info
    } catch (error) {
      console.error('Error applying bulk discount:', error);
      setMessage('Error applying bulk discount: ' + error.message);
    }
  };

  const generateCSVReport = () => {
    const headers = ['Product Name', 'SKU', 'Category', 'Current Stock', 'Low Stock Threshold', 'Status', 'Price', 'Total Value'];
    const rows = products.map(product => [
      product.name,
      product.sku,
      product.category,
      product.stock,
      product.lowStockThreshold,
      getStatusText(product),
      product.regularPrice,
      product.stock * product.regularPrice
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const handleBulkToggleFeatured = async () => {
    if (selectedProducts.length === 0) {
      setMessage('Please select products to update');
      return;
    }

    try {
      const response = await apiCall('/admin/products/bulk', {
        method: 'PUT',
        body: JSON.stringify({
          productIds: selectedProducts,
          updates: { featured: true }
        })
      });

      if (response.success) {
        setMessage(`${selectedProducts.length} products marked as featured`);
        setSelectedProducts([]);
        loadProducts();
      }
    } catch (error) {
      console.error('Error updating products:', error);
      setMessage('Error updating products');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || '',
      description: product.description || '',
      sku: product.sku || '',
      regularPrice: product.regularPrice || '',
      discountPrice: product.discountPrice || '',
      stock: product.stock || '',
      lowStockThreshold: product.lowStockThreshold || '10',
      images: product.images || [],
      featured: product.featured || false,
      published: product.published !== false,
      tags: product.tags ? product.tags.join(', ') : '',
      weight: product.weight || '',
        dimensions: {
          length: product.dimensions?.length || '',
          width: product.dimensions?.width || '',
          height: product.dimensions?.height || ''
        },
        linkedDiscount: product.linkedDiscount || ''
      });
    setShowEditModal(true);
  };

  const getStatusBadgeColor = (product) => {
    if (product.archived) return 'bg-gray-100 text-gray-800';
    if (!product.published) return 'bg-yellow-100 text-yellow-800';
    if (product.stock === 0) return 'bg-red-100 text-red-800';
    if (product.stock <= product.lowStockThreshold) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (product) => {
    if (product.archived) return 'Archived';
    if (!product.published) return 'Unpublished';
    if (product.stock === 0) return 'Out of Stock';
    if (product.stock <= product.lowStockThreshold) return 'Low Stock';
    return 'Published';
  };

  const getStatusIcon = (product) => {
    if (product.archived) return <Archive className="h-4 w-4 text-gray-600" />;
    if (!product.published) return <EyeOff className="h-4 w-4 text-yellow-600" />;
    if (product.stock === 0) return <XCircle className="h-4 w-4 text-red-600" />;
    if (product.stock <= product.lowStockThreshold) return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  return (
    <>
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600 text-sm">Manage products, inventory, pricing, and analytics</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Bulk Actions */}
              {selectedProducts.length > 0 && (
                <div className="flex items-center space-x-2 mr-4 p-2 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700 font-medium">
                    {selectedProducts.length} selected
                  </span>
                  <button
                    onClick={() => setShowBulkEditModal(true)}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Bulk Edit
                  </button>
                  <button
                    onClick={handleBulkToggleFeatured}
                    className="flex items-center px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Mark Featured
                  </button>
                  <button
                    onClick={handleBulkArchive}
                    className="flex items-center px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                  >
                    <Archive className="h-3 w-3 mr-1" />
                    Archive
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </button>
                </div>
              )}
              
              <button
                onClick={() => setShowDiscountModal(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Percent className="h-4 w-4 mr-2" />
                Discounts
              </button>
              <button
                onClick={() => {
                  setShowUpcomingDiscounts(!showUpcomingDiscounts);
                  if (!showUpcomingDiscounts) {
                    loadUpcomingDiscounts();
                  }
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Upcoming Discounts
                {upcomingDiscounts.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                    {upcomingDiscounts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Categories
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </button>
              <button
                onClick={loadProducts}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category._id}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading categories...</option>
              )}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={filterFeatured}
              onChange={(e) => setFilterFeatured(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Featured</option>
              <option value="true">Featured</option>
              <option value="false">Not Featured</option>
            </select>
            <select
                  value={filterStock}
                  onChange={(e) => setFilterStock(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                  <option value="">All Stock</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
            </select>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={filterPriceRange.min}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow positive numbers or empty string
                      if (value === '' || (parseFloat(value) >= 0)) {
                        setFilterPriceRange(prev => ({ ...prev, min: value }));
                      }
                    }}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={filterPriceRange.max}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow positive numbers or empty string
                      if (value === '' || (parseFloat(value) >= 0)) {
                        setFilterPriceRange(prev => ({ ...prev, max: value }));
                      }
                    }}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="stock">Stock</option>
                    <option value="createdAt">Date Added</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </button>
          </div>
        </div>

              {/* CSV/Excel Upload */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          console.log('File input changed:', file);
                          if (file) {
                            handleCSVUpload(file);
                          } else {
                            console.log('No file selected');
                          }
                          // Reset input value to allow re-uploading same file
                          e.target.value = '';
                        }}
                        className="hidden"
                        id="csv-upload"
                        disabled={loading}
                      />
                      <label
                        htmlFor="csv-upload"
                        className={`flex items-center px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                          loading 
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        {loading ? 'Uploading...' : 'Upload CSV/Excel'}
                      </label>
                    </div>
                    <button
                      onClick={() => {
                        // Download CSV template
                        const csvContent = 'name,category,description,sku,regularPrice,discountPrice,stock,lowStockThreshold,featured,published,tags,weight,length,width,height,image1,image2,image3\n';
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'products_template.csv';
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={loading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </button>
                  </div>
                  
                  {/* Upload Instructions */}
                  <div className="text-sm text-gray-600 max-w-md">
                    <p className="font-medium mb-1">📋 Upload Instructions:</p>
                    <ul className="text-xs space-y-1">
                      <li>• Supported formats: CSV, Excel (.xlsx, .xls)</li>
                      <li>• Max file size: 10MB</li>
                      <li>• Required fields: name, category, description, sku, regularPrice, stock</li>
                      <li>• Optional image fields: image1, image2, image3 (URLs)</li>
                      <li>• Download template for correct format</li>
                    </ul>
                  </div>
                </div>
                
                {/* Upload Status Message */}
                {message && (
                  <div className={`mt-3 p-3 rounded-lg text-sm ${
                    message.includes('✅') 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : message.includes('❌') 
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {message}
                  </div>
                )}
              </div>
            </div>


        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          className="rounded" 
                          checked={selectedProducts.includes(product._id)}
                          onChange={(e) => handleSelectProduct(product._id, e.target.checked)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {product.images && product.images.length > 0 ? (
                              <img className="h-12 w-12 rounded-lg object-cover" src={product.images[0]} alt={product.name} />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-300 flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-medium">₹{product.finalPrice || product.currentPrice}</span>
                          {(product.finalPrice || product.discountPrice) && (
                            <span className="text-xs text-gray-500 line-through">₹{product.regularPrice}</span>
                          )}
                          {product.appliedDiscounts && product.appliedDiscounts.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {product.appliedDiscounts.slice(0, 2).map((discount, idx) => {
                                const now = new Date();
                                const startDate = new Date(discount.discountId?.startDate || discount.startDate);
                                const endDate = new Date(discount.discountId?.endDate || discount.endDate);
                                const isActive = now >= startDate && now <= endDate;
                                const isUpcoming = now < startDate;
                                
                                return (
                                  <span 
                                    key={idx} 
                                    className={`px-1 py-0.5 text-xs rounded ${
                                      isActive ? 'bg-green-100 text-green-700' : 
                                      isUpcoming ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                    }`}
                                    title={
                                      isActive ? 'Active discount' : 
                                      isUpcoming ? `Starts ${startDate.toLocaleDateString()}` : 
                                      'Expired discount'
                                    }
                                  >
                                    {discount.discountName || discount.discountId?.name}
                                    {isUpcoming && ' (↑)'}
                                  </span>
                                );
                              })}
                              {product.appliedDiscounts.length > 2 && (
                                <span className="px-1 py-0.5 bg-purple-200 text-purple-800 text-xs rounded">
                                  +{product.appliedDiscounts.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className={product.stock <= product.lowStockThreshold ? 'text-orange-600 font-medium' : ''}>
                            {product.stock}
                          </span>
                          {product.stock <= product.lowStockThreshold && (
                            <AlertTriangle className="h-4 w-4 text-orange-500 ml-1" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(product)}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(product)}`}>
                            {getStatusText(product)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.featured ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        ) : (
                          <div className="h-4 w-4"></div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="text-blue-600 hover:text-blue-500"
                            title="Edit product"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {product.archived ? (
                            <button
                              onClick={() => handleRestoreProduct(product._id)}
                              className="text-green-600 hover:text-green-500"
                              title="Restore product"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchiveProduct(product._id)}
                              className="text-orange-600 hover:text-orange-500"
                              title="Archive product"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-red-600 hover:text-red-500"
                            title="Delete permanently"
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

      {/* Modals */}
      {/* Create Product Modal */}
      {showCreateModal && (
        <ProductFormModal
          title="Create New Product"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateProduct}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          categories={categories}
          availableDiscounts={availableDiscounts}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <ProductFormModal
          title="Edit Product"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleEditProduct}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
            resetForm();
          }}
          categories={categories}
          availableDiscounts={availableDiscounts}
        />
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Bulk Edit Products</h2>
                <button onClick={() => setShowBulkEditModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Adjustment</label>
                  <div className="flex space-x-2">
                    <select value={bulkEditData.discountType} onChange={(e) => setBulkEditData(prev => ({ ...prev, discountType: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                    <input type="number" placeholder="Value" value={bulkEditData.priceAdjustment} onChange={(e) => setBulkEditData(prev => ({ ...prev, priceAdjustment: e.target.value }))} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Adjustment</label>
                  <input type="number" placeholder="Stock change (positive or negative)" value={bulkEditData.stockAdjustment} onChange={(e) => setBulkEditData(prev => ({ ...prev, stockAdjustment: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowBulkEditModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleBulkEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Apply Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create Discount</h2>
                <button onClick={() => setShowDiscountModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Name</label>
                  <input type="text" placeholder="e.g., Summer Sale 20% Off" value={discountData.name} onChange={(e) => handleDiscountDataChange('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                  <select value={discountData.type} onChange={(e) => handleDiscountDataChange('type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Value
                    <span className="text-xs text-gray-500 ml-1">(Positive numbers only)</span>
                  </label>
                  <input 
                    type="number" 
                    placeholder="e.g., 20 for 20% or ₹100" 
                    value={discountData.value} 
                    onChange={(e) => handleDiscountDataChange('value', e.target.value)}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      discountValidation.valueError 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                  />
                  {discountValidation.valueError && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {discountValidation.valueError}
                    </p>
                  )}
                  {discountData.value && !discountValidation.valueError && (
                    <p className="text-green-600 text-xs mt-1 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid discount value
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date & Time
                      <span className="text-xs text-gray-500 ml-1">(Required first)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={discountData.startDate}
                      onChange={(e) => handleDiscountDataChange('startDate', e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent no-today-button ${
                        discountValidation.startDateError 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      placeholder="Select start date and time"
                    />
                    {discountValidation.startDateError && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {discountValidation.startDateError}
                      </p>
                    )}
                    {discountData.startDate && !discountValidation.startDateError && (
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Start date set successfully
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date & Time
                      <span className="text-xs text-gray-500 ml-1">(Day after start date)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={discountData.endDate}
                      onChange={(e) => handleDiscountDataChange('endDate', e.target.value)}
                      min={discountData.startDate ? (() => {
                        const nextDay = new Date(discountData.startDate);
                        nextDay.setDate(nextDay.getDate() + 1);
                        return nextDay.toISOString().slice(0, 16);
                      })() : new Date().toISOString().slice(0, 16)}
                      disabled={!discountData.startDate}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent no-today-button ${
                        !discountData.startDate 
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : discountValidation.endDateError 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      placeholder={!discountData.startDate ? "Select start date first" : "Select end date and time"}
                    />
                    {!discountData.startDate && (
                      <p className="text-gray-500 text-xs mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Please select start date first
                      </p>
                    )}
                    {discountValidation.endDateError && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {discountValidation.endDateError}
                      </p>
                    )}
                    {discountData.endDate && !discountValidation.endDateError && (
                      <p className="text-green-600 text-xs mt-1 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        End date set successfully
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Applicable To
                    <span className="text-xs text-gray-500 ml-1">(Live categories)</span>
                  </label>
                  <select value={discountData.applicableTo} onChange={(e) => handleDiscountDataChange('applicableTo', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="all">All Products</option>
                    <option value="category">Specific Category</option>
                    <option value="products">Specific Products (Manual Selection)</option>
                  </select>
                  {categoriesWithProducts.length === 0 && (
                    <p className="text-gray-500 text-xs mt-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Loading categories...
                    </p>
                  )}
                  {categoriesWithProducts.length > 0 && (
                    <p className="text-green-600 text-xs mt-1 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {categoriesWithProducts.length} categories with products available
                    </p>
                  )}
                </div>

                {/* Category Selection */}
                {discountData.applicableTo === 'category' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      value={discountData.category}
                      onChange={(e) => handleDiscountDataChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      {categoriesWithProducts.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Products Selection */}
                {discountData.applicableTo === 'products' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Products *</label>
                    
                    {/* Product Search Input */}
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={productSearchTerm}
                          onChange={(e) => handleProductSearch(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Search and add products..."
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />
                      </div>
                      
                      {/* Product Suggestions Dropdown */}
                      {showSuggestions && productSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {productSuggestions.map((product, index) => (
                            <div
                              key={product._id}
                              onClick={() => addProductToDiscount(product)}
                              className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                index === selectedSuggestionIndex 
                                  ? 'bg-blue-100 text-blue-900' 
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-gray-900">{product.name}</p>
                                  <p className="text-sm text-gray-500">{product.category}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-gray-900">₹{product.regularPrice}</p>
                                  <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Products List */}
                    {discountData.products.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Selected Products ({discountData.products.length})
                        </p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {getSelectedProducts().map((product) => (
                            <div
                              key={product._id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <p className="text-sm text-gray-500">
                                  {product.category} • ₹{product.regularPrice} • SKU: {product.sku}
                                </p>
                              </div>
                              <button
                                onClick={() => removeProductFromDiscount(product._id)}
                                className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                                title="Remove product"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Type product name to search and add products to this discount
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const allProductIds = products.map(p => p._id);
                          handleDiscountDataChange('products', allProductIds);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Select All Products
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowDiscountModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button 
                  onClick={handleCreateDiscount} 
                  disabled={!discountValidation.isValid}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    discountValidation.isValid 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Create Discount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <CategoryManagementModal
          categories={categories}
          onClose={() => setShowCategoryModal(false)}
          onUpdate={() => {
            loadCategories();
            loadCategoriesWithProducts();
          }}
        />
      )}

      {/* Upcoming Discounts Modal */}
      {showUpcomingDiscounts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Upcoming Discounts</h2>
                <button 
                  onClick={() => setShowUpcomingDiscounts(false)} 
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {upcomingDiscounts.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming discounts scheduled</p>
                  </div>
                ) : (
                  upcomingDiscounts.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{item.discount.name}</h3>
                            {item.discount.autoApplied && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                Applied
                              </span>
                            )}
                            {item.discount.status === 'scheduled' && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                Scheduled
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {item.discount.type === 'percentage' ? `${item.discount.value}% off` : `₹${item.discount.value} off`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Applicable to: {item.discount.applicableTo === 'all' ? 'All Products' : 
                                           item.discount.applicableTo === 'category' ? `Category: ${item.discount.category}` : 
                                           'Specific Products'}
                          </p>
                          {item.discount.autoApplied && (
                            <p className="text-xs text-green-600 mt-1">
                              Applied to {item.discount.appliedCount} products
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-600">
                            Starts: {new Date(item.discount.startDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Ends: {new Date(item.discount.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {item.discount.autoApplied 
                            ? `${item.discount.appliedCount} products currently have this discount`
                            : `${item.productCount} products will be affected`
                          }
                        </span>
                        {!item.discount.autoApplied && item.discount.status === 'scheduled' && (
                          <button
                            onClick={() => {
                              if (item.discount.applicableTo === 'category') {
                                applyDiscountToCategory(item.discount._id, item.discount.category);
                              }
                              setShowUpcomingDiscounts(false);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Apply Now
                          </button>
                        )}
                        {item.discount.autoApplied && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded">
                            Auto-Applied
                          </span>
                        )}
                      </div>
                      
                      {item.products.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">Sample products:</p>
                          <div className="flex flex-wrap gap-1">
                            {item.products.slice(0, 5).map((product, pIdx) => (
                              <span key={pIdx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {product.name}
                              </span>
                            ))}
                            {item.products.length > 5 && (
                              <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                                +{item.products.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AdminProducts;