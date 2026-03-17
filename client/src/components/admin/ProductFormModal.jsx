import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Package,
  Star,
  Eye,
  EyeOff,
  Save,
  AlertCircle
} from 'lucide-react';

const ProductFormModal = ({ title, formData, setFormData, onSubmit, onClose, categories, availableDiscounts = [] }) => {
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUrls, setImageUrls] = useState(formData.images || []);
  const [priceValidation, setPriceValidation] = useState({
    regularPriceError: '',
    discountPriceError: '',
    discountEnabled: false
  });

  // Enable discount price field only when regular price is entered
  useEffect(() => {
    const regularPrice = parseFloat(formData.regularPrice);
    if (regularPrice > 0) {
      setPriceValidation(prev => ({
        ...prev,
        discountEnabled: true
      }));
    } else {
      setPriceValidation(prev => ({
        ...prev,
        discountEnabled: false,
        discountPriceError: ''
      }));
      // Clear discount price if regular price is cleared
      if (formData.discountPrice) {
        setFormData(prev => ({
          ...prev,
          discountPrice: ''
        }));
      }
    }
  }, [formData.regularPrice, formData.discountPrice, setFormData]);

  const validateRegularPrice = (value) => {
    const price = parseFloat(value);
    if (value && (isNaN(price) || price <= 0)) {
      setPriceValidation(prev => ({
        ...prev,
        regularPriceError: 'Regular price must be a positive number'
      }));
      return false;
    } else {
      setPriceValidation(prev => ({
        ...prev,
        regularPriceError: ''
      }));
      return true;
    }
  };

  const validateDiscountPrice = (value) => {
    if (!value) {
      setPriceValidation(prev => ({
        ...prev,
        discountPriceError: ''
      }));
      return true;
    }

    const discountPrice = parseFloat(value);
    const regularPrice = parseFloat(formData.regularPrice);

    if (isNaN(discountPrice) || discountPrice <= 0) {
      setPriceValidation(prev => ({
        ...prev,
        discountPriceError: 'Discount price must be a positive number'
      }));
      return false;
    }

    if (discountPrice >= regularPrice) {
      setPriceValidation(prev => ({
        ...prev,
        discountPriceError: 'Discount price must be less than regular price'
      }));
      return false;
    }

    setPriceValidation(prev => ({
      ...prev,
      discountPriceError: ''
    }));
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle pricing validation
    if (name === 'regularPrice') {
      validateRegularPrice(value);
    } else if (name === 'discountPrice') {
      validateDiscountPrice(value);
    }
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) {
      alert('Please enter a valid image URL');
      return;
    }

    // Validate URL format
    try {
      new URL(imageUrlInput);
    } catch (e) {
      alert('Please enter a valid image URL');
      return;
    }
    
    // Verify that the image is actually loadable before saving
    const urlToTest = imageUrlInput.trim();
    const img = new Image();
    img.onload = () => {
      const newUrls = [...imageUrls, urlToTest];
      setImageUrls(newUrls);
      setFormData(prev => ({
        ...prev,
        images: newUrls
      }));
      setImageUrlInput('');
    };
    img.onerror = () => {
      alert('That image URL could not be loaded. Please check the link and try again.');
    };
    img.src = urlToTest;
  };

  const removeImage = (index) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    setFormData(prev => ({
      ...prev,
      images: newUrls
    }));
  };

  const generateSKU = () => {
    const category = formData.category ? formData.category.substring(0, 3).toUpperCase() : 'PRD';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({
      ...prev,
      sku: `${category}-${random}`
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Validate pricing before submission
    const regularPriceValid = validateRegularPrice(formData.regularPrice);
    const discountPriceValid = validateDiscountPrice(formData.discountPrice);
    
    if (!regularPriceValid || !discountPriceValid) {
      return; // Don't submit if validation fails
    }
    
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {categories && categories.length > 0 ? (
                    categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category._id}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No categories available</option>
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SKU/Item Code *</label>
                <div className="flex">
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter SKU"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateSKU}
                    className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product description"
                required
              />
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <span className="mr-2">💰</span>
                Pricing Information
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Set your product pricing. Regular price is required, discount price is optional but must be less than regular price.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Regular Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="regularPrice"
                    value={formData.regularPrice}
                    onChange={handleInputChange}
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      priceValidation.regularPriceError 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                {priceValidation.regularPriceError && (
                  <div className="mt-1 flex items-center text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {priceValidation.regularPriceError}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">Enter the regular selling price</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Price
                  {!priceValidation.discountEnabled && (
                    <span className="text-gray-400 text-sm ml-2">(Enter regular price first)</span>
                  )}
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    priceValidation.discountEnabled ? 'text-gray-500' : 'text-gray-400'
                  }`}>₹</span>
                  <input
                    type="number"
                    name="discountPrice"
                    value={formData.discountPrice}
                    onChange={handleInputChange}
                    disabled={!priceValidation.discountEnabled}
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      priceValidation.discountPriceError 
                        ? 'border-red-300 bg-red-50' 
                        : priceValidation.discountEnabled
                        ? 'border-gray-300'
                        : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                    }`}
                    placeholder={priceValidation.discountEnabled ? "0.00" : "Enter regular price first"}
                    min="0"
                    step="0.01"
                  />
                  {!priceValidation.discountEnabled && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                  )}
                </div>
                {priceValidation.discountPriceError && (
                  <div className="mt-1 flex items-center text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {priceValidation.discountPriceError}
                  </div>
                )}
                {priceValidation.discountEnabled && !priceValidation.discountPriceError && (
                  <p className="mt-1 text-xs text-gray-500">
                    Must be less than regular price (₹{formData.regularPrice || '0'})
                  </p>
                )}
              </div>
            </div>

            {/* Discount Selection */}
            {availableDiscounts.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apply Discount (Optional)
                </label>
                <select
                  name="linkedDiscount"
                  value={formData.linkedDiscount || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No discount</option>
                  {availableDiscounts.map((discount) => (
                    <option key={discount._id} value={discount._id}>
                      {discount.name} - {discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`} off
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select a discount to automatically apply to this product
                </p>
              </div>
            )}

            {/* Price Summary */}
            {formData.regularPrice && formData.discountPrice && !priceValidation.discountPriceError && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Price Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Regular Price:</span>
                    <span className="ml-2 font-medium">₹{formData.regularPrice}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Discount Price:</span>
                    <span className="ml-2 font-medium text-green-600">₹{formData.discountPrice}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Savings:</span>
                    <span className="ml-2 font-medium text-green-600">
                      ₹{(parseFloat(formData.regularPrice) - parseFloat(formData.discountPrice)).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Discount %:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {Math.round(((parseFloat(formData.regularPrice) - parseFloat(formData.discountPrice)) / parseFloat(formData.regularPrice)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
            </div>

            {/* Inventory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
                <input
                  type="number"
                  name="lowStockThreshold"
                  value={formData.lowStockThreshold}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                  min="0"
                />
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Images (URLs)</label>
              <div className="space-y-4">
                {/* URL Input */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </button>
                </div>
                
                {/* Image Preview */}
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150?text=Invalid+URL';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                          {url.length > 30 ? url.substring(0, 30) + '...' : url}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Enter image URLs and click Add to add them to your product. Multiple images will be shown as a slideshow in the store.
                </p>
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tag1, tag2, tag3"
                />
                <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.0"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions (cm)</label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Length</label>
                  <input
                    type="number"
                    name="dimensions.length"
                    value={formData.dimensions.length}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Width</label>
                  <input
                    type="number"
                    name="dimensions.width"
                    value={formData.dimensions.width}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Height</label>
                  <input
                    type="number"
                    name="dimensions.height"
                    value={formData.dimensions.height}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Featured Product
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="published"
                  checked={formData.published}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  {formData.published ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                  Publish Product
                </span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {title.includes('Create') ? 'Create Product' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
