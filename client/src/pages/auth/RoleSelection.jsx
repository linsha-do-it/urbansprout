import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, User, Store, GraduationCap, ArrowRight } from 'lucide-react';
import Logo from '../../components/Logo';
import { Link } from 'react-router-dom';

const RoleSelection = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'beginner',
      title: 'Beginner',
      description: 'New to gardening? Start your journey with personalized guidance and plant care tips.',
      icon: Leaf,
      color: 'from-green-500 to-emerald-600',
      hoverColor: 'hover:from-green-600 hover:to-emerald-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700'
    },
    {
      id: 'expert',
      title: 'Expert',
      description: 'Share your knowledge and help others grow. Connect with the community and showcase your expertise.',
      icon: GraduationCap,
      color: 'from-blue-500 to-indigo-600',
      hoverColor: 'hover:from-blue-600 hover:to-indigo-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    {
      id: 'vendor',
      title: 'Vendor',
      description: 'Sell your plants and gardening supplies. Reach customers and grow your business.',
      icon: Store,
      color: 'from-purple-500 to-pink-600',
      hoverColor: 'hover:from-purple-600 hover:to-pink-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700'
    }
  ];

  const handleRoleSelect = (roleId) => {
    navigate(`/signup/form?role=${roleId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-forest-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-forest-green-100 rounded-full opacity-10 animate-pulse delay-500"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl w-full space-y-8 relative z-10"
      >
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-block group">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto h-20 w-20 rounded-full overflow-hidden flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 shadow-lg group-hover:shadow-xl bg-white"
            >
              <Logo size="xl" className="w-full h-full object-cover" />
            </motion.div>
          </Link>
          <Link to="/" className="block mb-4">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold bg-gradient-to-r from-forest-green-600 to-forest-green-800 bg-clip-text text-transparent hover:from-forest-green-500 hover:to-forest-green-700 transition-all duration-300 cursor-pointer"
            >
              UrbanSprout
            </motion.h1>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-lg text-forest-green-600 font-medium">Choose your account type</p>
            <p className="text-sm text-forest-green-500 mt-2">Select the option that best describes you</p>
          </motion.div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onClick={() => handleRoleSelect(role.id)}
                className={`relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 cursor-pointer border-2 ${role.borderColor} transition-all duration-300 hover:shadow-xl hover:scale-105 group`}
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${role.color} ${role.hoverColor} flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className={`text-xl font-bold ${role.textColor} mb-2`}>{role.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                <div className={`flex items-center ${role.textColor} font-medium text-sm group-hover:translate-x-1 transition-transform`}>
                  <span>Continue</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Login Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-sm text-forest-green-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-forest-green-500 hover:text-forest-green-400 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RoleSelection;










