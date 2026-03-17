import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Clear all authentication data
  const clearAuthData = () => {
    localStorage.removeItem('urbansprout_token');
    localStorage.removeItem('urbansprout_user');
    localStorage.removeItem('firebase_token');
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    const restoreSession = async () => {
      // Check for existing authentication data on app start
      const savedToken = localStorage.getItem('urbansprout_token');
      const savedUser = localStorage.getItem('urbansprout_user');
      
      if (savedToken && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          
          // Validate token by making a test API call
          try {
            const response = await fetch(`http://localhost:5001/api/auth/profile`, {
              headers: {
                'Authorization': `Bearer ${savedToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              // Token is valid, restore session
              setUser(userData);
              setToken(savedToken);
              console.log('User session restored from localStorage');
            } else {
              // Token is invalid, clear auth data
              console.log('Token expired or invalid, clearing auth data');
              clearAuthData();
            }
          } catch (error) {
            // Network error or token validation failed
            console.log('Token validation failed, clearing auth data');
            clearAuthData();
          }
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          clearAuthData();
        }
      }
      
      setLoading(false);
    };

    restoreSession();

    // Listen for Firebase auth state changes (for Google sign-in)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !user) {
        // User signed in with Firebase, but we already have a session
        // Don't override existing session
        console.log('Firebase user detected, but maintaining existing session');
      } else if (!firebaseUser && user) {
        // Firebase user signed out, but we have a session
        // Keep the existing session unless explicitly logged out
        console.log('Firebase user signed out, maintaining existing session');
      }
    });

    return () => unsubscribe();
  }, []);

  const login = (userData, authToken) => {
    // Check if user has a saved profile photo
    const savedUser = localStorage.getItem('urbansprout_user');
    let finalUserData = userData;
    
    if (savedUser) {
      try {
        const parsedSavedUser = JSON.parse(savedUser);
        // Preserve profile photo if it exists
        if (parsedSavedUser.profilePhoto && !userData.profilePhoto) {
          finalUserData = { ...userData, profilePhoto: parsedSavedUser.profilePhoto };
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
      }
    }
    
    setUser(finalUserData);
    setToken(authToken);
    localStorage.setItem('urbansprout_token', authToken);
    localStorage.setItem('urbansprout_user', JSON.stringify(finalUserData));
  };

  const updateProfile = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    
    // Store user data with avatar URL (not base64 data)
    const userDataForStorage = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      preferences: updatedUser.preferences,
      displayName: updatedUser.displayName,
      avatar: updatedUser.avatar, // Store URL, not base64
      hasProfilePhoto: updatedUser.hasProfilePhoto
    };
    
    try {
      localStorage.setItem('urbansprout_user', JSON.stringify(userDataForStorage));
    } catch (error) {
      console.error('Failed to save user data to localStorage:', error);
      // Clear old data and try again with minimal data
      localStorage.removeItem('urbansprout_user');
      const minimalUserData = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      };
      localStorage.setItem('urbansprout_user', JSON.stringify(minimalUserData));
    }
    
    return updatedUser;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    
    // Clear all authentication-related data
    localStorage.removeItem('urbansprout_token');
    localStorage.removeItem('urbansprout_user');
    localStorage.removeItem('firebase_token');
    localStorage.removeItem('rememberedEmail');
    
    // Clear any cart/wishlist data for the logged-out user
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('cart_') || key.startsWith('wishlist_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Sign out from Firebase if user was signed in with Google
    try {
      await signOut(auth);
      console.log('Firebase user signed out');
    } catch (error) {
      console.log('No Firebase user to sign out or error:', error);
    }
    
    console.log('User logged out and all data cleared');
  };

  // Development helper to force clear all data
  const clearAllData = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    console.log('All localStorage data cleared');
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateProfile,
    clearAllData,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isVendor: user?.role === 'vendor',
    isExpert: user?.role === 'expert',
    isBeginner: user?.role === 'beginner'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};