import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaHistory, 
  FaStar, 
  FaTrophy,
  FaHeart,
  FaClock
} from 'react-icons/fa';
import { apiCall } from '../utils/api';
import Logo from '../components/Logo';

const MyActivity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    reviewsWritten: 0,
    averageRating: 0,
    totalStarsGiven: 0
  });

  // Load user activity data
  useEffect(() => {
    const loadActivityData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Load user reviews
        const reviewsResponse = await apiCall('/store/reviews/user/my');
        if (reviewsResponse.success) {
          const userReviews = reviewsResponse.data.reviews || [];
          setReviews(userReviews);

          // Generate activity timeline from reviews only
          const activityList = userReviews.map(review => ({
            id: `review-${review._id}`,
            type: 'review',
            title: 'Wrote a product review',
            description: `Reviewed "${review.productName}" with ${review.rating} stars`,
            date: new Date(review.createdAt),
            icon: FaStar,
            color: 'yellow',
            data: review
          }));

          // Sort activities by date (newest first)
          activityList.sort((a, b) => b.date - a.date);
          setActivities(activityList);

          // Calculate review stats
          const totalStars = userReviews.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = userReviews.length > 0 ? (totalStars / userReviews.length) : 0;

          setStats({
            reviewsWritten: userReviews.length,
            averageRating: Math.round(averageRating * 10) / 10,
            totalStarsGiven: totalStars
          });
        }

      } catch (error) {
        console.error('Error loading activity data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivityData();
  }, [user]);

  // All activities are reviews, so no filtering needed
  const filteredActivities = activities;

  // Format date for display
  const formatDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.floor((diffDays - 1) / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-green-600"></div>
      </div>
    );
  }

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
                <FaHistory className="text-purple-600 text-2xl mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Activity</h1>
                  <p className="text-gray-600">Track your gardening journey and achievements</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Review Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20 p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.reviewsWritten}</div>
            <div className="text-sm text-gray-600 mb-2">Reviews Written</div>
            <div className="flex items-center justify-center">
              <FaStar className="text-yellow-400 mr-1" />
              <span className="text-xs text-gray-500">Total reviews submitted</span>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20 p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{stats.averageRating}</div>
            <div className="text-sm text-gray-600 mb-2">Average Rating</div>
            <div className="flex items-center justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`text-sm ${
                    star <= Math.round(stats.averageRating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20 p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.totalStarsGiven}</div>
            <div className="text-sm text-gray-600 mb-2">Total Stars Given</div>
            <div className="flex items-center justify-center">
              <FaTrophy className="text-purple-400 mr-1" />
              <span className="text-xs text-gray-500">Stars across all reviews</span>
            </div>
          </div>
        </div>


        {/* Reviews Timeline */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-white/20 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <FaStar className="text-yellow-500 mr-2" />
            Your Reviews
          </h2>
          
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl text-gray-300 mx-auto mb-4">⭐</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600 mb-6">
                Purchase products and write reviews to see your review history here!
              </p>
              <button
                onClick={() => navigate('/my-orders')}
                className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                View My Orders
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredActivities.map((activity) => {
                const review = activity.data;
                return (
                  <div key={activity.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start space-x-4">
                      <div className="bg-yellow-100 p-3 rounded-full border-2 border-yellow-200">
                        <FaStar className="text-yellow-600 text-xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-gray-900 text-lg">{review.productName}</h4>
                          <span className="text-sm text-gray-500 flex items-center bg-white px-3 py-1 rounded-full">
                            <FaClock className="mr-1" />
                            {formatDate(activity.date)}
                          </span>
                        </div>
                        
                        {/* Star Rating Display */}
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaStar
                                key={star}
                                className={`text-lg ${
                                  star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold text-yellow-600 text-lg">{review.rating}/5</span>
                          {review.verifiedPurchase && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                              ✓ Verified Purchase
                            </span>
                          )}
                        </div>
                        
                        {/* Review Comment */}
                        {review.comment && (
                          <div className="bg-white/70 rounded-lg p-4 border border-yellow-100">
                            <p className="text-gray-700 leading-relaxed italic">
                              "{review.comment}"
                            </p>
                          </div>
                        )}
                        
                        {/* Review Status */}
                        <div className="mt-3 flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            review.status === 'approved' 
                              ? 'bg-green-100 text-green-700' 
                              : review.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {review.status === 'approved' ? '✓ Published' : 
                             review.status === 'pending' ? '⏳ Under Review' : '❌ Rejected'}
                          </span>
                          
                          {review.helpful > 0 && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <FaHeart className="mr-1 text-red-400" />
                              {review.helpful} found this helpful
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default MyActivity;
