import React from 'react'

const Avatar = ({ 
  user, 
  size = 'md', 
  className = '',
  showBorder = false 
}) => {
  // Generate initials from user name
  const getInitials = (name) => {
    if (!name) return 'U'
    
    const nameParts = name.trim().split(' ')
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase()
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
  }

  // Generate consistent color based on name
  const getAvatarColor = (name) => {
    if (!name) return 'bg-gray-500'
    
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ]
    
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  // Size classes
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm', 
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  }

  const userName = user?.name || user?.displayName || 'User'
  const userPhoto = user?.photoURL || user?.profilePhoto || user?.avatar
  const initials = getInitials(userName)
  const avatarColor = getAvatarColor(userName)
  
  const borderClass = showBorder ? 'ring-2 ring-white ring-offset-2' : ''

  // Check if the photo is a database URL (starts with /api/profile-photo/)
  const isDatabaseUrl = userPhoto && userPhoto.startsWith('/api/profile-photo/')
  const photoUrl = isDatabaseUrl ? `http://localhost:5001${userPhoto}` : userPhoto

  if (userPhoto) {
    return (
      <div className={`relative inline-block ${className}`}>
        <img
          src={photoUrl}
          alt={userName}
          className={`${sizeClasses[size]} rounded-full object-cover ${borderClass} block`}
          onError={(e) => {
            // Hide the image and show fallback
            e.target.style.display = 'none'
            const fallback = e.target.parentElement.querySelector('.avatar-fallback')
            if (fallback) {
              fallback.style.display = 'flex'
            }
          }}
        />
        {/* Fallback avatar (hidden by default) */}
        <div 
          className={`avatar-fallback ${sizeClasses[size]} rounded-full ${avatarColor} ${borderClass} flex items-center justify-center text-white font-semibold`}
          style={{ display: 'none' }}
        >
          {initials}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${avatarColor} ${borderClass} ${className} flex items-center justify-center text-white font-semibold inline-block`}
    >
      {initials}
    </div>
  )
}

export default Avatar

