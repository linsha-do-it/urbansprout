import React, { useState, useEffect, useCallback } from 'react';
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
  Zap,
  User
} from 'lucide-react';
import { signInWithGoogle } from '../../config/firebase';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { validateForm, validatePassword, getPasswordStrength, getValidationMessage, validateEmail } from '../../utils/validation';
import Logo from '../../components/Logo';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    professionalId: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldMessages, setFieldMessages] = useState({});
  const [emailValidation, setEmailValidation] = useState({
    isChecking: false,
    isValid: null,
    message: '',
    exists: null
  });
  
  // OTP Verification States
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Email validation function
  const checkEmailAvailability = useCallback(async (email) => {
    if (!email || !validateEmail(email)) {
      setEmailValidation({
        isChecking: false,
        isValid: false,
        message: 'Please enter a valid email address',
        exists: null
      });
      return;
    }

    setEmailValidation(prev => ({ ...prev, isChecking: true }));

    try {
      const API_BASE_URL = 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setEmailValidation({
          isChecking: false,
          isValid: !data.exists,
          message: data.exists ? 'Email already registered' : 'Email available',
          exists: data.exists
        });
      } else {
        setEmailValidation({
          isChecking: false,
          isValid: null,
          message: 'Unable to verify email',
          exists: null
        });
      }
    } catch (error) {
      console.error('Email validation error:', error);
      setEmailValidation({
        isChecking: false,
        isValid: null,
        message: 'Unable to verify email',
        exists: null
      });
    }
  }, []);


  // Debounced email validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email) {
        checkEmailAvailability(formData.email);
      } else {
        setEmailValidation({
          isChecking: false,
          isValid: null,
          message: '',
          exists: null
        });
      }
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.email, checkEmailAvailability]);

  // OTP Timer Effect
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation messages
    const message = getValidationMessage(name, value, 'beginner');
    setFieldMessages(prev => ({ ...prev, [name]: message }));
    
    // Clear general error
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm(formData, 'beginner');
    if (!validation.isValid) {
      setError('Please fix the errors below');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Send OTP to email instead of registering directly
      const API_BASE_URL = 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'beginner'
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowOtpInput(true);
        setResendTimer(60); // 60 seconds countdown
        setError('');
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      setError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    setOtpError('');

    try {
      const API_BASE_URL = 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: otpCode
        })
      });

      const data = await response.json();

      if (data.success) {
        // Login the user
        login(data.data.user, data.data.token);
        navigate('/dashboard');
      } else {
        setOtpError(data.message || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']); // Clear OTP inputs
        document.getElementById('otp-0')?.focus();
      }
    } catch (error) {
      setOtpError(error.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    setOtpError('');

    try {
      const API_BASE_URL = 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email
        })
      });

      const data = await response.json();

      if (data.success) {
        setResendTimer(60);
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      } else {
        setOtpError(data.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      setOtpError(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      
      // Send Google user data to backend with beginner role
      const googleData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        role: 'beginner'
      };
      
      const response = await authAPI.googleSignIn(googleData);
      
      if (response.success) {
        login(response.data.user, response.data.token);
            navigate('/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(formData.password);
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
            <p className="text-sm text-forest-green-600">Start your gardening journey with us</p>
          </motion.div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20"
        >
          {showOtpInput ? (
            // OTP Verification Screen
            <div className="space-y-6">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mx-auto w-16 h-16 bg-forest-green-100 rounded-full flex items-center justify-center mb-4"
                >
                  <Mail className="h-8 w-8 text-forest-green-600" />
                </motion.div>
                <h2 className="text-2xl font-bold text-forest-green-800 mb-2">Verify Your Email</h2>
                <p className="text-sm text-forest-green-600">
                  We've sent a 6-digit code to<br />
                  <span className="font-semibold">{formData.email}</span>
                </p>
              </div>

              {/* OTP Error Message */}
              <AnimatePresence>
                {otpError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center"
                  >
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {otpError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-forest-green-700 mb-3 text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-forest-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Verify Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || otp.join('').length !== 6}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-cream-100 bg-gradient-to-r from-forest-green-600 to-forest-green-700 hover:from-forest-green-700 hover:to-forest-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {verifyingOtp ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Verifying...
                  </div>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Verify Email
                  </>
                )}
              </motion.button>

              {/* Resend OTP */}
              <div className="text-center">
                <p className="text-sm text-forest-green-600 mb-2">
                  Didn't receive the code?
                </p>
                {resendTimer > 0 ? (
                  <p className="text-sm text-forest-green-500 font-medium">
                    Resend code in {resendTimer}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-sm font-medium text-forest-green-600 hover:text-forest-green-500 underline disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              {/* Back to Signup */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp(['', '', '', '', '', '']);
                    setOtpError('');
                    setResendTimer(0);
                  }}
                  className="text-sm text-forest-green-600 hover:text-forest-green-500 transition-colors"
                >
                  ← Back to Signup
                </button>
              </div>
            </div>
          ) : (
            // Signup Form
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
              {/* Name Field */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-forest-green-700 mb-2">
                Full Name
              </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-forest-green-400" />
                  </div>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldMessages.name && fieldMessages.name.includes('Invalid') ? 'border-red-300 bg-red-50' : 'border-forest-green-200 hover:border-forest-green-300'
                }`}
                placeholder="Enter your full name"
              />
                </div>
              {fieldMessages.name && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`mt-1 text-sm flex items-center ${fieldMessages.name.includes('Invalid') ? 'text-red-600' : 'text-gray-500'}`}
                  >
                    {fieldMessages.name.includes('Invalid') && <AlertCircle className="h-4 w-4 mr-1" />}
                  {fieldMessages.name}
                  </motion.p>
              )}
            </div>


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
                    className={`w-full pl-10 pr-10 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent transition-all duration-200 ${
                      emailValidation.exists === true ? 'border-red-300 bg-red-50' : 
                      emailValidation.isValid === true ? 'border-green-300 bg-green-50' : 
                      fieldMessages.email && fieldMessages.email.includes('Invalid') ? 'border-red-300 bg-red-50' : 'border-forest-green-200 hover:border-forest-green-300'
                  }`}
                  placeholder="Enter your email"
                />
                
                {/* Email validation indicator */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {emailValidation.isChecking ? (
                      <Loader2 className="animate-spin h-4 w-4 text-blue-500" />
                  ) : emailValidation.exists === true ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : emailValidation.isValid === true ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : null}
                </div>
              </div>
              
              {/* Email validation message */}
              {emailValidation.message && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`mt-1 text-sm flex items-center ${
                  emailValidation.exists === true ? 'text-red-600' : 
                  emailValidation.isValid === true ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {emailValidation.exists === true && <AlertCircle className="h-3 w-3 mr-1" />}
                    {emailValidation.isValid === true && <CheckCircle className="h-3 w-3 mr-1" />}
                  {emailValidation.message}
                  </motion.p>
              )}
              
              {/* Field validation message */}
              {fieldMessages.email && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`mt-1 text-sm flex items-center ${fieldMessages.email.includes('Invalid') ? 'text-red-600' : 'text-gray-500'}`}
                  >
                    {fieldMessages.email.includes('Invalid') && <AlertCircle className="h-3 w-3 mr-1" />}
                  {fieldMessages.email}
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
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-3 border border-forest-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent transition-all duration-200 hover:border-forest-green-300"
                  placeholder="Create a password"
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

              {/* Confirm Password Field */}
            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-forest-green-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-forest-green-400" />
                  </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                    className={`w-full pl-10 pr-10 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent transition-all duration-200 ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-300 bg-red-50' : 'border-forest-green-200 hover:border-forest-green-300'
                  }`}
                  placeholder="Confirm your password"
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
              disabled={loading || !passwordValidation.isValid || emailValidation.exists === true || emailValidation.isChecking}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-cream-100 bg-gradient-to-r from-forest-green-600 to-forest-green-700 hover:from-forest-green-700 hover:to-forest-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
            {loading ? (
              <div className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Creating account...
              </div>
            ) : (
                <>
                  Create Account
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
              className="w-full flex justify-center items-center py-3 px-4 border border-forest-green-300 rounded-xl shadow-sm text-sm font-medium text-forest-green-700 bg-white hover:bg-forest-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </motion.button>

          {/* Sign in link */}
          <div className="text-center">
              <p className="text-sm text-forest-green-600">
              Already have an account?{' '}
              <Link
                to="/login"
                  className="font-medium text-forest-green-500 hover:text-forest-green-400 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
          )}
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
    </div>
  );
};

export default Signup;