const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// API utility function
export const apiCall = async (endpoint, options = {}) => {
  // Ensure no double slashes by removing trailing slash from base URL and leading slash from endpoint
  const baseUrl = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`; // Ensure leading slash
  const url = `${baseUrl}${cleanEndpoint}`;
  
  const config = {
    headers: {
      ...options.headers,
    },
    ...options,
  };

  // Only set Content-Type to application/json if body is not FormData
  // FormData needs to set its own Content-Type with boundary
  if (!(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  // Add auth token if available
  const token = localStorage.getItem('urbansprout_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('urbansprout_token');
        localStorage.removeItem('urbansprout_user');
        
        // Redirect to login if it's a user not found error
        if (data.code === 'USER_NOT_FOUND') {
          window.location.href = '/login';
        }
      }
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  // Register user
  register: (userData) => 
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // Login user
  login: (credentials) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Google sign in (legacy)
  googleSignIn: (googleData) =>
    apiCall('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData),
    }),

  // Firebase ID token verification (preferred)
  firebaseAuth: (payload) =>
    apiCall('/auth/firebase-auth', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Get user profile
  getProfile: () => apiCall('/auth/profile'),

  // Update profile
  updateProfile: (profileData) =>
    apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  // Change password
  changePassword: (passwordData) =>
    apiCall('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    }),

  // Update preferences
  updatePreferences: (preferences) =>
    apiCall('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),

  // Forgot password
  forgotPassword: (emailData) =>
    apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(emailData),
    }),

  // Reset password
  resetPassword: (resetData) =>
    apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(resetData),
    }),
};

export default apiCall;