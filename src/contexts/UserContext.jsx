// UserContext.js
// Client-side user management with localStorage persistence

import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  // Initialize from localStorage if available
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Check session on mount (verify with server)
  useEffect(() => {
    checkSession();
  }, []);

  // Save to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Check if user is still logged in on server
  const checkSession = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${API_URL}/api/check-session`, {
        credentials: 'include' // Send session cookie
      });

      const data = await res.json();

      if (data.loggedIn && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      // Keep local user data on network error
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store user data client-side
    const userData = {
      email: data.user.email,
      first_name: data.user.first_name,
      last_name: data.user.last_name,
      accounts: data.accounts,
      loginTime: new Date().toISOString()
    };

    // ✅ If single account, set client_id and level automatically
    if (data.accounts.length === 1) {
      userData.client_id = data.accounts[0].client_id;
      userData.level = data.accounts[0].level;
    }

    setUser(userData);
    return data;
  };

  // Logout function
  const logout = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      await fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear client-side data regardless of server response
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('client_id');
    }
  };

  // Select which account to use (if multiple)
  const selectClient = async (client_id) => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    
    const res = await fetch(`${API_URL}/api/select-client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id }),
      credentials: 'include'
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to select client');
    }

    // ✅ Find the selected account and get its level
    const selectedAccount = user.accounts.find(acc => acc.client_id === client_id);

    // Update local user data
    setUser(prev => ({
      ...prev,
      client_id: client_id,
      level: selectedAccount?.level || prev.level
    }));

    localStorage.setItem('client_id', client_id);
    return data;
  };

  // Update user data
  const updateUser = (updates) => {
    setUser(prev => ({
      ...prev,
      ...updates
    }));
  };

  const value = {
    user,              // Current user data
    isLoading,         // Loading state
    login,             // Login function
    logout,            // Logout function
    selectClient,      // Select account
    updateUser,        // Update user data
    isLoggedIn: !!user // Boolean helper
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export default UserContext;