// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

  // ID validation for experts and vendors
  if ((userType === 'expert' || userType === 'vendor') && formData.professionalId) {
    if (!validateID(formData.professionalId, userType)) {
      errors.professionalId = `Invalid ${userType} ID format`;
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

    case 'professionalId':
      if (!value) return '';
      if (!validateID(value, userType)) {
        return userType === 'expert' 
          ? 'Expert ID must be 6-20 alphanumeric characters'
          : 'Vendor ID must be 5-25 alphanumeric characters (hyphens allowed)';
      }
      return '';

    default:
      return '';
  }
};