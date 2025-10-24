import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  KeyRound
} from 'lucide-react';
import { authAPI } from '../../utils/api';
import { validatePassword, getPasswordStrength } from '../../utils/validation';
import Logo from '../../components/Logo';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  // Password validation
  const passwordValidation = validatePassword(formData.password);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
      setTokenValid(false);
    } else {
      setTokenValid(true);
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    if (!passwordValidation.isValid) {
      setError('Password does not meet requirements');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.resetPassword({
        token,
        password: formData.password
      });
      
      if (response.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 flex items-center justify-center py-12 px-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-forest-green-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center relative z-10 border border-white/20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mb-6"
          >
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-forest-green-800 mb-2">Invalid Reset Link</h1>
            <p className="text-forest-green-600">
              This password reset link is invalid or has expired.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-forest-green-600 to-forest-green-700 text-cream-100 rounded-xl hover:from-forest-green-700 hover:to-forest-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Back to Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-green-50 via-cream-100 to-forest-green-100 flex items-center justify-center py-12 px-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-forest-green-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center relative z-10 border border-white/20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="mb-6"
          >
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-forest-green-800 mb-2">Password Reset Successful!</h1>
            <p className="text-forest-green-600">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-forest-green-500 mb-4"
          >
            Redirecting to login page in 3 seconds...
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-forest-green-600 to-forest-green-700 text-cream-100 rounded-xl hover:from-forest-green-700 hover:to-forest-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Go to Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(passwordValidation.score);

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
        className="max-w-md w-full space-y-8 relative z-10"
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
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className="h-6 w-6 text-forest-green-600" />
              <h2 className="text-2xl font-bold text-forest-green-800">Set New Password</h2>
            </div>
            <p className="text-sm text-forest-green-600">
              Create a strong password for your account
            </p>
          </motion.div>
        </div>

        {/* Reset Password Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center"
                >
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

          <div className="space-y-5">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-forest-green-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-forest-green-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-3 border border-forest-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent transition-all duration-200 hover:border-forest-green-300"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-forest-green-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-forest-green-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-forest-green-400" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-forest-green-600">Password strength:</span>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                  <div className="w-full bg-forest-green-200 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${passwordStrength.bgColor}`}
                      style={{ width: `${(passwordValidation.score / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center ${passwordValidation.validations.minLength ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.validations.minLength ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
                      8+ characters
                    </div>
                    <div className={`flex items-center ${passwordValidation.validations.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.validations.hasUppercase ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
                      Uppercase
                    </div>
                    <div className={`flex items-center ${passwordValidation.validations.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.validations.hasNumber ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
                      Number
                    </div>
                    <div className={`flex items-center ${passwordValidation.validations.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.validations.hasSpecialChar ? <CheckCircle className="mr-1 h-3 w-3" /> : <AlertCircle className="mr-1 h-3 w-3" />}
                      Special char
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-forest-green-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-forest-green-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-10 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent transition-all duration-200 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword 
                      ? 'border-red-300 bg-red-50' : 'border-forest-green-200 hover:border-forest-green-300'
                  }`}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-forest-green-600 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-forest-green-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-forest-green-400" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1 text-sm text-red-600 flex items-center"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Passwords do not match
                </motion.p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !passwordValidation.isValid || formData.password !== formData.confirmPassword}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-cream-100 bg-gradient-to-r from-forest-green-600 to-forest-green-700 hover:from-forest-green-700 hover:to-forest-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Resetting Password...
              </div>
            ) : (
              <>
                <KeyRound className="h-5 w-5 mr-2" />
                Reset Password
              </>
            )}
          </motion.button>

          {/* Back to login */}
          <div className="text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-forest-green-600 hover:text-forest-green-500 transition-colors"
            >
              ← Back to Login
            </Link>
          </div>
        </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;





