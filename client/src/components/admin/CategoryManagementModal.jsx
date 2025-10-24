import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  AlertTriangle,
  Tag
} from 'lucide-react';
import { apiCall } from '../../utils/api';

const CategoryManagementModal = ({ categories, onClose, onUpdate }) => {
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [message, setMessage] = useState('');

  const predefinedCategories = [
    'Tools', 'Fertilizers', 'Pots', 'Watering Cans', 'Soil & Compost', 
    'Plant Care', 'Garden Accessories', 'Indoor Growing', 'Outdoor Growing',
    'Seeds', 'Planters', 'Garden Tools', 'Plant Food', 'Pest Control'
  ];

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      setMessage('Category name is required');
      return;
    }

    try {
      // Check if category already exists in the database
      const existingCategories = await apiCall('/admin/products/categories');
      if (existingCategories.success) {
        const categoryExists = existingCategories.data.categories.some(
          cat => cat._id.toLowerCase() === newCategory.trim().toLowerCase()
        );
        if (categoryExists) {
          setMessage('This category already exists');
          return;
        }
      }

      // Create the category
      const response = await apiCall('/admin/products/categories', {
        method: 'POST',
        body: JSON.stringify({ categoryName: newCategory.trim() })
      });

      if (response.success) {
        setMessage(response.message);
        setNewCategory('');
        // Immediately refresh the categories list
        onUpdate();
        // Clear message after a delay
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        setMessage(response.message || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      setMessage('Error adding category: ' + error.message);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setEditName(category._id);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setMessage('Category name is required');
      return;
    }

    if (editName.trim() === editingCategory._id) {
      setMessage('No changes made');
      setEditingCategory(null);
      setEditName('');
      return;
    }

    try {
      const response = await apiCall(`/admin/products/categories/${encodeURIComponent(editingCategory._id)}`, {
        method: 'PUT',
        body: JSON.stringify({ newCategoryName: editName.trim() })
      });

      if (response.success) {
        setMessage(response.message);
        setEditingCategory(null);
        setEditName('');
        // Immediately refresh the categories list
        onUpdate();
        // Clear message after a delay
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        setMessage(response.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      setMessage('Error updating category: ' + error.message);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (category.count > 0) {
      setMessage(`Cannot delete category "${category._id}" - it has ${category.count} products. Please move or delete the products first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the category "${category._id}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiCall(`/admin/products/categories/${encodeURIComponent(category._id)}`, {
        method: 'DELETE'
      });

      if (response.success) {
        setMessage(`✅ ${response.message}`);
        // Immediately refresh the categories list
        onUpdate();
        // Clear message after a delay
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } else {
        setMessage(`❌ ${response.message || 'Failed to delete category'}`);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setMessage(`❌ Error deleting category: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Tag className="h-6 w-6 mr-2" />
              Manage Categories
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes('✅') 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : message.includes('❌') 
                ? 'bg-red-100 text-red-700 border border-red-200'
                : message.includes('successfully') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Add New Category */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Add New Category</h3>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter category name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </button>
            </div>
          </div>

          {/* Existing Categories */}
          {categories.length > 0 ? (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Existing Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    {editingCategory && editingCategory._id === category._id ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-green-600 hover:text-green-500"
                          title="Save changes"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(null);
                            setEditName('');
                          }}
                          className="p-1 text-gray-600 hover:text-gray-500"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{category._id}</span>
                          <span className="ml-2 text-xs text-gray-500">({category.count} products)</span>
                          {category.count > 0 && (
                            <AlertTriangle className="h-4 w-4 text-orange-500 ml-2" title="Has products" />
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-1 text-blue-600 hover:text-blue-500"
                            title="Edit category"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className={`p-1 ${
                              category.count === 0 
                                ? 'text-red-600 hover:text-red-500' 
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            title={
                              category.count === 0 
                                ? 'Delete category' 
                                : `Cannot delete category - it has ${category.count} products`
                            }
                            disabled={category.count > 0}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No categories found. Add your first category above.</p>
            </div>
          )}

          {/* Warning */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Important Notes:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Categories with products cannot be deleted (delete button will be disabled)</li>
                  <li>To delete a category, first move or delete all products in that category</li>
                  <li>Category names are case-sensitive</li>
                  <li>Deleting a category is permanent and cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-6 border-t mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementModal;
