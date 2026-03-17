import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Package,
  Loader2,
  Upload,
} from 'lucide-react';

const emptyForm = {
  title: '',
  description: '',
  price: '',
  stock: '',
  category: 'fruit',
  images: [''],
};

const categories = [
  { value: 'fruit', label: 'Fruit' },
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'plant', label: 'Plant' },
];

const VendorProducts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (user && user.role !== 'vendor') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  const loadProducts = async (pageToLoad = 1) => {
    try {
      setLoading(true);
      const res = await vendorAPI.getProducts(pageToLoad, 20);
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || null);
      setPage(pageToLoad);
    } catch (e) {
      console.error('Failed to load vendor products', e);
      setError(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(1);
  }, []);

  const openCreateForm = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setError('');
    setUploadError('');
    setFormOpen(true);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.name || '',
      description: product.description || '',
      price: product.regularPrice != null ? String(product.regularPrice) : '',
      stock: product.stock != null ? String(product.stock) : '',
      category: product.category || 'fruit',
      images: Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : [''],
    });
    setError('');
    setUploadError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingProduct(null);
    setFormData(emptyForm);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (index, value) => {
    setFormData((prev) => {
      const nextImages = [...prev.images];
      nextImages[index] = value;
      return { ...prev, images: nextImages };
    });
  };

  const addImageField = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ''],
    }));
  };

  const handleUploadImage = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Use JPEG, PNG or WebP.');
      return;
    }
    setUploadError('');
    setUploading(true);
    try {
      const res = await vendorAPI.uploadImage(file);
      const url = res?.url;
      if (url) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images.filter(Boolean), url],
        }));
      } else {
        setUploadError('No URL returned.');
      }
    } catch (err) {
      setUploadError(err?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImageField = (index) => {
    setFormData((prev) => {
      const nextImages = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: nextImages.length > 0 ? nextImages : [''] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      stock: Number(formData.stock),
      category: formData.category,
      images: formData.images.map((img) => img.trim()).filter(Boolean),
    };

    try {
      if (editingProduct) {
        await vendorAPI.updateProduct(editingProduct._id, payload);
      } else {
        await vendorAPI.createProduct(payload);
      }
      await loadProducts(page);
      closeForm();
    } catch (e) {
      console.error('Failed to save product', e);
      setError(e.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (productId) => {
    try {
      await vendorAPI.toggleProductAvailability(productId);
      await loadProducts(page);
    } catch (e) {
      console.error('Failed to toggle availability', e);
      setError(e.message || 'Failed to update product');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await vendorAPI.deleteProduct(productId);
      await loadProducts(page);
    } catch (e) {
      console.error('Failed to delete product', e);
      setError(e.message || 'Failed to delete product');
    }
  };

  const isSoldOut = (product) => product.stock === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-forest-green-800 flex items-center gap-2">
              <Package className="w-6 h-6 text-forest-green-600" />
              My Products
            </h1>
            <p className="text-sm text-forest-green-600">
              Manage your home-grown fruits, vegetables, and baby plants.
            </p>
          </div>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-forest-green-600 text-cream-50 text-sm font-semibold shadow-lg hover:bg-forest-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Products list */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/60 p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-forest-green-600 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="font-medium mb-2">No products yet</p>
              <p className="text-sm mb-4">
                Start by adding your first home-grown product.
              </p>
              <button
                onClick={openCreateForm}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-forest-green-600 text-cream-50 text-sm font-semibold shadow hover:bg-forest-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="relative flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <div className="relative aspect-video bg-forest-green-50">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-forest-green-500 text-sm">
                          No image
                        </div>
                      )}
                      {isSoldOut(product) && (
                        <span className="absolute top-2 left-2 rounded-full bg-red-600 text-white text-[11px] px-2 py-0.5 font-semibold">
                          Sold Out
                        </span>
                      )}
                      {!product.published && (
                        <span className="absolute top-2 right-2 rounded-full bg-gray-800/80 text-white text-[11px] px-2 py-0.5 font-semibold">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col p-3 sm:p-4">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-base font-bold text-forest-green-700">
                            ₹{product.regularPrice != null ? product.regularPrice.toFixed(2) : '0.00'}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Stock: {product.stock}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-forest-green-50 px-2 py-0.5 text-[11px] font-medium text-forest-green-700">
                          {product.category}
                        </span>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100 space-x-1">
                        <button
                          onClick={() => handleToggleAvailability(product._id)}
                          className="inline-flex items-center text-[11px] font-medium text-gray-700 hover:text-forest-green-700"
                        >
                          {product.published ? (
                            <>
                              <ToggleRight className="w-4 h-4 mr-1 text-forest-green-600" />
                              Visible
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 mr-1 text-gray-400" />
                              Hidden
                            </>
                          )}
                        </button>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditForm(product)}
                            className="inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-medium text-forest-green-700 bg-forest-green-50 hover:bg-forest-green-100"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-600 pt-2">
                  <span>
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <div className="space-x-2">
                    <button
                      disabled={!pagination.hasPrev}
                      onClick={() => loadProducts(page - 1)}
                      className={`px-3 py-1 rounded-full border text-xs ${
                        pagination.hasPrev
                          ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          : 'border-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      disabled={!pagination.hasNext}
                      onClick={() => loadProducts(page + 1)}
                      className={`px-3 py-1 rounded-full border text-xs ${
                        pagination.hasNext
                          ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          : 'border-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form modal (simple overlay) */}
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h2>
                <button
                  onClick={closeForm}
                  className="text-sm text-gray-500 hover:text-gray-700"
                  disabled={saving}
                >
                  Close
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent"
                    placeholder="E.g. Organic Mangoes (1kg)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent"
                    placeholder="Short description of your product"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleFormChange('price', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.stock}
                      onChange={(e) => handleFormChange('stock', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent"
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Images
                  </label>
                  <p className="text-[11px] text-gray-500 mb-1">
                    Upload an image or paste a URL. JPEG, PNG or WebP, max 5MB.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleUploadImage}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mb-2 inline-flex items-center gap-2 rounded-xl border border-forest-green-300 bg-forest-green-50 px-3 py-2 text-xs font-medium text-forest-green-700 hover:bg-forest-green-100 disabled:opacity-60"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading…' : 'Upload image'}
                  </button>
                  {uploadError && (
                    <p className="text-xs text-red-600 mb-2">{uploadError}</p>
                  )}
                  <div className="space-y-2">
                    {formData.images.map((img, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={img}
                          onChange={(e) => handleImageChange(index, e.target.value)}
                          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent"
                          placeholder="https://..."
                        />
                        {formData.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(index)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addImageField}
                    className="mt-2 text-xs font-medium text-forest-green-700 hover:text-forest-green-800"
                  >
                    + Add another image
                  </button>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-forest-green-600 text-cream-50 text-xs font-semibold shadow hover:bg-forest-green-700 disabled:opacity-60"
                  >
                    {saving && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                    {editingProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorProducts;

