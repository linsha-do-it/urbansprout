import React, { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { FaCamera, FaUser, FaEnvelope, FaSave, FaTrash } from 'react-icons/fa'
import Avatar from '../components/Avatar'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [profileData, setProfileData] = useState({
    name: user?.name || user?.displayName || '',
    email: user?.email || '',
    profilePhoto: user?.photoURL || user?.profilePhoto || null
  })

  // Update profileData when user changes (to reflect real-time updates)
  React.useEffect(() => {
    setProfileData({
      name: user?.name || user?.displayName || '',
      email: user?.email || '',
      profilePhoto: user?.photoURL || user?.profilePhoto || null
    })
  }, [user])
  
  const fileInputRef = useRef(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
    setMessage('')
  }

  const handlePhotoSelect = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please select a valid image file')
        return
      }

      // Validate file size (max 2MB to avoid localStorage issues)
      if (file.size > 2 * 1024 * 1024) {
        setMessage('Image size should be less than 2MB')
        return
      }

      // Convert to base64 with compression
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Calculate new dimensions (max 200x200 to reduce size)
          const maxSize = 200
          let { width, height } = img
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height
              height = maxSize
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          // Draw compressed image
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to base64 with quality compression
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7)
          
          setProfileData(prev => ({
            ...prev,
            profilePhoto: compressedBase64
          }))
          setMessage('')
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setProfileData(prev => ({
      ...prev,
      profilePhoto: null
    }))
    setMessage('Profile photo removed')
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      // Validate required fields
      if (!profileData.name.trim()) {
        setMessage('Name is required')
        setLoading(false)
        return
      }

      const { apiCall } = await import('../utils/api');
      
      // First, upload profile photo if there's a new one
      let photoUrl = user?.avatar; // Keep existing photo URL
      
      if (profileData.profilePhoto && profileData.profilePhoto !== user?.profilePhoto) {
        try {
          // Extract image data and metadata
          const base64Data = profileData.profilePhoto.split(',')[1];
          const imageType = profileData.profilePhoto.split(',')[0].split(':')[1].split(';')[0];
          const imageSize = Math.round((base64Data.length * 3) / 4); // Approximate size
          
          const photoResponse = await apiCall('/profile-photo', {
            method: 'POST',
            body: JSON.stringify({
              imageData: base64Data,
              imageType: imageType,
              imageSize: imageSize,
              dimensions: {
                width: 200, // We compress to 200x200
                height: 200
              }
            })
          });
          
          if (photoResponse.success) {
            photoUrl = photoResponse.data.photoUrl;
          }
        } catch (photoError) {
          console.error('Photo upload error:', photoError);
          setMessage('Profile updated but photo upload failed. Please try uploading the photo again.')
        }
      }
      
      // Update profile with name and photo URL
      const result = await apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileData.name.trim(),
          avatar: photoUrl
        })
      })
      
      if (result.success) {
        // Update profile using AuthContext with the server response
        const updatedData = {
          name: result.data.user.name,
          displayName: result.data.user.name,
          avatar: result.data.user.avatar,
          profilePhoto: result.data.user.avatar
        }
        
        // Update user in AuthContext (this will automatically update localStorage)
        updateProfile(updatedData)
        
        setMessage('Profile updated successfully!')
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setMessage('')
        }, 3000)
      } else {
        throw new Error(result.message || 'Failed to update profile')
      }
      
    } catch (error) {
      console.error('Profile update error:', error)
      setMessage(`Failed to update profile: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Photo Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h2>
              
              <div className="flex flex-col items-center space-y-4">
                {/* Avatar Display */}
                <div className="relative">
                  <Avatar 
                    user={{
                      ...user,
                      profilePhoto: profileData.profilePhoto,
                      name: profileData.name
                    }} 
                    size="2xl" 
                    showBorder={true}
                  />
                  
                  {/* Camera Icon Overlay */}
                  <button
                    onClick={handlePhotoSelect}
                    className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 shadow-lg transition-colors"
                  >
                    <FaCamera className="w-3 h-3" />
                  </button>
                </div>

                {/* Photo Actions */}
                <div className="flex flex-col space-y-2 w-full">
                  <button
                    onClick={handlePhotoSelect}
                    className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FaCamera className="mr-2" />
                    Choose Photo
                  </button>
                  
                  {profileData.profilePhoto && (
                    <button
                      onClick={handleRemovePhoto}
                      className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <FaTrash className="mr-2" />
                      Remove Photo
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Recommended: Square image, max 2MB (automatically compressed)
                </p>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Profile Information Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>
              
              <div className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaUser className="inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaEnvelope className="inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    placeholder="Enter your email"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed for security reasons
                  </p>
                </div>

                {/* Role Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Role
                  </label>
                  <div className="flex items-center">
                    <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user?.role === 'expert' ? 'bg-purple-100 text-purple-800' :
                      user?.role === 'vendor' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user?.role === 'admin' ? '👑 Admin' :
                       user?.role === 'expert' ? '🌟 Expert' :
                       user?.role === 'vendor' ? '🏪 Vendor' :
                       '🌱 Beginner'}
                    </span>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>

                {/* Message Display */}
                {message && (
                  <div className={`p-4 rounded-lg ${
                    message.includes('success') 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {JSON.parse(localStorage.getItem(`my_garden_${user?.id || user?.uid || user?.email || 'guest'}`) || '[]').length}
              </div>
              <div className="text-sm text-gray-600">Plants in Garden</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {user?.role === 'beginner' ? 'Beginner' : 
                 user?.role === 'expert' ? 'Expert' : 
                 user?.role === 'vendor' ? 'Vendor' : 'Admin'}
              </div>
              <div className="text-sm text-gray-600">Account Type</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {new Date(user?.metadata?.creationTime || Date.now()).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600">Member Since</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Profile
