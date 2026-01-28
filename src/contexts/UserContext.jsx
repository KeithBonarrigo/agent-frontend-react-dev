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
    const storedUser = localStorage.getItem('user');
    
    // If no stored user, we're definitely not logged in
    if (!storedUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      console.log('🔍 Checking session at:', `${API_URL}/api/check-session`);
      const res = await fetch(`${API_URL}/api/check-session`, {
        credentials: 'include'
      });

      const data = await res.json();

      if (data.isAuthenticated && data.user) {
        // Merge server data with localStorage data (server data takes priority)
        const parsedStoredUser = JSON.parse(storedUser);
        setUser({
          ...parsedStoredUser,
          ...data.user
        });
      } else {
        // Server says not authenticated, but we have localStorage data
        // Keep the localStorage data - user might have a valid session that just expired
        // They'll get a 401 on their next API call if truly logged out
        console.log('Server session expired, keeping localStorage user data');
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Session check failed:', error);
      // On network error, trust localStorage
      setUser(JSON.parse(storedUser));
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    console.log('🔐 ============ LOGIN ATTEMPT ============');
    console.log('🔐 API_URL:', API_URL);
    console.log('🔐 Login endpoint:', `${API_URL}/api/login`);
    console.log('🔐 Email:', email);
    console.log('🔐 =======================================');

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
      account_id: data.user.account_id,
      email: data.user.email,
      first_name: data.user.first_name,
      last_name: data.user.last_name,
      accounts: data.accounts,
      loginTime: new Date().toISOString()
    };

    // If single account, set client_id, level, and other fields automatically
    if (data.accounts.length === 1) {
      userData.client_id = data.accounts[0].client_id;
      userData.level = data.accounts[0].level;
      userData.item_id = data.accounts[0].item_id;
      userData.company = data.accounts[0].company;
      userData.current = data.accounts[0].current;
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

    // Find the selected account and get all its data
    const selectedAccount = user.accounts.find(acc => acc.client_id === client_id);

    // Update local user data with all relevant fields
    setUser(prev => ({
      ...prev,
      client_id: client_id,
      level: selectedAccount?.level || prev.level,
      item_id: selectedAccount?.item_id || prev.item_id,
      company: selectedAccount?.company || prev.company,
      current: selectedAccount?.current || prev.current
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
    user,
    isLoading,
    login,
    logout,
    selectClient,
    updateUser,
    isLoggedIn: !!user
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