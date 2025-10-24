const { AppError } = require('./errorHandler');

// Validate email format
const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Validate password strength
const validatePassword = (password) => {
  // At least 8 characters, contains uppercase, lowercase, number, and special character
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
};

// Validate registration data
const validateRegistration = (req, res, next) => {
  const { name, email, password, role, professionalId } = req.body;

  // Check required fields
  if (!name || !email || !password) {
    return next(new AppError('Name, email, and password are required', 400));
  }

  // Validate name length
  if (name.trim().length < 2 || name.trim().length > 50) {
    return next(new AppError('Name must be between 2 and 50 characters', 400));
  }

  // Validate email format
  if (!validateEmail(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  // Validate password strength
  if (!validatePassword(password)) {
    return next(new AppError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character', 400));
  }

  // Validate role
  const validRoles = ['beginner', 'expert', 'vendor', 'admin'];
  if (role && !validRoles.includes(role)) {
    return next(new AppError('Invalid role specified', 400));
  }

  // Validate professional ID for experts and vendors
  if ((role === 'expert' || role === 'vendor') && professionalId) {
    if (role === 'expert' && !/^[A-Za-z0-9]{6,20}$/.test(professionalId.trim())) {
      return next(new AppError('Expert ID must be 6-20 alphanumeric characters', 400));
    }
    if (role === 'vendor' && !/^[A-Za-z0-9-]{5,25}$/.test(professionalId.trim())) {
      return next(new AppError('Vendor ID must be 5-25 alphanumeric characters (hyphens allowed)', 400));
    }
  }

  next();
};

// Validate login data
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  // Check required fields
  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  // Validate email format
  if (!validateEmail(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  next();
};

// Validate plant data
const validatePlant = (req, res, next) => {
  const { name, description, category, difficulty, price } = req.body;

  // Check required fields
  if (!name || !description || !category || !difficulty || price === undefined) {
    return next(new AppError('Name, description, category, difficulty, and price are required', 400));
  }

  // Validate name length
  if (name.trim().length < 2 || name.trim().length > 100) {
    return next(new AppError('Plant name must be between 2 and 100 characters', 400));
  }

  // Validate description length
  if (description.trim().length < 10 || description.trim().length > 1000) {
    return next(new AppError('Description must be between 10 and 1000 characters', 400));
  }

  // Validate category
  const validCategories = ['indoor', 'outdoor', 'succulents', 'herbs', 'flowering', 'foliage'];
  if (!validCategories.includes(category.toLowerCase())) {
    return next(new AppError('Invalid category. Must be one of: ' + validCategories.join(', '), 400));
  }

  // Validate difficulty
  const validDifficulties = ['beginner', 'intermediate', 'advanced'];
  if (!validDifficulties.includes(difficulty.toLowerCase())) {
    return next(new AppError('Invalid difficulty. Must be one of: ' + validDifficulties.join(', '), 400));
  }

  // Validate price
  if (isNaN(price) || price < 0) {
    return next(new AppError('Price must be a valid positive number', 400));
  }

  next();
};

// Validate blog post data
const validateBlogPost = (req, res, next) => {
  const { title, excerpt, content, category } = req.body;

  // Check required fields
  if (!title || !excerpt || !content || !category) {
    return next(new AppError('Title, excerpt, content, and category are required', 400));
  }

  // Validate title length
  if (title.trim().length < 5 || title.trim().length > 200) {
    return next(new AppError('Title must be between 5 and 200 characters', 400));
  }

  // Validate excerpt length
  if (excerpt.trim().length < 10 || excerpt.trim().length > 300) {
    return next(new AppError('Excerpt must be between 10 and 300 characters', 400));
  }

  // Validate content length
  if (content.trim().length < 100) {
    return next(new AppError('Content must be at least 100 characters long', 400));
  }

  // Validate category
  const validCategories = [
    'beginner-tips', 'urban-gardening', 'plant-care', 'plant-science',
    'diy', 'troubleshooting', 'seasonal-care', 'indoor-plants',
    'outdoor-plants', 'tools-equipment'
  ];
  if (!validCategories.includes(category.toLowerCase())) {
    return next(new AppError('Invalid category. Must be one of: ' + validCategories.join(', '), 400));
  }

  next();
};

// Validate order data
const validateOrder = (req, res, next) => {
  const { items, shippingAddress, billingAddress } = req.body;

  // Check required fields
  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError('Order must contain at least one item', 400));
  }

  if (!shippingAddress || !billingAddress) {
    return next(new AppError('Shipping and billing addresses are required', 400));
  }

  // Validate items
  for (const item of items) {
    if (!item.plant || !item.quantity || !item.price) {
      return next(new AppError('Each item must have plant, quantity, and price', 400));
    }

    if (item.quantity < 1) {
      return next(new AppError('Item quantity must be at least 1', 400));
    }

    if (item.price < 0) {
      return next(new AppError('Item price cannot be negative', 400));
    }
  }

  // Validate addresses
  const requiredAddressFields = ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
  
  for (const field of requiredAddressFields) {
    if (!shippingAddress[field] || !billingAddress[field]) {
      return next(new AppError(`${field} is required in both shipping and billing addresses`, 400));
    }
  }

  next();
};

// Validate MongoDB ObjectId
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return next(new AppError('Invalid ID format', 400));
  }

  next();
};

// Validate pagination parameters
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  // Convert to numbers
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  // Validate page number
  if (isNaN(pageNum) || pageNum < 1) {
    return next(new AppError('Page must be a positive integer', 400));
  }

  // Validate limit
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return next(new AppError('Limit must be between 1 and 100', 400));
  }

  // Add validated values to request
  req.pagination = {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum
  };

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validatePlant,
  validateBlogPost,
  validateOrder,
  validateObjectId,
  validatePagination,
  validateEmail,
  validatePassword
};