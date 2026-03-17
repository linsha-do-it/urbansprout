// Prefer env-configured API base, otherwise default to same host on port 5001.
// This avoids malformed URLs like ":5001/..." when hostname resolution is odd.
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5001/api`
    : 'http://localhost:5001/api');

// API utility function
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
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
        // Only clear tokens if we actually had one (to avoid clearing during initial load)
        const existingToken = localStorage.getItem('urbansprout_token');
        if (existingToken) {
          // Check if it's a user not found error (only then redirect)
          if (data.code === 'USER_NOT_FOUND') {
            localStorage.removeItem('urbansprout_token');
            localStorage.removeItem('urbansprout_user');
            window.location.href = '/login';
          }
          // If it's just an expired token, don't clear it everywhere to avoid cascading failures
          // Let individual components handle it
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

// Vendor API functions
export const vendorAPI = {
  // Storefront
  getMyStorefront: (page = 1, limit = 20) =>
    apiCall(`/vendor/store/me?page=${page}&limit=${limit}`),

  getPublicStorefront: (vendorId) =>
    apiCall(`/vendor/store/${vendorId}`),

  getPayUri: (vendorId, amount) =>
    apiCall(`/vendor/store/${vendorId}/pay-uri?amount=${encodeURIComponent(amount)}`),

  /** Public: list vendors with published products (for store directory) */
  getList: () => apiCall('/vendor/list'),

  // Products
  getProducts: (page = 1, limit = 20) =>
    apiCall(`/vendor/products?page=${page}&limit=${limit}`),

  createProduct: (productData) =>
    apiCall('/vendor/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  updateProduct: (productId, productData) =>
    apiCall(`/vendor/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),

  toggleProductAvailability: (productId) =>
    apiCall(`/vendor/products/${productId}/toggle`, {
      method: 'PATCH',
    }),

  deleteProduct: (productId) =>
    apiCall(`/vendor/products/${productId}`, {
      method: 'DELETE',
    }),

  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiCall('/vendor/upload', {
      method: 'POST',
      body: formData,
    });
  },

  /** Save storefront header URL (upload image first via uploadImage, then call this with the returned url) */
  updateStorefrontHeader: (url) =>
    apiCall('/vendor/storefront-header', {
      method: 'PATCH',
      body: JSON.stringify({ url }),
    }),

  // Dashboard (real stats)
  getDashboardStats: () => apiCall('/vendor/dashboard-stats'),

  // Orders
  getOrders: (statusGroup = 'new') =>
    apiCall(`/vendor/orders?statusGroup=${statusGroup}`),
  updateOrderStatus: (vendorOrderId, status) =>
    apiCall(`/vendor/orders/${vendorOrderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Reviews
  getReviews: (page = 1, limit = 20) =>
    apiCall(`/vendor/reviews?page=${page}&limit=${limit}`),

  // Payout details (UPI via Razorpay X)
  getPayoutDetails: () => apiCall('/vendor/payout-details'),
  savePayoutDetails: (upi) =>
    apiCall('/vendor/payout-details', {
      method: 'POST',
      body: JSON.stringify({ upi }),
    }),

  // Payouts
  getPayoutSummary: () =>
    apiCall('/vendor/payouts/summary'),

  getPayoutTransactions: () =>
    apiCall('/vendor/payouts/transactions'),

  // Promos
  createPromo: (promoData) =>
    apiCall('/vendor/promos', {
      method: 'POST',
      body: JSON.stringify(promoData),
    }),

  getPromos: () =>
    apiCall('/vendor/promos'),

  /** Checkout from vendor storefront: items = [{ vendorProductId, quantity }], shippingAddress, paymentMethod */
  vendorCheckout: (payload) =>
    apiCall('/store/vendor-checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// Courses API (expert: create courses, upload cover image)
export const coursesAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiCall('/courses/upload', {
      method: 'POST',
      body: formData,
    });
  },
  /** Expert dashboard stats (real data) */
  getExpertDashboardStats: () => apiCall('/courses/expert/dashboard-stats'),
};

export default apiCall;
