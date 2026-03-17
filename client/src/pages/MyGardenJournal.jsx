import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaCalendar, FaFilter, FaChevronDown, FaTrash } from 'react-icons/fa';

const MyGardenJournal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [garden, setGarden] = useState([]);
  const [filteredGarden, setFilteredGarden] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState({});
  const [plantImages, setPlantImages] = useState({});

  const filters = ['All', 'Herbs', 'Fruits', 'Vegetables'];
  const statusOptions = [
    'All',
    'Planted',
    'Growing',
    'First Harvest',
    'Multiple Harvests',
    'Completed',
    'Failed'
  ];

  // Load garden from database
  useEffect(() => {
    const loadGarden = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:5001/api/garden', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('urbansprout_token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setGarden(data.garden);
            setFilteredGarden(data.garden);
          }
        } else {
          // Fallback to localStorage
          const key = `my_garden_${user?.id || user?.uid || user?.email || 'guest'}`;
          const savedGarden = localStorage.getItem(key);
          if (savedGarden) {
            const gardenData = JSON.parse(savedGarden);
            setGarden(gardenData);
            setFilteredGarden(gardenData);
          }
        }
      } catch (error) {
        console.error('Error loading garden:', error);
        // Fallback to localStorage
        const key = `my_garden_${user?.id || user?.uid || user?.email || 'guest'}`;
        const savedGarden = localStorage.getItem(key);
        if (savedGarden) {
          const gardenData = JSON.parse(savedGarden);
          setGarden(gardenData);
          setFilteredGarden(gardenData);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadGarden();
  }, [user]);

  // Load plant images from localStorage
  useEffect(() => {
    const loadPlantImages = () => {
      const key = `plant_images_${user?.id || user?.uid || user?.email || 'guest'}`;
      const savedImages = localStorage.getItem(key);
      if (savedImages) {
        try {
          const images = JSON.parse(savedImages);
          setPlantImages(images);
        } catch (error) {
          console.error('Error loading plant images:', error);
        }
      }
    };

    loadPlantImages();
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.status-dropdown')) {
        setShowStatusDropdown({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter plants based on selected filters
  useEffect(() => {
    let filtered = garden;

    // Filter by category
    if (activeFilter !== 'All') {
      filtered = filtered.filter(plant => {
        if (typeof plant === 'string') {
          // Handle localStorage fallback
          const name = plant.toLowerCase();
          switch (activeFilter) {
            case 'Herbs':
              return name.includes('basil') || name.includes('mint') || name.includes('oregano') || 
                     name.includes('thyme') || name.includes('rosemary') || name.includes('sage') ||
                     name.includes('cilantro') || name.includes('parsley') || name.includes('dill');
            case 'Fruits':
              return name.includes('tomato') || name.includes('strawberry') || name.includes('berry') ||
                     name.includes('apple') || name.includes('citrus') || name.includes('lemon') ||
                     name.includes('lime') || name.includes('orange');
            case 'Vegetables':
              return name.includes('lettuce') || name.includes('spinach') || name.includes('carrot') ||
                     name.includes('pepper') || name.includes('cucumber') || name.includes('onion') ||
                     name.includes('garlic') || name.includes('broccoli') || name.includes('cabbage');
            default:
              return true;
          }
        } else {
          // Handle database objects
          return plant.plant.category === activeFilter;
        }
      });
    }

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(plant => {
        const currentStatus = getPlantStatus(plant);
        return currentStatus === statusFilter;
      });
    }

    setFilteredGarden(filtered);
  }, [activeFilter, statusFilter, garden]);

  const handlePlantClick = (plant) => {
    // No longer navigate to plant detail pages
    // Plants are now managed directly on this page
  };

  const handleStatusChange = async (plant, newStatus) => {
    try {
      console.log('Status change initiated:', { plant, newStatus });
      
      if (typeof plant === 'string') {
        // Handle localStorage fallback - update local status
        const key = `plant_status_${user?.id || user?.uid || user?.email || 'guest'}`;
        const existingStatuses = JSON.parse(localStorage.getItem(key) || '{}');
        existingStatuses[plant] = newStatus;
        localStorage.setItem(key, JSON.stringify(existingStatuses));
        
        // Update local state
        setGarden(prev => prev.map(p => 
          typeof p === 'string' && p === plant ? p : p
        ));
        
        console.log('Updated localStorage status for:', plant, 'to:', newStatus);
        alert(`Plant status updated to ${newStatus} successfully!`);
      } else {
        // Check if user is authenticated
        if (!user) {
          alert('Please log in to update plant status');
          return;
        }
        
        // Handle database object - map frontend status to database status
        const statusToDbMap = {
          'Planted': 'planted',
          'Growing': 'growing',
          'First Harvest': 'first_harvest',
          'Multiple Harvests': 'multiple_harvests',
          'Completed': 'completed',
          'Failed': 'failed'
        };
        
        const dbStatus = statusToDbMap[newStatus] || 'planted';
        console.log('Mapping status:', newStatus, 'to database status:', dbStatus);
        
        const token = localStorage.getItem('urbansprout_token');
        console.log('Auth token exists:', !!token);
        console.log('User authenticated:', !!user);
        
        if (!token) {
          alert('Authentication token not found. Please log in again.');
          return;
        }
        
        const response = await fetch(`http://localhost:5001/api/garden/${plant._id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: dbStatus
          })
        });

        console.log('API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API response data:', data);
          
          if (data.success) {
            // Update local state with the database status
            setGarden(prev => prev.map(p => 
              p._id === plant._id ? { ...p, status: dbStatus } : p
            ));
            console.log('Successfully updated plant status in local state');
            
            // Show success message
            alert(`Plant status updated to ${newStatus} successfully!`);
          } else {
            console.error('API returned success: false', data);
            alert(`Failed to update status: ${data.message || 'Unknown error'}`);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('API request failed:', response.status, errorData);
          
          if (response.status === 401) {
            alert('Authentication failed. Please log in again.');
            // Clear invalid token
            localStorage.removeItem('urbansprout_token');
            localStorage.removeItem('urbansprout_user');
          } else {
            alert(`Failed to update status: ${errorData.message || `HTTP ${response.status}`}`);
          }
        }
      }
      
      // Close dropdown
      setShowStatusDropdown(prev => ({ ...prev, [plant._id || plant]: false }));
    } catch (error) {
      console.error('Error updating plant status:', error);
      alert(`Error updating plant status: ${error.message || 'Unknown error occurred'}`);
    }
  };

  const toggleStatusDropdown = (plant) => {
    const plantId = typeof plant === 'string' ? plant : plant._id;
    setShowStatusDropdown(prev => ({ ...prev, [plantId]: !prev[plantId] }));
  };

  const getPlantImage = (plant) => {
    if (typeof plant === 'string') {
      // Handle localStorage fallback
      const mapped = plantImages && typeof plantImages === 'object' ? plantImages[plant] : undefined;
      if (mapped) return mapped;
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjOTBFRTkwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+UGxhbnQgSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
    } else {
      // Handle database object - image is stored in plant.plant.image
      const imageUrl = plant.plant?.image || plant.plant?.imageUrl;
      return imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjOTBFRTkwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+UGxhbnQgSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
    }
  };

  const getPlantName = (plant) => {
    return typeof plant === 'string' ? plant : plant.plant.name;
  };

  const getPlantDescription = (plant) => {
    if (typeof plant === 'string') {
      const descriptions = {
        'Sweet Basil': 'Aromatic herb perfect for cooking. Great for beginners!',
        'Cherry Tomato': 'Small, sweet tomatoes that are easy to grow indoors.',
        'Fresh Mint': 'Fast-growing herb perfect for teas and cooking.',
        'Lettuce': 'Crisp, fresh greens perfect for salads.',
        'Bell Pepper': 'Colorful peppers that add flavor to any dish.',
        'Strawberry': 'Sweet, juicy berries perfect for desserts.'
      };
      return descriptions[plant] || 'A wonderful addition to your garden!';
    } else {
      return plant.plant.description;
    }
  };

  const getPlantCategory = (plant) => {
    return typeof plant === 'string' ? 'Herbs' : plant.plant.category;
  };

  const getAddedDate = (plant) => {
    if (typeof plant === 'string') {
      const dates = ['Jan 15, 2024', 'Jan 10, 2024', 'Jan 8, 2024', 'Jan 12, 2024', 'Jan 5, 2024', 'Jan 3, 2024'];
      return dates[Math.floor(Math.random() * dates.length)];
    } else {
      return new Date(plant.addedDate).toLocaleDateString();
    }
  };

  const getPlantStatus = (plant) => {
    if (typeof plant === 'string') {
      // Handle localStorage fallback
      const key = `plant_status_${user?.id || user?.uid || user?.email || 'guest'}`;
      const existingStatuses = JSON.parse(localStorage.getItem(key) || '{}');
      return existingStatuses[plant] || 'Planted';
    } else {
      // Handle database object - map database status to frontend display status
      const statusMap = {
        'planted': 'Planted',
        'growing': 'Growing',
        'first_harvest': 'First Harvest',
        'multiple_harvests': 'Multiple Harvests',
        'completed': 'Completed',
        'failed': 'Failed'
      };
      const dbStatus = plant.status || 'planted';
      return statusMap[dbStatus] || 'Planted';
    }
  };

  const handleRemovePlant = async (plant, e) => {
    try {
      if (e) e.stopPropagation();

      const confirmDelete = window.confirm('Remove this plant from your garden?');
      if (!confirmDelete) return;

      // LocalStorage fallback: string entries
      if (typeof plant === 'string') {
        const userKey = user?.id || user?.uid || user?.email || 'guest';
        const gardenKey = `my_garden_${userKey}`;

        const savedGarden = JSON.parse(localStorage.getItem(gardenKey) || '[]');
        const updatedGarden = savedGarden.filter((p) => p !== plant);
        localStorage.setItem(gardenKey, JSON.stringify(updatedGarden));

        setGarden((prev) => prev.filter((p) => p !== plant));
        setFilteredGarden((prev) => prev.filter((p) => p !== plant));
        return;
      }

      // Database object: call API
      const response = await fetch(`http://localhost:5001/api/garden/${plant._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('urbansprout_token')}`
        }
      });

      if (response.ok) {
        setGarden((prev) => prev.filter((p) => p._id !== plant._id));
        setFilteredGarden((prev) => prev.filter((p) => p._id !== plant._id));
      } else {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to remove plant');
      }
    } catch (error) {
      console.error('Error removing plant from garden:', error);
      alert(error.message || 'Unable to remove plant. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-forest-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-green-100 rounded-full opacity-10 animate-pulse delay-500"></div>
      </div>
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div className="flex items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Garden</h1>
                  <p className="text-gray-600">Track your plants, progress, and memories</p>
                </div>
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-forest-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green-500 bg-white/80 backdrop-blur-sm"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Filter Options */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-forest-green-700 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Plant Grid */}
        {filteredGarden.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl text-gray-300 mx-auto mb-4">🌱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No plants found</h3>
            <p className="text-gray-600 mb-6">
              {activeFilter === 'All' 
                ? "Start by adding plants to your garden from the Plant Suggestion assistant!"
                : `No ${activeFilter.toLowerCase()} found in your garden.`
              }
            </p>
            <button
              onClick={() => navigate('/plant-suggestion')}
              className="bg-forest-green-700 text-white px-6 py-3 rounded-lg hover:bg-forest-green-800 transition-colors"
            >
              Find Plants
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGarden.map((plant) => (
              <div
                key={typeof plant === 'string' ? plant : plant._id}
                onClick={() => handlePlantClick(plant)}
                className="group bg-white/80 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border border-white/20"
              >
                {/* Plant Image */}
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={getPlantImage(plant)}
                    alt={getPlantName(plant)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjOTBFRTkwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+UGxhbnQgSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
                    }}
                  />
                  {/* Remove Button */}
                  <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleRemovePlant(plant, e)}
                      className="p-2 rounded-full bg-white/90 text-red-600 hover:bg-white shadow"
                      title="Remove plant"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  {/* Status Dropdown */}
                  <div className="absolute top-3 right-3">
                    <div className="relative status-dropdown">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatusDropdown(plant);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          getPlantStatus(plant) === 'Growing' 
                            ? 'bg-forest-green-100 text-forest-green-700'
                            : getPlantStatus(plant) === 'Planted'
                            ? 'bg-blue-100 text-blue-700'
                            : getPlantStatus(plant) === 'First Harvest'
                            ? 'bg-yellow-100 text-yellow-700'
                            : getPlantStatus(plant) === 'Multiple Harvests'
                            ? 'bg-orange-100 text-orange-700'
                            : getPlantStatus(plant) === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : getPlantStatus(plant) === 'Failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {getPlantStatus(plant)}
                        <FaChevronDown className="inline ml-1 text-xs" />
                      </button>
                      
                      {/* Status Dropdown Menu */}
                      {showStatusDropdown[typeof plant === 'string' ? plant : plant._id] && (
                        <div className="absolute right-0 mt-1 w-40 bg-white/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-lg z-20">
                          {statusOptions.slice(1).map((status) => (
                            <button
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(plant, status);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                                getPlantStatus(plant) === status ? 'bg-forest-green-50 text-forest-green-700' : 'text-gray-700'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plant Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{getPlantName(plant)}</h3>
                  <p className="text-gray-600 text-sm mb-3">{getPlantDescription(plant)}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <FaCalendar className="mr-1" />
                    <span>Added {getAddedDate(plant)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>


      {/* Floating Action Button */}
      <button 
        onClick={() => navigate('/plant-suggestion')}
        className="fixed bottom-6 right-6 bg-forest-green-700 text-white w-14 h-14 rounded-full shadow-lg hover:bg-forest-green-800 transition-colors flex items-center justify-center"
      >
        <FaPlus className="text-xl" />
      </button>

    </div>
  );
};

export default MyGardenJournal;
