import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Leaf, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Heart,
  Zap
} from 'lucide-react';
import { signInWithGoogle, getGoogleRedirectResult } from '../../config/firebase';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { validateEmail } from '../../utils/validation';
import Logo from '../../components/Logo';

const NewLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Handle redirect result from Google Sign-In
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getGoogleRedirectResult();
        if (result && result.user) {
          console.log('Google redirect result received:', result.user.email);
          await processGoogleUser(result.user);
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
        setError('Google Sign-In failed. Please try again.');
      }
    };

    handleRedirectResult();
  }, []);

  // Process Google user authentication
  const processGoogleUser = async (user) => {
    setLoading(true);
    setError('');
    
    try {
      const idToken = await user.getIdToken();
      console.log('Processing Google user:', user.email);

      const response = await authAPI.firebaseAuth({
        idToken,
        email: user.email,
        role: 'beginner',
        name: user.displayName || 'User'
      });
      
      if (response.success) {
        const token = response.token || response.data?.token;
        const userData = response.user || response.data?.user;
        
        if (token && userData) {
          console.log('Google sign-in successful:', userData.email);
          login(userData, token);
          navigate('/dashboard');
        } else {
          throw new Error('Invalid response format from server');
        }
      } else {
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(error.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear general error
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      setForgotPasswordMessage('Please enter your email address');
      return;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      setForgotPasswordMessage('Please enter a valid email address');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');

    try {
      const response = await authAPI.forgotPassword({ email: forgotPasswordEmail });
      
      if (response.success) {
        if (response.resetUrl) {
          setForgotPasswordMessage(response.message);
          setResetUrl(response.resetUrl);
        } else {
          setForgotPasswordMessage(response.message);
          setResetUrl('');
        }
      } else {
        setForgotPasswordMessage(response.message || 'Failed to send reset email');
        setResetUrl('');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setForgotPasswordMessage(error.message || 'Failed to generate reset link. Please try again.');
      setResetUrl('');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await authAPI.login(formData);
      
      if (response.success) {
        // Handle Remember Me functionality
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        console.log('Login successful, user data:', response.data.user);
        console.log('User role:', response.data.user.role);
        
        setSuccessMessage('Login successful! Redirecting...');
        
        // Small delay to show success message
        setTimeout(() => {
          login(response.data.user, response.data.token);
          
          // Redirect based on user role
          const userRole = response.data.user.role;
          console.log('Redirecting based on role:', userRole);
          
          switch (userRole) {
            case 'admin':
              console.log('Redirecting to admin dashboard');
              navigate('/admin');
              break;
            case 'vendor':
              console.log('Redirecting to vendor dashboard');
              navigate('/vendor/dashboard');
              break;
            case 'expert':
              console.log('Redirecting to expert dashboard');
              navigate('/expert/dashboard');
              break;
            default:
              console.log('Redirecting to regular dashboard');
              navigate('/dashboard');
          }
        }, 1000);
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Initiating Google Sign-In...');
      const result = await signInWithGoogle();
      
      if (result === null) {
        console.log('Redirect method used, waiting for page reload...');
        return;
      }
      
      if (result && result.user) {
        console.log('Popup method successful:', result.user.email);
        await processGoogleUser(result.user);
      } else {
        throw new Error('No user data received from Google');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(error.message || 'Google Sign-In failed. Please try again.');
      setLoading(false);
    }
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
              className="text-4xl font-bold bg-gradient-to-r from-forest-green-600 to-forest-green-800 bg-clip-text text-transparent hover:from-forest-green-800 hover:to-forest-green-800 transition-all duration-300 cursor-pointer"
            >
              UrbanSprout
            </motion.h1>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-semibold text-forest-green-800 mb-2">Welcome Back!</h2>
            <p className="text-forest-green-600">Sign in to continue your gardening journey</p>
          </motion.div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Success Message */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

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
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-forest-green-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-forest-green-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-forest-green-200 hover:border-forest-green-300'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {fieldErrors.email && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1 text-sm text-red-600 flex items-center"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {fieldErrors.email}
                  </motion.p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-forest-green-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-forest-green-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-10 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-forest-green-200 hover:border-forest-green-300'
                    }`}
                    placeholder="Enter your password"
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
                {fieldErrors.password && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1 text-sm text-red-600 flex items-center"
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {fieldErrors.password}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-forest-green-600 focus:ring-forest-green-500 border-forest-green-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-forest-green-700">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-forest-green-600 hover:text-forest-green-800 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-cream-100 bg-gradient-to-r from-forest-green-600 to-forest-green-700 hover:from-forest-green-800 hover:to-forest-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Signing in...
                </div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-forest-green-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-forest-green-500 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-forest-green-300 rounded-xl shadow-sm text-sm font-medium text-forest-green-700 bg-white hover:bg-forest-green-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </motion.button>

            {/* Sign up link */}
            <div className="text-center">
              <p className="text-sm text-forest-green-600">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-forest-green-500 hover:text-forest-green-800 transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </form>
        </motion.div>

        {/* Features highlight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center space-y-3"
        >
          <div className="flex justify-center items-center space-x-6 text-sm text-forest-green-600">
            <div className="flex items-center">
              <Heart className="h-4 w-4 mr-1 text-red-400" />
              Plant Care
            </div>
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 mr-1 text-yellow-400" />
              Smart Suggestions
            </div>
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-1 text-blue-400" />
              Expert Tips
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-forest-green-800">Reset Password</h2>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail('');
                      setForgotPasswordMessage('');
                      setResetUrl('');
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Enter your email address and we'll generate a secure link to reset your password.
                </p>

                <form onSubmit={handleForgotPassword}>
                  <div className="mb-4">
                    <label htmlFor="forgot-email" className="block text-sm font-medium text-forest-green-700 mb-1">
                      Email Address
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-forest-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  {forgotPasswordMessage && !resetUrl && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${
                      forgotPasswordMessage.includes('successfully') 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {forgotPasswordMessage}
                    </div>
                  )}

                  {resetUrl && (
                    <div className="mb-4 p-3 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-200">
                      <div className="mt-3">
                        <p className="font-medium mb-2">Click the link below to reset your password:</p>
                        <div className="bg-gray-100 p-2 rounded border">
                          <a 
                            href={resetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 break-all text-xs"
                          >
                            {resetUrl}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(resetUrl);
                            alert('Reset link copied to clipboard!');
                          }}
                          className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                        >
                          Copy Link
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordEmail('');
                        setForgotPasswordMessage('');
                        setResetUrl('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotPasswordLoading}
                      className="flex-1 px-4 py-2 bg-forest-green-600 text-white rounded-lg hover:bg-forest-green-700 disabled:opacity-50 transition-colors"
                    >
                      {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewLogin;
