import React, { useState, useRef, useEffect, useCallback } from 'react' 
import { useAuth } from '../contexts/AuthContext'
import { apiCall } from '../utils/api'
import { 
  FaSearch, FaHeart, FaComment, FaShare, FaBookmark, FaPlus, 
  FaFire, FaTrophy, FaQuestionCircle, FaStar, FaUsers, FaFileAlt,
  FaFilter, FaSortDown, FaTimes, FaCamera, FaHashtag, FaPaperPlane
} from 'react-icons/fa'
import Avatar from '../components/Avatar'
import CommunityGuidelines from '../components/CommunityGuidelines'

// PostCard component moved outside to prevent re-creation on every render
const PostCard = ({ 
  post, 
  user, 
  showComments, 
  newComment, 
  setNewComment, 
  toggleComments, 
  handleAddCommentToPost, 
  handleLikePost, 
  handleSharePost, 
  handleBookmarkPost, 
  handleDeletePost, 
  setEditingPost 
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [showReadMore, setShowReadMore] = React.useState(false)
  const contentRef = React.useRef(null)

  React.useEffect(() => {
    if (contentRef.current) {
      const lineHeight = parseInt(window.getComputedStyle(contentRef.current).lineHeight)
      const maxHeight = lineHeight * 3 // Show 3 lines
      setShowReadMore(contentRef.current.scrollHeight > maxHeight)
    }
  }, [post.content])

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 hover:shadow-md transition-shadow group">
    {/* Post Header */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <Avatar user={post.user} size="md" />
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900">{post.user.name}</span>
            <span className="text-gray-500 text-sm">{post.user.username}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500 text-sm">{post.timeAgo}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          post.tag === 'Question' ? 'bg-blue-100 text-blue-700' : 
          post.tag === 'Success Story' ? 'bg-forest-green-100 text-forest-green-700' :
          'bg-orange-100 text-orange-700'
        }`}>
          {post.tag}
        </span>
        {/* Edit/Delete Controls - Only show for post owner */}
        {user && post.user.name === (user.name || user.displayName) && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setEditingPost({ ...post, isEditing: true })}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit post"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleDeletePost(post.id)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete post"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Post Content */}
    <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
    <div className="mb-3">
      <p 
        ref={contentRef}
        className={`text-sm text-gray-700 leading-relaxed ${
          !isExpanded && showReadMore ? 'overflow-hidden' : ''
        }`}
        style={{
          display: !isExpanded && showReadMore ? '-webkit-box' : 'block',
          WebkitLineClamp: !isExpanded && showReadMore ? 3 : 'unset',
          WebkitBoxOrient: 'vertical'
        }}
      >
        {post.content}
      </p>
      {showReadMore && (
        <button
          onClick={toggleExpanded}
          className="text-forest-green-600 hover:text-forest-green-800 text-sm font-medium mt-1 transition-colors"
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>

    {/* Post Image */}
    {post.image && (
      <div className="mb-3">
        <img 
          src={post.image} 
          alt="Post content" 
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>
    )}

    {/* Hashtags */}
    <div className="flex flex-wrap gap-1 mb-3">
      {post.hashtags.map((tag, index) => (
        <span 
          key={index}
          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-forest-green-100 hover:text-forest-green-800 cursor-pointer transition-colors"
        >
          {tag}
        </span>
      ))}
    </div>

    {/* Action Bar */}
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <div className="flex items-center space-x-6">
        <button 
          type="button"
          onClick={() => handleLikePost(post.id)}
          disabled={!user}
          className={`flex items-center space-x-2 transition-colors ${
            post.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FaHeart className={post.liked ? 'fill-current' : ''} />
          <span className="text-sm font-medium">{post.likes}</span>
        </button>
        
        <button 
          type="button"
          onClick={() => {
            if (!user) {
              alert('Please log in to view comments.')
              window.location.href = '/login'
              return
            }
            toggleComments(post.id)
          }}
          className={`flex items-center space-x-2 transition-colors ${
            !user ? 'opacity-50 cursor-not-allowed' : 'text-gray-500 hover:text-blue-500'
          }`}
        >
          <FaComment />
          <span className="text-sm font-medium">{post.comments}</span>
        </button>
        
        <button 
          type="button"
          onClick={() => handleSharePost(post)}
          disabled={!user}
          className={`flex items-center space-x-2 transition-colors ${
            !user ? 'opacity-50 cursor-not-allowed' : 'text-gray-500 hover:text-forest-green-600'
          }`}
        >
          <FaShare />
          <span className="text-sm font-medium">{post.shares}</span>
        </button>
        
        <button 
          type="button"
          onClick={() => handleBookmarkPost(post.id)}
          disabled={!user}
          className={`flex items-center space-x-2 transition-colors ${
            post.bookmarked ? 'text-forest-green-600' : 'text-gray-500 hover:text-forest-green-600'
          } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FaBookmark className={post.bookmarked ? 'fill-current' : ''} />
          <span className="text-sm font-medium">{post.bookmarks}</span>
        </button>
      </div>
            </div>

    {/* Comments Section */}
    {showComments[post.id] && (
      <div className="mt-6 pt-4 border-t border-gray-100">
        {user ? (
          <div className="flex space-x-3 mb-4">
            <Avatar user={user} size="sm" />
            <div className="flex-1 flex space-x-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment[post.id] || ''}
                onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-forest-green-600 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCommentToPost(post.id, newComment[post.id])
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleAddCommentToPost(post.id, newComment[post.id])}
                className="px-4 py-2 bg-forest-green-600 text-white rounded-full hover:bg-forest-green-700 transition-colors"
              >
                <FaPaperPlane className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              <FaComment className="inline mr-2" />
              Please <a href="/signup" className="underline font-medium">sign up</a> to comment on posts.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {post.commentsList.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar user={comment.user} size="sm" />
              <div className="flex-1">
                <div className="bg-gray-50 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">{comment.user.name}</span>
                    <span className="text-gray-500 text-xs">{comment.timeAgo}</span>
                  </div>
                  <p className="text-gray-700 text-sm">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
  )
}

const Blog = () => {
  const { user } = useAuth()
  const [activeFilter, setActiveFilter] = useState('All Posts')
  const [sortBy, setSortBy] = useState('Newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showComments, setShowComments] = useState({})
  const [newComment, setNewComment] = useState({})
  const [editingPost, setEditingPost] = useState(null)
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [message, setMessage] = useState('')
  const [searchTimeout, setSearchTimeout] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [postsPerPage] = useState(10)
  const [myPostsCount, setMyPostsCount] = useState(0)
  const [savedPostsCount, setSavedPostsCount] = useState(0)
  const [communityStats, setCommunityStats] = useState({
    totalMembers: 0,
    activeToday: 0
  })
  const [topContributors, setTopContributors] = useState([])
  const [trendingHashtags, setTrendingHashtags] = useState([])
  
  // Initialize with empty array - posts will be loaded from API
  const [posts, setPosts] = useState([])

  // Load posts from backend
  useEffect(() => {
    loadPosts()
  }, [activeFilter, sortBy])

  // Load user-specific counts and community stats
  useEffect(() => {
    if (user) {
      loadUserCounts()
      loadCommunityStats()
    }
    // Always load community stats, top contributors, and trending hashtags for public display
    loadCommunityStats()
    loadTopContributors()
    loadTrendingHashtags()
  }, [user, posts])

  // Quick Tips slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => 
        (prevIndex + 1) % quickTips.length
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Filter posts based on active filter
  const getFilteredPosts = () => {
    if (activeFilter === 'All Posts') {
      return posts
    } else if (activeFilter === 'Questions') {
      return posts.filter(post => post.tag === 'Question')
    } else if (activeFilter === 'Success Stories') {
      return posts.filter(post => post.tag === 'Success Story')
    } else if (activeFilter === 'My Posts') {
      // Filter posts created by the current user (only if user is authenticated)
      if (!user) return posts // Fallback to all posts for non-authenticated users
      return posts.filter(post => post.user.name === (user.name || user.displayName))
    } else if (activeFilter === 'Saved Posts') {
      // Filter posts that the current user has bookmarked (only if user is authenticated)
      if (!user) return posts // Fallback to all posts for non-authenticated users
      return posts.filter(post => post.bookmarked === true)
    }
    return posts
  }

  // Sort posts based on sortBy
  const getSortedPosts = (filteredPosts) => {
    const sorted = [...filteredPosts]
    
    switch (sortBy) {
      case 'Newest':
        return sorted.sort((a, b) => new Date(b.createdAt || b.id) - new Date(a.createdAt || a.id))
      case 'Most Liked':
        return sorted.sort((a, b) => b.likes - a.likes)
      case 'Most Commented':
        return sorted.sort((a, b) => b.comments - a.comments)
      case 'Trending':
        return sorted.sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares))
      default:
        return sorted
    }
  }

  // Search posts
  const handleSearch = async (query) => {
    if (!query.trim()) {
      await loadPosts()
      return
    }
    
    try {
      setLoading(true)
      const response = await apiCall(`/blog/search?q=${encodeURIComponent(query.trim())}`)
      
      if (response.success && response.data) {
        const backendPosts = Array.isArray(response.data) ? response.data : response.data.posts || []
        const transformedPosts = backendPosts.map(post => ({
          id: post._id || post.id,
          user: {
            name: post.authorId?.name || post.author || 'Anonymous',
            username: `@${(post.authorId?.name || post.author || 'user').toLowerCase().replace(' ', '_')}`,
            avatar: post.authorId?.avatar || null
          },
          timeAgo: formatTimeAgo(post.createdAt),
          tag: post.category === 'success_story' ? 'Success Story' : post.category === 'question' ? 'Question' : '',
          title: post.title || 'Untitled Post',
          content: post.content || 'No content available',
          image: post.image,
          hashtags: post.tags?.map(tag => `#${tag}`) || ['#PlantCare'],
          likes: post.likeCount || 0,
          comments: post.commentCount || 0,
          shares: post.shareCount || 0,
          bookmarks: post.bookmarkCount || 0,
          liked: user ? post.likes?.some(like => like.userEmail === user.email) || false : false,
          bookmarked: user ? post.bookmarks?.some(bookmark => bookmark.userEmail === user.email) || false : false,
          commentsList: post.comments || []
        }))
        setPosts(transformedPosts)
      }
    } catch (error) {
      console.error('Error searching posts:', error)
      setMessage('Error searching posts. Please try again.')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  // Share post functionality
  const handleSharePost = async (post) => {
    if (!user) {
      alert('Please log in to share posts.')
      window.location.href = '/login'
      return
    }
    
    const shareUrl = `${window.location.origin}/blog/${post.id}`
    const shareText = `Check out this post: "${post.title}"`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: shareText,
          url: shareUrl
        })
        
        // Update share count
        setPosts(posts.map(p => 
          p.id === post.id 
            ? { ...p, shares: p.shares + 1 }
            : p
        ))
        
        // Send share to backend
        try {
          await apiCall(`/blog/${post.id}/share`, { method: 'POST' })
        } catch (error) {
          console.error('Error updating share count:', error)
        }
      } catch (error) {
        console.error('Error sharing:', error)
        // Fallback to copy to clipboard
        copyToClipboard(shareUrl)
      }
    } else {
      // Fallback to copy to clipboard
      copyToClipboard(shareUrl)
    }
  }
  
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setMessage('Link copied to clipboard!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      setMessage('Unable to copy link. Please try again.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const filteredAndSortedPosts = getSortedPosts(getFilteredPosts())

  const loadPosts = async () => {
    try {
      setLoading(true)
      // For non-authenticated users, only allow public endpoints
      const endpoint = !user 
        ? `/blog?sort=newest&page=${currentPage}&limit=10`
        : activeFilter === 'My Posts'
          ? `/blog/mine?sort=newest&page=${currentPage}&limit=10`
          : activeFilter === 'Saved Posts'
            ? `/blog/saved?sort=newest&page=${currentPage}&limit=10`
            : `/blog?sort=newest&page=${currentPage}&limit=10`

      const response = await apiCall(endpoint)
      
      if (response.success && response.data) {
        const backendPosts = Array.isArray(response.data) ? response.data : response.data.posts || []
        const transformedPosts = backendPosts.map(post => ({
          id: post._id || post.id,
          user: {
            name: post.authorId?.name || post.author || 'Anonymous',
            username: `@${(post.authorId?.name || post.author || 'user').toLowerCase().replace(' ', '_')}`,
            avatar: post.authorId?.avatar || null
          },
          timeAgo: formatTimeAgo(post.createdAt),
          tag: post.category === 'success_story' ? 'Success Story' : post.category === 'question' ? 'Question' : '',
          title: post.title || 'Untitled Post',
          content: post.content || 'No content available',
          image: post.image,
          hashtags: post.tags?.map(tag => `#${tag}`) || ['#PlantCare'],
          likes: post.likeCount || (post.likes?.length || 0),
          comments: post.commentCount || (post.comments?.length || 0),
          shares: post.shareCount || (Array.isArray(post.shares) ? post.shares.length : (post.shares || 0)),
          bookmarks: post.bookmarkCount || (post.bookmarks?.length || 0),
          liked: user ? post.likes?.some(like => like.userEmail === user.email) || false : false,
          bookmarked: user ? post.bookmarks?.some(bookmark => bookmark.userEmail === user.email) || false : false,
          commentsList: (post.comments || []).map(c => ({
            id: c._id || `${post._id || post.id}-${c.createdAt}`,
            user: { name: c.author || 'Anonymous', avatar: null },
            content: c.content,
            timeAgo: formatTimeAgo(c.createdAt)
          }))
        }))
        setPosts(transformedPosts)
        
        // Update pagination info if available
        if (response.data.totalPages) {
          setTotalPages(response.data.totalPages)
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'now'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays}d`
    if (diffHours > 0) return `${diffHours}h`
    return 'now'
  }

  // Load user-specific counts
  const loadUserCounts = async () => {
    if (!user) return
    
    try {
      // Get my posts count
      const myPostsResponse = await apiCall('/blog/mine?count=true')
      if (myPostsResponse.success) {
        setMyPostsCount(myPostsResponse.count || 0)
      }

      // Get saved posts count
      const savedPostsResponse = await apiCall('/blog/saved?count=true')
      if (savedPostsResponse.success) {
        setSavedPostsCount(savedPostsResponse.count || 0)
      }
    } catch (error) {
      console.error('Error loading user counts:', error)
      // Fallback to local calculation
      const myPosts = posts.filter(post => post.user.name === (user.name || user.displayName))
      const savedPosts = posts.filter(post => post.bookmarked === true)
      setMyPostsCount(myPosts.length)
      setSavedPostsCount(savedPosts.length)
    }
  }

  // Load community statistics
  const loadCommunityStats = async () => {
    try {
      const response = await apiCall('/blog/stats')
      if (response.success) {
        setCommunityStats({
          totalMembers: response.data.totalMembers || 0,
          activeToday: response.data.activeToday || 0
        })
      }
    } catch (error) {
      console.error('Error loading community stats:', error)
      // Keep default values if API fails
    }
  }

  // Load trending hashtags
  const loadTrendingHashtags = async () => {
    try {
      const response = await apiCall('/blog/trending-hashtags?limit=5')
      if (response.success && response.data && response.data.hashtags) {
        setTrendingHashtags(response.data.hashtags)
      }
    } catch (error) {
      console.error('Error loading trending hashtags:', error)
      // Keep empty array if API fails
    }
  }

  // Load top contributors
  const loadTopContributors = async () => {
    try {
      const response = await apiCall('/blog/top-contributors?limit=4')
      if (response.success && response.data && response.data.contributors) {
        setTopContributors(response.data.contributors)
      }
    } catch (error) {
      console.error('Error loading top contributors:', error)
      // Keep empty array if API fails
    }
  }

  // Blog community stats - now using dynamic data
  const blogStats = communityStats


  const quickTips = [
    "📚 Read plant care guides before buying new plants",
    "💡 Most houseplants prefer bright, indirect light",
    "📝 Keep a plant journal to track growth and care",
    "🔍 Research before repotting - timing matters"
  ]

  const sidebarItems = user 
    ? [
        { name: 'My Feed', icon: FaUsers, active: true, count: null },
        { name: 'My Posts', icon: FaFileAlt, active: false, count: myPostsCount },
        { name: 'Saved Posts', icon: FaBookmark, active: false, count: savedPostsCount },
        { name: 'Questions', icon: FaQuestionCircle, active: false, count: null },
        { name: 'Success Story', icon: FaStar, active: false, count: null },
        { name: 'Trending', icon: FaFire, active: false, count: null }
      ]
    : [
        { name: 'All Posts', icon: FaUsers, active: true, count: null },
        { name: 'Questions', icon: FaQuestionCircle, active: false, count: null },
        { name: 'Success Story', icon: FaStar, active: false, count: null },
        { name: 'Trending', icon: FaFire, active: false, count: null }
      ]

  const filters = user 
    ? ['All Posts', 'My Posts', 'Saved Posts', 'Questions', 'Success Stories']
    : ['All Posts', 'Questions', 'Success Stories']

  const handleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ))
  }

  const handleBookmark = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, bookmarked: !post.bookmarked, bookmarks: post.bookmarked ? post.bookmarks - 1 : post.bookmarks + 1 }
        : post
    ))
  }

  const handleLikePost = async (postId) => {
    if (!user) {
      alert('Please log in to like posts.')
      window.location.href = '/login'
      return
    }
    
    try {
      const response = await apiCall(`/blog/${postId}/like`, { 
        method: 'POST'
      })
      
      if (response.success) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, liked: response.liked, likes: response.data.likeCount }
            : post
        ))
        // Update counts if needed
        loadUserCounts()
      }
    } catch (error) {
      console.error('Error liking post:', error)
      handleLike(postId)
    }
  }

  const handleBookmarkPost = async (postId) => {
    if (!user) {
      alert('Please log in to bookmark posts.')
      window.location.href = '/login'
      return
    }
    
    try {
      const response = await apiCall(`/blog/${postId}/bookmark`, { 
        method: 'POST'
      })
      
      if (response.success) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, bookmarked: response.bookmarked, bookmarks: response.bookmarkCount }
            : post
        ))
        // Update saved posts count
        loadUserCounts()
      }
    } catch (error) {
      console.error('Error bookmarking post:', error)
      handleBookmark(postId)
    }
  }

  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  const handleAddComment = (postId) => {
    if (!newComment[postId]?.trim()) return
    
    const comment = {
      id: Date.now(),
      user: { name: user?.name || 'You', avatar: user?.profilePhoto },
      content: newComment[postId],
      timeAgo: 'now',
      replies: []
    }

    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            commentsList: [...post.commentsList, comment],
            comments: post.comments + 1
          }
        : post
    ))

    setNewComment(prev => ({ ...prev, [postId]: '' }))
  }

  const handleAddCommentToPost = useCallback(async (postId, content) => {
    if (!content?.trim()) return
    
    if (!user) {
      alert('Please log in to add a comment.')
      window.location.href = '/login'
      return
    }
    
    try {
      const response = await apiCall(`/blog/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ 
          content: content.trim()
        })
      })
      
      if (response.success) {
        const newComment = {
          id: Date.now(),
          user: { 
            name: user?.name || 'You', 
            avatar: user?.profilePhoto 
          },
          content: content.trim(),
          timeAgo: 'now',
          replies: []
        }

        setPosts(posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                commentsList: [...post.commentsList, newComment],
                comments: post.comments + 1
              }
            : post
        ))

        setNewComment(prev => ({ ...prev, [postId]: '' }))
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      alert(`Error adding comment: ${error.message || 'Please try again.'}`)
    }
  }, [user, posts])

  const handleEditPost = async (postId, updatedData) => {
    try {
      const response = await apiCall(`/blog/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: updatedData.title.trim(),
          content: updatedData.content.trim(),
          category: updatedData.tag ? updatedData.tag.toLowerCase().replace(' ', '_') : 'question',
          tags: updatedData.hashtags ? updatedData.hashtags.split(' ').filter(tag => tag.startsWith('#')).map(tag => tag.slice(1)) : [],
          image: updatedData.image
        })
      })

      if (response.success) {
        // Reload posts to show updated content
        await loadPosts()
        // Update counts
        loadUserCounts()
        loadTopContributors()
        setMessage('Post updated successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error updating post:', error)
      setMessage('Error updating post. Please try again.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    try {
      const response = await apiCall(`/blog/${postId}`, {
        method: 'DELETE'
      })

      if (response.success) {
        // Remove post from local state
        setPosts(posts.filter(post => post.id !== postId))
        // Update counts
        loadUserCounts()
        loadTopContributors()
        setMessage('Post deleted successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      setMessage('Error deleting post. Please try again.')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-forest-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-green-100 rounded-full opacity-10 animate-pulse delay-500"></div>
      </div>
      
      {/* Signup Banner for non-authenticated users */}
      {!user && (
        <div className="bg-gradient-to-r from-forest-green-500 to-blue-600 text-white py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaUsers className="mr-2" />
                <span className="text-sm font-medium">
                  Join our community to like, comment, and create posts!
                </span>
              </div>
              <a 
                href="/signup" 
                className="bg-white text-forest-green-500 px-4 py-1 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Sign Up Now
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Bar and Content */}
      <div className="bg-gradient-to-r from-forest-green-50 via-cream-100 to-forest-green-100 relative z-10 pt-16">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-4">
          <div className="relative max-w-2xl mx-auto">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts, people, or hashtags..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                // Debounce search
                clearTimeout(searchTimeout)
                const timeout = setTimeout(() => {
                  handleSearch(e.target.value)
                }, 500)
                setSearchTimeout(timeout)
              }}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Read-only banner for unauthenticated users */}
        {!user && (
          <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <FaUsers className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">
                      You're viewing the blog in read-only mode
                    </h3>
                    <p className="text-sm text-blue-600">
                      Sign up to create posts, comment, like, and join our gardening community!
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <a
                    href="/signup"
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </a>
                  <a
                    href="/login"
                    className="px-4 py-2 border border-blue-600 text-blue-600 text-sm rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Login
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 xl:grid-cols-10 gap-4 md:gap-6">
          {/* Left Sidebar */}
          <div className="md:col-span-4 lg:col-span-2 xl:col-span-2 order-1">
            <div className="sticky top-8 space-y-4 bg-gray-50 p-3 md:p-4 rounded-2xl">
              {/* Navigation Menu */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <nav className="space-y-2">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setActiveFilter(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        activeFilter === item.name
                          ? 'bg-forest-green-50 text-forest-green-700 border border-forest-green-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      {item.count && (
                        <span className="px-2 py-1 bg-forest-green-100 text-forest-green-700 text-xs font-medium rounded-full">
                          {item.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Blog Stats */}
              <div className="bg-gradient-to-r from-forest-green-600 to-forest-green-700 rounded-xl shadow-sm p-4 text-white">
                <h3 className="font-bold text-base mb-3">Blog Community</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-forest-green-100">Total Readers</span>
                    <span className="font-bold text-xl">{blogStats.totalMembers.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-forest-green-100">Active Today</span>
                    <span className="font-bold text-xl">{blogStats.activeToday.toLocaleString()}</span>
                  </div>
                  </div>
                </div>

              {/* Community Guidelines */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-bold text-base mb-2">Community Guidelines</h3>
                <p className="text-gray-600 text-xs mb-3">
                  Keep our blog community helpful, respectful, and informative for all plant enthusiasts.
                </p>
                <button 
                  onClick={() => setShowGuidelines(true)}
                  className="w-full px-4 py-2 bg-forest-green-100 text-forest-green-800 rounded-lg hover:bg-forest-green-200 transition-colors font-medium"
                >
                  Read Full Guidelines
                </button>
              </div>
            </div>
          </div>

          {/* Center Feed */}
          <div className="md:col-span-8 lg:col-span-7 xl:col-span-6 order-2 md:order-2">
            {/* Filters and Sorting */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 md:gap-4">
              <div className="flex flex-wrap gap-1 md:gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${
                      filter === activeFilter
                        ? 'bg-forest-green-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                <FaSortDown className="text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green-600 bg-white text-xs md:text-sm"
                >
                  <option value="Newest">Newest</option>
                  <option value="Most Liked">Most Liked</option>
                  <option value="Most Commented">Most Commented</option>
                  <option value="Trending">Trending</option>
                </select>
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
                message.includes('successfully') ? 'bg-forest-green-100 text-forest-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {message}
              </div>
            )}

            {/* Posts */}
            <div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-green-600"></div>
                </div>
              ) : filteredAndSortedPosts.length > 0 ? (
                filteredAndSortedPosts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post}
                    user={user}
                    showComments={showComments}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    toggleComments={toggleComments}
                    handleAddCommentToPost={handleAddCommentToPost}
                    handleLikePost={handleLikePost}
                    handleSharePost={handleSharePost}
                    handleBookmarkPost={handleBookmarkPost}
                    handleDeletePost={handleDeletePost}
                    setEditingPost={setEditingPost}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-500 mb-6">
                    {user 
                      ? "Be the first to share your gardening experience with the community!" 
                      : "Sign up to create the first post and start the conversation!"
                    }
                  </p>
                  {user ? (
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="px-6 py-3 bg-forest-green-600 text-white rounded-lg hover:bg-forest-green-700 transition-colors font-medium"
                    >
                      Create First Post
                    </button>
                  ) : (
                    <div className="flex justify-center space-x-3">
                      <a
                        href="/signup"
                        className="px-6 py-3 bg-forest-green-600 text-white rounded-lg hover:bg-forest-green-700 transition-colors font-medium"
                      >
                        Sign Up
                      </a>
                      <a
                        href="/login"
                        className="px-6 py-3 border border-forest-green-600 text-forest-green-600 rounded-lg hover:bg-forest-green-50 transition-colors font-medium"
                      >
                        Login
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  type="button"
                  onClick={() => loadPosts(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => loadPosts(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === pageNum
                            ? 'bg-forest-green-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  type="button"
                  onClick={() => loadPosts(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="md:col-span-12 lg:col-span-3 xl:col-span-2 order-3">
            <div className="lg:sticky lg:top-8 space-y-4 bg-gray-50 p-3 md:p-4 rounded-2xl">
              {/* Trending Hashtags */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-bold text-base mb-3 flex items-center">
                  <FaHashtag className="mr-2 text-forest-green-600" />
                  Trending Hashtags
                </h3>
                <div className="space-y-2">
                  {trendingHashtags.length > 0 ? (
                    trendingHashtags.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-forest-green-600 text-sm">{item.tag}</div>
                          <div className="text-xs text-forest-green-600">{item.count} posts</div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          item.trend === 'up' ? 'bg-forest-green-600' : 'bg-red-500'
                        }`}></div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <div className="text-gray-400 mb-2">🔍</div>
                      <div className="text-sm">No trending hashtags yet</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Hashtags will appear here as users create posts
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Contributors */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-bold text-base mb-3 flex items-center">
                  <FaTrophy className="mr-2 text-yellow-500" />
                  Top Contributors
                </h3>
                <div className="space-y-3">
                  {topContributors.length > 0 ? (
                    topContributors.map((contributor, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <span className={`text-sm font-bold w-4 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                          {index + 1}.
                        </span>
                        <Avatar user={{ name: contributor.name, avatar: contributor.avatar }} size="sm" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{contributor.name}</div>
                          <div className="text-xs text-gray-500">{contributor.postCount} posts</div>
                        </div>
                        {index === 0 && <FaTrophy className="text-yellow-500 text-xs" />}
                        {index === 1 && <div className="w-3 h-3 rounded-full bg-gray-400"></div>}
                        {index === 2 && <div className="w-3 h-3 rounded-full bg-amber-600"></div>}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-gray-500 text-sm">No contributors yet</div>
                      <div className="text-gray-400 text-xs">Be the first to create a post!</div>
                    </div>
                  )}
                </div>
                  </div>

              {/* Quick Tips Slideshow */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm p-4 overflow-hidden">
                <h3 className="font-bold text-base mb-3 text-gray-900">💡 Quick Tips</h3>
                <div className="relative h-20 flex items-center justify-center">
                  <div 
                    key={currentTipIndex}
                    className="text-xs text-gray-700 p-3 bg-white rounded-lg text-center transition-all duration-500 ease-in-out transform hover:scale-105"
                    style={{
                      animation: 'zoomOut 2s ease-in-out',
                    }}
                  >
                    {quickTips[currentTipIndex]}
                  </div>
                </div>
                
                {/* Slide indicators */}
                <div className="flex justify-center space-x-1 mt-3">
                  {quickTips.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTipIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentTipIndex ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Floating Create Post Button */}
      {user && (
        <button
          type="button"
          onClick={() => setShowCreatePost(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-forest-green-600 hover:bg-forest-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50"
        >
          <FaPlus className="w-6 h-6" />
        </button>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal 
          onClose={() => setShowCreatePost(false)} 
          user={user}
          onCreatePost={async () => {
            // Reset to first page and reload posts
            setCurrentPage(1)
            // Force reload with page 1 to get latest posts
            try {
              setLoading(true)
              const endpoint = activeFilter === 'My Posts'
                ? '/blog/mine?sort=newest&page=1&limit=10'
                : activeFilter === 'Saved Posts'
                  ? '/blog/saved?sort=newest&page=1&limit=10'
                  : '/blog?sort=newest&page=1&limit=10'

              const response = await apiCall(endpoint)
              
              if (response.success && response.data) {
                const backendPosts = Array.isArray(response.data) ? response.data : response.data.posts || []
                const transformedPosts = backendPosts.map(post => ({
                  id: post._id || post.id,
                  user: {
                    name: post.author || 'Anonymous',
                    username: `@${(post.author || 'user').toLowerCase().replace(' ', '_')}`,
                    avatar: post.author?.avatar || null
                  },
                  timeAgo: formatTimeAgo(post.createdAt),
                  tag: post.category === 'success_story' ? 'Success Story' : post.category === 'question' ? 'Question' : '',
                  title: post.title || 'Untitled Post',
                  content: post.content || 'No content available',
                  image: post.image,
                  hashtags: post.tags?.map(tag => `#${tag}`) || ['#PlantCare'],
                  likes: post.likeCount || (post.likes?.length || 0),
                  comments: post.commentCount || (post.comments?.length || 0),
                  shares: post.shareCount || (Array.isArray(post.shares) ? post.shares.length : (post.shares || 0)),
                  bookmarks: post.bookmarkCount || (post.bookmarks?.length || 0),
                  liked: user ? post.likes?.some(like => like.userEmail === user.email) || false : false,
                  bookmarked: user ? post.bookmarks?.some(bookmark => bookmark.userEmail === user.email) || false : false,
                  commentsList: (post.comments || []).map(c => ({
                    id: c._id || `${post._id || post.id}-${c.createdAt}`,
                    user: { 
                      name: c.user?.name || c.author || 'Anonymous', 
                      avatar: c.user?.avatar || null 
                    },
                    content: c.content,
                    timeAgo: formatTimeAgo(c.createdAt)
                  }))
                }))
                setPosts(transformedPosts)
                
                // Update pagination info if available
                if (response.data.totalPages) {
                  setTotalPages(response.data.totalPages)
                }
              }
            } catch (error) {
              console.error('Error loading posts after creation:', error)
            } finally {
              setLoading(false)
            }
            
            setShowCreatePost(false)
          }}
        />
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal 
          post={editingPost}
          onClose={() => setEditingPost(null)} 
          onUpdatePost={handleEditPost}
        />
      )}

      {/* Community Guidelines Modal */}
      {showGuidelines && (
        <CommunityGuidelines onClose={() => setShowGuidelines(false)} />
      )}
    </div>
  )
}

// Create Post Modal Component
const CreatePostModal = ({ onClose, user, onCreatePost }) => {
  const [postData, setPostData] = useState({
    title: '',
    content: '',
    tag: '',
    hashtags: '',
    image: null
  })
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPostData(prev => ({ ...prev, image: event.target.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Debug logging
    console.log('Form submission data:', postData)
    console.log('Validation check:', {
      title: postData.title.trim(),
      content: postData.content.trim(),
      tag: postData.tag.trim() || 'empty',
      user: !!user
    })
    
    if (!postData.title.trim() || !postData.content.trim()) {
      alert('Please fill in the required fields: Title and Content')
      return
    }

    if (!user) {
      alert('Please log in to create a post.')
      return
    }

    setLoading(true)
    try {
      const requestData = {
        title: postData.title.trim(),
        content: postData.content.trim(),
        category: postData.tag ? postData.tag.toLowerCase().replace(' ', '_') : null, // Leave empty if not selected
        tags: postData.hashtags ? postData.hashtags.split(' ').filter(tag => tag.startsWith('#')).map(tag => tag.slice(1)) : [],
        image: postData.image
      }
      
      console.log('Sending request data:', requestData)
      console.log('User token:', localStorage.getItem('urbansprout_token'))
      
      const response = await apiCall('/blog', {
        method: 'POST',
        body: JSON.stringify(requestData)
      })
      
      console.log('API response:', response)

      if (response.success) {
        // Show server's success message
        alert(response.message || '🎉 Post submitted successfully! Your post will be added to the community after approval.')
        
        // Small delay to ensure database is updated
        setTimeout(() => {
          onCreatePost()
            // Update counts after creating post
            loadUserCounts()
            loadCommunityStats()
            loadTopContributors()
            loadTrendingHashtags()
        }, 500)
      } else {
        alert(`Failed to create post: ${response.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert(`Error creating post: ${error.message || 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Post</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <FaTimes />
            </button>
          </div>

          <form onSubmit={(e) => {
            console.log('Form submitted')
            handleSubmit(e)
          }} className="space-y-6">
            {/* Post Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Post Type (Optional)</label>
              <div className="flex gap-2">
                {['Question', 'Success Story'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      console.log('Selecting post type:', type)
                      setPostData(prev => ({ ...prev, tag: type }))
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border-2 ${
                      postData.tag === type
                        ? type === 'Question' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-forest-green-100 text-forest-green-700 border-forest-green-300'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    {type}
                    {postData.tag === type && ' ✓'}
                  </button>
                ))}
              </div>
              <p className="text-gray-500 text-sm mt-1">Post type will be left empty if not selected</p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={postData.title}
                onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-green-600"
                placeholder="What's your post about?"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
              <textarea
                value={postData.content}
                onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-green-600 resize-none"
                placeholder="Share your knowledge, experience, or ask for help..."
                required
              />
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
              <input
                type="text"
                value={postData.hashtags}
                onChange={(e) => setPostData(prev => ({ ...prev, hashtags: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-green-600"
                placeholder="#PlantCare #IndoorPlants #BeginnerTips"
              />
        </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Photo</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                {postData.image ? (
                  <div className="relative">
                    <img src={postData.image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setPostData(prev => ({ ...prev, image: null }))}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <FaCamera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-forest-green-600 text-white rounded-lg hover:bg-forest-green-700 transition-colors"
                    >
                      Choose Photo
                    </button>
                    <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                onClick={(e) => {
                  console.log('Publish button clicked')
                  console.log('Current postData:', postData)
                  console.log('Loading state:', loading)
                  console.log('Validation status:', {
                    title: !!postData.title.trim(),
                    content: !!postData.content.trim(),
                    tag: postData.tag.trim() || 'empty'
                  })
                }}
                className="flex-1 px-6 py-3 bg-forest-green-600 text-white rounded-xl hover:bg-forest-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publishing...
                  </div>
                ) : (
                  'Publish Post'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Edit Post Modal Component
const EditPostModal = ({ post, onClose, onUpdatePost }) => {
  const [postData, setPostData] = useState({
    title: post.title,
    content: post.content,
    tag: post.tag,
    hashtags: post.hashtags ? post.hashtags.join(' ') : '',
    image: post.image
  })
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPostData(prev => ({ ...prev, image: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!postData.title.trim() || !postData.content.trim()) return

    setLoading(true)
    try {
      await onUpdatePost(post.id, postData)
      onClose()
    } catch (error) {
      console.error('Error updating post:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Post</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Post Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
              <select
                value={postData.tag}
                onChange={(e) => setPostData(prev => ({ ...prev, tag: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-green-600"
              >
                <option value="Question">Question</option>
                <option value="Success Story">Success Story</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={postData.title}
                onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-green-600"
                placeholder="What's your question or success story?"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                value={postData.content}
                onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-green-600 resize-none"
                placeholder="Share your knowledge, experience, or ask for help..."
                required
              />
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
              <input
                type="text"
                value={postData.hashtags}
                onChange={(e) => setPostData(prev => ({ ...prev, hashtags: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-green-600"
                placeholder="#PlantCare #IndoorPlants #BeginnerTips"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Photo</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                {postData.image ? (
                  <div className="relative">
                    <img src={postData.image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setPostData(prev => ({ ...prev, image: null }))}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <FaCamera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-forest-green-600 text-white rounded-lg hover:bg-forest-green-700 transition-colors"
                    >
                      Choose Photo
                    </button>
                    <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-forest-green-600 text-white rounded-xl hover:bg-forest-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Updating...' : 'Update Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Blog