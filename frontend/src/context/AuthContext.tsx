import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import api from '../services/api';

interface User {
  user_id: string;
  email: string;
  name: string;
  phone?: string;
  picture?: string;
  role: string;
  is_provider: boolean;
  province?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('session_token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        setUser(response.data);
      }
    } catch (error) {
      console.log('Not authenticated');
      await SecureStore.deleteItemAsync('session_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, session_token } = response.data;
    
    await SecureStore.setItemAsync('session_token', session_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${session_token}`;
    setUser(userData);
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    const response = await api.post('/auth/register', { email, password, name, phone });
    const { user: userData, session_token } = response.data;
    
    await SecureStore.setItemAsync('session_token', session_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${session_token}`;
    setUser(userData);
  };

  const loginWithGoogle = async () => {
    try {
      const redirectUrl = Platform.OS === 'web'
        ? `${process.env.EXPO_PUBLIC_BACKEND_URL}/`
        : Linking.createURL('/');
      
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      
      if (result.type === 'success' && result.url) {
        const url = result.url;
        let sessionId: string | null = null;
        
        // Parse session_id from hash or query
        if (url.includes('#session_id=')) {
          sessionId = url.split('#session_id=')[1]?.split('&')[0];
        } else if (url.includes('?session_id=')) {
          sessionId = url.split('?session_id=')[1]?.split('&')[0];
        }
        
        if (sessionId) {
          const response = await api.post('/auth/google/callback', { session_id: sessionId });
          const { user: userData, session_token } = response.data;
          
          await SecureStore.setItemAsync('session_token', session_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${session_token}`;
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.log('Logout error:', error);
    }
    await SecureStore.deleteItemAsync('session_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
