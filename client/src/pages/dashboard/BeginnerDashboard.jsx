import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaJournalWhills, 
  FaShoppingBag, 
  FaLeaf, 
  FaHistory
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';

const BeginnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-forest-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-green-100 rounded-full opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="bg-forest-green-700 rounded-xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-3">Welcome to UrbanSprout, {user.name}!</h2>
              <p className="text-green-100 text-lg">
                Start your plant journey with our beginner-friendly guides and community support.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="text-6xl opacity-20">🌿</div>
            </div>
          </div>
        </div>

        {/* Main Action Cards - Large and Prominent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* My Garden Card */}
          <div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105"
            onClick={() => navigate('/my-garden-journal')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-gradient-to-br from-forest-green-100 to-forest-green-200 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <FaJournalWhills className="text-forest-green-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">My Garden Journal</h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                Track your plants, document your progress, and create beautiful memories of your journey
              </p>
              <div className="flex items-center text-forest-green-600 font-semibold group-hover:text-forest-green-700 transition-colors">
                <span>Start Journaling</span>
                <FaLeaf className="ml-2" />
              </div>
            </div>
          </div>
          
          {/* My Orders Card */}
          <div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105"
            onClick={() => navigate('/my-orders')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <FaShoppingBag className="text-blue-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">My Orders</h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                View your order history, track deliveries, and easily reorder your favorite plants
              </p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
                <span>View Orders</span>
                <FaShoppingBag className="ml-2" />
              </div>
            </div>
          </div>

          {/* My Activity Card */}
          <div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:scale-105"
            onClick={() => navigate('/my-activity')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <FaHistory className="text-purple-600 text-3xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">My Activity</h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                Track your gardening journey, reviews, achievements, and plant care activities
              </p>
              <div className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700 transition-colors">
                <span>View Activity</span>
                <FaHistory className="ml-2" />
              </div>
            </div>
          </div>
        </div>



      </main>
    </div>
  );
};

export default BeginnerDashboard;