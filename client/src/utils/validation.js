// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const VALID_YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'];

export const validateYouTubeUrl = (url) => {
  if (!url || !url.trim()) return false;

  try {
    const parsedUrl = new URL(url.trim());
    return VALID_YOUTUBE_HOSTS.includes(parsedUrl.hostname.toLowerCase());
  } catch (error) {
    return false;
  }
};

const validateExpertDocument = (document, { required = false } = {}) => {
  const hasUpload = Boolean(document?.data);

  if (!hasUpload) {
    return required ? 'This upload is required for expert sign up' : '';
  }

  if (!document.fileName || !document.fileType || !document.fileSize) {
    return 'Please re-upload this file';
  }

  if (document.fileSize > 5 * 1024 * 1024) {
    return 'File must be 5 MB or smaller';
  }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(document.fileType)) {
    return 'Only PDF, JPG, PNG, or WebP files are allowed';
  }

  return '';
};

// Password validation with detailed feedback
export const validatePassword = (password) => {
  const validations = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isValid = Object.values(validations).every(Boolean);
  
  return {
    isValid,
    validations,
    score: Object.values(validations).filter(Boolean).length,
  };
};

// Get password strength
export const getPasswordStrength = (score) => {
  if (score <= 2) return { text: 'Weak', color: 'text-red-500', bgColor: 'bg-red-500' };
  if (score <= 3) return { text: 'Fair', color: 'text-yellow-500', bgColor: 'bg-yellow-500' };
  if (score <= 4) return { text: 'Good', color: 'text-blue-500', bgColor: 'bg-blue-500' };
  return { text: 'Strong', color: 'text-green-500', bgColor: 'bg-green-500' };
};

// Name validation
export const validateName = (name) => {
  return name.trim().length >= 2 && name.trim().length <= 50;
};

// ID validation for experts and vendors
export const validateID = (id, type) => {
  if (!id || id.trim().length === 0) return false;
  
  // Different validation rules for different types
  switch (type) {
    case 'expert':
      // Expert ID should be alphanumeric, 6-20 characters
      return /^[A-Za-z0-9]{6,20}$/.test(id.trim());
    case 'vendor':
      // Vendor ID should be alphanumeric with possible hyphens, 5-25 characters
      return /^[A-Za-z0-9-]{5,25}$/.test(id.trim());
    default:
      return true;
  }
};

// Form validation
export const validateForm = (formData, userType) => {
  const errors = {};

  // Name validation
  if (!validateName(formData.name)) {
    errors.name = 'Name must be between 2 and 50 characters';
  }

  // Email validation
  if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = 'Password does not meet requirements';
  }

  // Confirm password validation
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (userType === 'expert') {
    if (!validateYouTubeUrl(formData.youtubeChannel)) {
      errors.youtubeChannel = 'Please enter a valid YouTube channel or profile URL';
    }

    const credentialsFileError = validateExpertDocument(formData.credentialsFile);
    if (credentialsFileError) {
      errors.credentialsFile = credentialsFileError;
    }

    const workEvidenceFileError = validateExpertDocument(formData.workEvidenceFile);
    if (workEvidenceFileError) {
      errors.workEvidenceFile = workEvidenceFileError;
    }

    const idProofFileError = validateExpertDocument(formData.idProofFile, { required: true });
    if (idProofFileError) {
      errors.idProofFile = idProofFileError;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Real-time validation messages
export const getValidationMessage = (field, value, userType) => {
  switch (field) {
    case 'name':
      if (!value) return '';
      if (value.length < 2) return 'Name is too short';
      if (value.length > 50) return 'Name is too long';
      return '';

    case 'email':
      if (!value) return '';
      if (!validateEmail(value)) return 'Invalid email format';
      return '';

    case 'youtubeChannel':
      if (!value) return '';
      if (!validateYouTubeUrl(value)) return 'Enter a valid YouTube channel or profile URL';
      return '';

    default:
      return '';
  }
};