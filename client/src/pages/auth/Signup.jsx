import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  User,
  ArrowLeft,
  Upload,
  FileText,
  Shield
} from 'lucide-react';
import { signInWithGoogle } from '../../config/firebase';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { validateForm, validatePassword, getPasswordStrength, getValidationMessage, validateEmail, validateYouTubeUrl } from '../../utils/validation';
import Logo from '../../components/Logo';

const emptyExpertFile = () => ({
  fileName: '',
  fileType: '',
  fileSize: 0,
  data: ''
});

const EXPERT_FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp';
const MAX_EXPERT_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXPERT_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'beginner';
  
  // Redirect to role selection if role is invalid
  useEffect(() => {
    const validRoles = ['beginner', 'expert', 'vendor'];
    if (!validRoles.includes(role)) {
      navigate('/signup');
    }
  }, [role, navigate]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    credentialsNotes: '',
    workEvidenceNotes: '',
    youtubeChannel: '',
    credentialsFile: emptyExpertFile(),
    workEvidenceFile: emptyExpertFile(),
    idProofFile: emptyExpertFile()
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldMessages, setFieldMessages] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [processingFile, setProcessingFile] = useState('');
  const [emailValidation, setEmailValidation] = useState({
    isChecking: false,
    isValid: null,
    message: '',
    exists: null
  });

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

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Unable to process file'));
        return;
      }

      resolve(result.split(',')[1] || '');
    };

    reader.onerror = () => reject(new Error('Unable to process file'));
    reader.readAsDataURL(file);
  });


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



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation messages
    const message = getValidationMessage(name, value, role);
    setFieldMessages(prev => ({ ...prev, [name]: message }));
    
    // Clear general error
    if (error) setError('');
  };

  const handleExpertFileChange = async (e) => {
    const { name, files } = e.target;
    const file = files?.[0];

    if (!file) {
      setFormData(prev => ({ ...prev, [name]: emptyExpertFile() }));
      setFileErrors(prev => ({ ...prev, [name]: '' }));
      return;
    }

    if (!ALLOWED_EXPERT_FILE_TYPES.includes(file.type)) {
      setFileErrors(prev => ({ ...prev, [name]: 'Only PDF, JPG, PNG, or WebP files are allowed' }));
      return;
    }

    if (file.size > MAX_EXPERT_FILE_SIZE) {
      setFileErrors(prev => ({ ...prev, [name]: 'File must be 5 MB or smaller' }));
      return;
    }

    try {
      setProcessingFile(name);
      const data = await readFileAsBase64(file);
      setFormData(prev => ({
        ...prev,
        [name]: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          data
        }
      }));
      setFileErrors(prev => ({ ...prev, [name]: '' }));
    } catch (fileError) {
      setFileErrors(prev => ({ ...prev, [name]: fileError.message || 'Unable to process file' }));
      setFormData(prev => ({ ...prev, [name]: emptyExpertFile() }));
    } finally {
      setProcessingFile('');
    }

    if (error) setError('');
  };

  const buildExpertApplicationPayload = () => ({
    credentialsNotes: formData.credentialsNotes.trim(),
    workEvidenceNotes: formData.workEvidenceNotes.trim(),
    youtubeChannel: formData.youtubeChannel.trim(),
    ...(formData.credentialsFile.data && { credentialsFile: formData.credentialsFile }),
    ...(formData.workEvidenceFile.data && { workEvidenceFile: formData.workEvidenceFile }),
    ...(formData.idProofFile.data && { idProofFile: formData.idProofFile })
  });

  const renderExpertFileField = ({ label, name, helperText, required = false }) => {
    const selectedFile = formData[name];
    const selectedFileSize = selectedFile?.fileSize
      ? `${(selectedFile.fileSize / (1024 * 1024)).toFixed(2)} MB`
      : '';

    return (
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-forest-green-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <label
          htmlFor={name}
          className={`flex cursor-pointer items-center justify-between rounded-xl border border-dashed px-4 py-3 transition-colors ${
            fileErrors[name] ? 'border-red-300 bg-red-50' : 'border-forest-green-200 bg-white hover:border-forest-green-400'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-forest-green-100 p-2">
              <Upload className="h-4 w-4 text-forest-green-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {selectedFile?.fileName || 'Choose a file'}
              </p>
              <p className="text-xs text-gray-500">
                {selectedFile?.fileName ? `${selectedFile.fileType || 'File'} • ${selectedFileSize}` : helperText}
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-forest-green-700">
            {processingFile === name ? 'Processing...' : 'Browse'}
          </span>
        </label>
        <input
          id={name}
          name={name}
          type="file"
          accept={EXPERT_FILE_ACCEPT}
          onChange={handleExpertFileChange}
          className="hidden"
        />
        {fileErrors[name] && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-sm text-red-600 flex items-center"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            {fileErrors[name]}
          </motion.p>
        )}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm(formData, role);
    if (!validation.isValid) {
      setError(Object.values(validation.errors)[0] || 'Please fix the errors below');
      return;
    }

    if (hasFileErrors) {
      setError('Please fix the upload errors below');
      return;
    }

    if (processingFile) {
      setError('Please wait for the current file to finish processing');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const userData = {
        role: role
      };

      userData.name = formData.name;
      userData.email = formData.email;
      userData.password = formData.password;
      userData.confirmPassword = formData.confirmPassword;

      if (role === 'expert') {
        userData.expertApplication = buildExpertApplicationPayload();
      }
      
      const response = await authAPI.register(userData);
      
      if (response.success) {
        login(response.data.user, response.data.token);
            navigate('/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (hasFileErrors) {
      setError('Please fix the upload errors below');
      return;
    }

    if (processingFile) {
      setError('Please wait for the current file to finish processing');
      return;
    }

    if (!expertVerificationReady) {
      setError('Please add your YouTube channel and ID proof before continuing with Google');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      
      // Send Google user data to backend with selected role
      const googleData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        role: role,
        ...(role === 'expert' && { expertApplication: buildExpertApplicationPayload() })
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
  const hasFileErrors = Object.values(fileErrors).some(Boolean);
  const expertVerificationReady = role !== 'expert' || (
    validateYouTubeUrl(formData.youtubeChannel) &&
    Boolean(formData.idProofFile.data) &&
    !hasFileErrors
  );

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
        className={`${role === 'expert' ? 'max-w-2xl' : 'max-w-md'} w-full space-y-8 relative z-10`}
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
            <p className="text-sm text-forest-green-600">Create your {role} account</p>
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


              {role === 'expert' && (
                <div className="rounded-2xl border border-forest-green-100 bg-forest-green-50/70 p-5 space-y-5">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-full bg-white p-2 shadow-sm">
                      <Shield className="h-5 w-5 text-forest-green-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-forest-green-900">Expert verification details</h3>
                      <p className="text-sm text-forest-green-700">
                        Upload any credentials or work proof you have, then share your YouTube channel and ID proof so the team can review your expert account.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="credentialsNotes" className="block text-sm font-medium text-forest-green-700 mb-2">
                          Credentials, degree, license, or certificate details
                        </label>
                        <textarea
                          id="credentialsNotes"
                          name="credentialsNotes"
                          rows={4}
                          value={formData.credentialsNotes}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-forest-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent transition-all duration-200 hover:border-forest-green-300"
                          placeholder="Optional: horticulture degree, agriculture certificate, nursery license, etc."
                        />
                      </div>
                      {renderExpertFileField({
                        label: 'Credential upload',
                        name: 'credentialsFile',
                        helperText: 'Optional. Upload PDF, JPG, PNG, or WebP up to 5 MB.'
                      })}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="workEvidenceNotes" className="block text-sm font-medium text-forest-green-700 mb-2">
                          Work evidence, portfolio, employer, workshops, or articles
                        </label>
                        <textarea
                          id="workEvidenceNotes"
                          name="workEvidenceNotes"
                          rows={4}
                          value={formData.workEvidenceNotes}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-forest-green-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent transition-all duration-200 hover:border-forest-green-300"
                          placeholder="Optional: nursery/employer info, portfolio link, workshops taught, published articles."
                        />
                      </div>
                      {renderExpertFileField({
                        label: 'Work evidence upload',
                        name: 'workEvidenceFile',
                        helperText: 'Optional. Upload PDF, JPG, PNG, or WebP up to 5 MB.'
                      })}
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="youtubeChannel" className="block text-sm font-medium text-forest-green-700 mb-2">
                        YouTube channel URL <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FileText className="h-5 w-5 text-forest-green-400" />
                        </div>
                        <input
                          id="youtubeChannel"
                          name="youtubeChannel"
                          type="url"
                          value={formData.youtubeChannel}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-green-500 focus:border-transparent transition-all duration-200 ${
                            fieldMessages.youtubeChannel && fieldMessages.youtubeChannel.includes('valid')
                              ? 'border-red-300 bg-red-50'
                              : 'border-forest-green-200 hover:border-forest-green-300'
                          }`}
                          placeholder="https://www.youtube.com/@yourchannel"
                        />
                      </div>
                      {fieldMessages.youtubeChannel && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-1 text-sm text-red-600 flex items-center"
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {fieldMessages.youtubeChannel}
                        </motion.p>
                      )}
                    </div>

                    {renderExpertFileField({
                      label: 'ID proof upload',
                      name: 'idProofFile',
                      helperText: 'Required. Upload PDF, JPG, PNG, or WebP up to 5 MB.',
                      required: true
                    })}
                  </div>

                  <p className="text-xs text-forest-green-700">
                    We use these uploads only to review expert applications and keep them off the public profile.
                  </p>
                </div>
              )}


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

          {/* Back Button */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="flex items-center text-sm text-forest-green-600 hover:text-forest-green-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to role selection
            </button>
          </div>

          {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={
                loading ||
                !passwordValidation.isValid ||
                emailValidation.exists === true ||
                emailValidation.isChecking ||
                Boolean(processingFile) ||
                hasFileErrors ||
                !expertVerificationReady
              }
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
              disabled={loading || Boolean(processingFile) || hasFileErrors || !expertVerificationReady}
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