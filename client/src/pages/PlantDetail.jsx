import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCamera, FaWater, FaSun, FaCut, FaCalendar, FaLeaf } from 'react-icons/fa';

const PlantDetail = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { plantId } = useParams();
  const [plantData, setPlantData] = useState(null);
  const [plantImages, setPlantImages] = useState({});
  const [growthNotes, setGrowthNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [careReminders, setCareReminders] = useState([]);

  const plantName = decodeURIComponent(plantId);

  // Load plant data and images
  useEffect(() => {
    const loadPlantData = () => {
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

    const loadGrowthNotes = () => {
      const key = `growth_notes_${user?.id || user?.uid || user?.email || 'guest'}`;
      const savedNotes = localStorage.getItem(key);
      if (savedNotes) {
        try {
          const notes = JSON.parse(savedNotes);
          setGrowthNotes(notes[plantName] || []);
        } catch (error) {
          console.error('Error loading growth notes:', error);
        }
      } else {
        // Add some sample growth notes for demonstration
        const sampleNotes = [
          {
            id: 1,
            content: "Just planted my little seedling! The soil feels perfect and it's getting good morning sunlight.",
            date: "2024-01-15",
            timestamp: new Date('2024-01-15')
          },
          {
            id: 2,
            content: "First sprouts are showing! So excited to see tiny green leaves emerging.",
            date: "2024-01-22",
            timestamp: new Date('2024-01-22')
          },
          {
            id: 3,
            content: "Growing steadily. Added some organic fertilizer today. The leaves are getting bigger!",
            date: "2024-01-28",
            timestamp: new Date('2024-01-28')
          }
        ];
        setGrowthNotes(sampleNotes);
      }
    };

    const loadCareReminders = () => {
      const key = `care_reminders_${user?.id || user?.uid || user?.email || 'guest'}`;
      const savedReminders = localStorage.getItem(key);
      if (savedReminders) {
        try {
          const reminders = JSON.parse(savedReminders);
          setCareReminders(reminders[plantName] || [
            {
              id: 1,
              type: 'Water',
              frequency: 'Every 2-3 days',
              nextDue: 'Today',
              icon: FaWater,
              color: 'blue'
            },
            {
              id: 2,
              type: 'Check sunlight',
              frequency: 'Weekly',
              nextDue: 'Tomorrow',
              icon: FaSun,
              color: 'yellow'
            },
            {
              id: 3,
              type: 'Prune dead leaves',
              frequency: 'As needed',
              nextDue: 'Next week',
              icon: FaCut,
              color: 'green'
            }
          ]);
        } catch (error) {
          console.error('Error loading care reminders:', error);
        }
      } else {
        // Default care reminders
        setCareReminders([
          {
            id: 1,
            type: 'Water',
            frequency: 'Every 2-3 days',
            nextDue: 'Today',
            icon: FaWater,
            color: 'blue'
          },
          {
            id: 2,
            type: 'Check sunlight',
            frequency: 'Weekly',
            nextDue: 'Tomorrow',
            icon: FaSun,
            color: 'yellow'
          },
          {
            id: 3,
            type: 'Prune dead leaves',
            frequency: 'As needed',
            nextDue: 'Next week',
            icon: FaCut,
            color: 'green'
          }
        ]);
      }
    };

    loadPlantData();
    loadGrowthNotes();
    loadCareReminders();
  }, [plantName, user]);

  // Set plant data
  useEffect(() => {
    const sampleImages = {
      'Sweet Basil': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&h=300&fit=crop',
      'Cherry Tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop',
      'Fresh Mint': 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=300&fit=crop',
      'Lettuce': 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=300&fit=crop',
      'Bell Pepper': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=300&fit=crop',
      'Strawberry': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=300&fit=crop'
    };

    setPlantData({
      name: plantName,
      description: getPlantDescription(plantName),
      status: getPlantStatus(plantName),
      category: getPlantCategory(plantName),
      addedDate: getAddedDate(plantName),
      image: plantImages[plantName] || sampleImages[plantName] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjOTBFRTkwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+UGxhbnQgSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo='
    });
  }, [plantName, plantImages]);

  const getPlantDescription = (name) => {
    const descriptions = {
      'Sweet Basil': 'Aromatic herb perfect for cooking. Great for beginners!',
      'Cherry Tomato': 'Small, sweet tomatoes that are easy to grow indoors.',
      'Fresh Mint': 'Fast-growing herb perfect for teas and cooking.',
      'Lettuce': 'Crisp, fresh greens perfect for salads.',
      'Bell Pepper': 'Colorful peppers that add flavor to any dish.',
      'Strawberry': 'Sweet, juicy berries perfect for desserts.'
    };
    return descriptions[name] || 'A wonderful addition to your garden!';
  };

  const getPlantStatus = (name) => {
    const statuses = ['Growing', 'Planted', 'Harvested'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getPlantCategory = (name) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('basil') || nameLower.includes('mint') || nameLower.includes('oregano')) {
      return 'Herbs';
    } else if (nameLower.includes('tomato') || nameLower.includes('strawberry') || nameLower.includes('berry')) {
      return 'Fruits';
    } else if (nameLower.includes('lettuce') || nameLower.includes('spinach') || nameLower.includes('pepper')) {
      return 'Vegetables';
    }
    return 'Herbs';
  };

  const getAddedDate = (name) => {
    const dates = ['Jan 15, 2024', 'Jan 10, 2024', 'Jan 8, 2024', 'Jan 12, 2024', 'Jan 5, 2024', 'Jan 3, 2024'];
    return dates[Math.floor(Math.random() * dates.length)];
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      const note = {
        id: Date.now(),
        content: newNote,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date()
      };

      const updatedNotes = [...growthNotes, note].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setGrowthNotes(updatedNotes);

      // Save to localStorage
      const key = `growth_notes_${user?.id || user?.uid || user?.email || 'guest'}`;
      const savedNotes = JSON.parse(localStorage.getItem(key) || '{}');
      savedNotes[plantName] = updatedNotes;
      localStorage.setItem(key, JSON.stringify(savedNotes));

      setNewNote('');
    }
  };

  const handleUploadImage = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageDataUrl = e.target.result;
          
          // Save the image to localStorage
          const key = `plant_images_${user?.id || user?.uid || user?.email || 'guest'}`;
          const existingImages = JSON.parse(localStorage.getItem(key) || '{}');
          existingImages[plantName] = imageDataUrl;
          localStorage.setItem(key, JSON.stringify(existingImages));
          
          // Update the plant data
          setPlantData(prev => ({ ...prev, image: imageDataUrl }));
          
          alert('Image uploaded successfully!');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleReminderAction = (reminderId) => {
    // Update the reminder status
    const updatedReminders = careReminders.map(reminder => {
      if (reminder.id === reminderId) {
        // Cycle through different statuses
        const statuses = ['Today', 'Tomorrow', 'Next week', 'Completed'];
        const currentIndex = statuses.indexOf(reminder.nextDue);
        const nextIndex = (currentIndex + 1) % statuses.length;
        
        return {
          ...reminder,
          nextDue: statuses[nextIndex]
        };
      }
      return reminder;
    });
    
    setCareReminders(updatedReminders);
    
    // Save to localStorage
    const key = `care_reminders_${user?.id || user?.uid || user?.email || 'guest'}`;
    const savedReminders = JSON.parse(localStorage.getItem(key) || '{}');
    savedReminders[plantName] = updatedReminders;
    localStorage.setItem(key, JSON.stringify(savedReminders));
    
    const reminder = updatedReminders.find(r => r.id === reminderId);
    alert(`Updated ${reminder.type} reminder to: ${reminder.nextDue}`);
  };

  if (!plantData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/my-garden-journal')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{plantData.name}</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Plant Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <p className="text-gray-600 mb-4">{plantData.description}</p>
                <div className="flex items-center space-x-4">
                  <img
                    src={plantData.image}
                    alt={plantData.name}
                    className="w-32 h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjOTBFRTkwIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiNGRkZGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+UGxhbnQgSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        {plantData.status}
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {plantData.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">Added on {plantData.addedDate}</p>
                    <button
                      onClick={handleUploadImage}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <FaCamera className="mr-2" />
                      Upload Image
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaCalendar className="mr-2 text-green-600" />
                Growth Timeline
              </h3>
              <div className="space-y-4">
                {growthNotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaLeaf className="text-4xl text-gray-300 mx-auto mb-2" />
                    <p>No growth notes yet</p>
                    <p className="text-sm">Start documenting your plant's journey!</p>
                  </div>
                ) : (
                  growthNotes.map((note) => (
                    <div key={note.id} className="flex items-start">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-sm font-medium text-gray-900">{note.date}</span>
                        </div>
                        <p className="text-gray-700">{note.content}</p>
                        {note.image && (
                          <img
                            src={note.image}
                            alt="Growth note"
                            className="mt-2 w-24 h-24 object-cover rounded-lg"
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Add Growth Note */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Growth Note</h3>
              <div className="space-y-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Today I saw my first tomato sprout!"
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Note
                </button>
              </div>
            </div>

            {/* Care Reminders */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Care Reminders</h3>
              <div className="space-y-4">
                {careReminders.map((reminder) => {
                  const IconComponent = reminder.icon;
                  return (
                    <div key={reminder.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                          reminder.color === 'blue' ? 'bg-blue-100' :
                          reminder.color === 'yellow' ? 'bg-yellow-100' :
                          'bg-green-100'
                        }`}>
                          <IconComponent className={`text-lg ${
                            reminder.color === 'blue' ? 'text-blue-600' :
                            reminder.color === 'yellow' ? 'text-yellow-600' :
                            'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{reminder.type}</p>
                          <p className="text-sm text-gray-600">{reminder.frequency}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleReminderAction(reminder.id)}
                        className={`px-3 py-1 rounded-lg transition-colors text-sm ${
                          reminder.nextDue === 'Today' 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : reminder.nextDue === 'Tomorrow'
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : reminder.nextDue === 'Next week'
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {reminder.nextDue}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default PlantDetail;
