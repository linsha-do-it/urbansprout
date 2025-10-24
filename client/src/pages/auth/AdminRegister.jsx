import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaCrown, FaCheck, FaTimes, FaShieldAlt } from 'react-icons/fa';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { validateForm, validatePassword, getPasswordStrength, getValidationMessage } from '../../utils/validation';

const AdminRegister = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminCode: ''
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

  // Test server connection
  const testServerConnection = useCallback(async () => {
    try {
      const API_BASE_URL = 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE_URL}/test`);
      const data = await response.json();
      console.log('Server connection test:', data);
    } catch (error) {
      console.error('Server connection test failed:', error);
    }
  }, []);

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
      console.log('Checking email availability for:', email);
      console.log('API URL:', `${API_BASE_URL}/auth/check-email`);
      
      const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setEmailValidation({
          isChecking: false,
          isValid: !data.exists,
          message: data.exists ? 'Email already registered' : 'Email is available',
          exists: data.exists
        });
      } else {
        setEmailValidation({
          isChecking: false,
          isValid: false,
          message: data.message || 'Error checking email',
          exists: null
        });
      }
    } catch (error) {
      console.error('Email check error:', error);
      setEmailValidation({
        isChecking: false,
        isValid: false,
        message: `Error checking email availability: ${error.message}`,
        exists: null
      });
    }
  }, []);

  // Test server connection on mount
  useEffect(() => {
    testServerConnection();
  }, [testServerConnection]);

  // Debounced email check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email) {
        checkEmailAvailability(formData.email);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.email, checkEmailAvailability]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user starts typing
    if (fieldMessages[name]) {
      setFieldMessages(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear general error
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate admin code first
    if (formData.adminCode !== 'ADMIN2024') {
      setError('Invalid admin registration code');
      return;
    }
    
    const validation = validateForm(formData, 'admin');
    if (!validation.isValid) {
      setError('Please fix the errors below');
      setFieldMessages(validation.errors);
      return;
    }
    
    // Check if email is available (only if validation was successful)
    if (emailValidation.exists === true) {
      setError('Email is already registered');
      return;
    }
    
    // If email validation failed due to network error, allow registration to proceed
    // The backend will handle duplicate email validation
    if (emailValidation.isValid === false && emailValidation.exists === null) {
      console.warn('Email validation failed, proceeding with registration - backend will validate');
    }
    
    setLoading(true);
    setError('');
    
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'admin'
      };
      
      const response = await authAPI.register(userData);
      
      if (response.success) {
        login(response.data.user, response.data.token);
        navigate('/admin/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Admin registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = validatePassword(formData.password);
  const isFormValid = formData.name && 
                     formData.email && 
                     formData.password && 
                     formData.confirmPassword &&
                     formData.adminCode &&
                     (emailValidation.isValid || emailValidation.exists === null) &&
                     passwordStrength.isValid &&
                     formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-full">
              <FaShieldAlt className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Registration</h1>
          <p className="text-gray-600">Create an admin account for UrbanSprout</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Admin Code */}
            <div>
              <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Registration Code *
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="adminCode"
                  name="adminCode"
                  value={formData.adminCode}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                    fieldMessages.adminCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter admin code"
                  required
                />
                <FaCrown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" />
              </div>
              {fieldMessages.adminCode && (
                <p className="text-red-500 text-sm mt-1">{fieldMessages.adminCode}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                  fieldMessages.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
                required
              />
              {fieldMessages.name && (
                <p className="text-red-500 text-sm mt-1">{fieldMessages.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                    fieldMessages.email || !emailValidation.isValid ? 'border-red-500' : 
                    emailValidation.isValid ? 'border-green-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                  required
                />
                {emailValidation.isChecking && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                  </div>
                )}
                {!emailValidation.isChecking && emailValidation.isValid && (
                  <FaCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                )}
                {!emailValidation.isChecking && emailValidation.exists && (
                  <FaTimes className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" />
                )}
              </div>
              {fieldMessages.email && (
                <p className="text-red-500 text-sm mt-1">{fieldMessages.email}</p>
              )}
              {emailValidation.message && !emailValidation.isChecking && (
                <p className={`text-sm mt-1 ${
                  emailValidation.isValid ? 'text-green-600' : 'text-red-500'
                }`}>
                  {emailValidation.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                    fieldMessages.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score === 1 ? 'bg-red-500 w-1/4' :
                          passwordStrength.score === 2 ? 'bg-yellow-500 w-1/2' :
                          passwordStrength.score === 3 ? 'bg-blue-500 w-3/4' :
                          passwordStrength.score === 4 ? 'bg-green-500 w-full' :
                          'bg-gray-300 w-full'
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score === 1 ? 'text-red-500' :
                      passwordStrength.score === 2 ? 'text-yellow-500' :
                      passwordStrength.score === 3 ? 'text-blue-500' :
                      passwordStrength.score === 4 ? 'text-green-500' :
                      'text-gray-500'
                    }`}>
                      {passwordStrength.score === 1 ? 'Weak' :
                       passwordStrength.score === 2 ? 'Fair' :
                       passwordStrength.score === 3 ? 'Good' :
                       passwordStrength.score === 4 ? 'Strong' : 'Very Weak'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div className={`flex items-center space-x-1 ${
                      passwordStrength.validations.minLength ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span>{passwordStrength.validations.minLength ? '✓' : '○'}</span>
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      passwordStrength.validations.hasUppercase ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span>{passwordStrength.validations.hasUppercase ? '✓' : '○'}</span>
                      <span>One uppercase letter</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      passwordStrength.validations.hasLowercase ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span>{passwordStrength.validations.hasLowercase ? '✓' : '○'}</span>
                      <span>One lowercase letter</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      passwordStrength.validations.hasNumber ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span>{passwordStrength.validations.hasNumber ? '✓' : '○'}</span>
                      <span>One number</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      passwordStrength.validations.hasSpecialChar ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span>{passwordStrength.validations.hasSpecialChar ? '✓' : '○'}</span>
                      <span>One special character</span>
                    </div>
                  </div>
                </div>
              )}
              
              {fieldMessages.password && (
                <p className="text-red-500 text-sm mt-1">{fieldMessages.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                    fieldMessages.confirmPassword ? 'border-red-500' : 
                    formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500' :
                    formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500' :
                    'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {fieldMessages.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{fieldMessages.confirmPassword}</p>
              )}
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-green-500 text-sm mt-1">Passwords match</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isFormValid && !loading
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Admin Account...
                </div>
              ) : (
                'Create Admin Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an admin account?{' '}
              <Link to="/login" className="text-red-600 hover:text-red-700 font-medium">
                Sign in here
              </Link>
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Regular user?{' '}
              <Link to="/signup" className="text-gray-600 hover:text-gray-700">
                Sign up as user
              </Link>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <FaShieldAlt className="text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
              <p className="text-xs text-yellow-700 mt-1">
                Admin registration requires a valid admin code. This page will be removed after initial admin setup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
