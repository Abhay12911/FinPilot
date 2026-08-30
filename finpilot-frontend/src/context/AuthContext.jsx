import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiRegister, apiGetMe } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'finpilot_user';

function saveUser(userData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
}

function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadUser();
    if (stored?.token) {
      setUser(stored); 
      
      apiGetMe()
        .then((me) => {
          const refreshed = { ...stored, ...me };
          saveUser(refreshed);
          setUser(refreshed);
        })
        .catch(() => {
          clearUser();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await apiLogin(email, password); 
    const userData = {
      email,
      name: email.split('@')[0],
      token: data.access_token,
    };
    saveUser(userData);
    setUser(userData);
    return userData;
  };

  const signup = async (email, password, name, role) => {
    await apiRegister(email, password); 
    
    const userData = await login(email, password);
    
    const enriched = { ...userData, name: name || userData.name, role };
    saveUser(enriched);
    setUser(enriched);
    return enriched;
  };

  const logout = () => {
    clearUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
