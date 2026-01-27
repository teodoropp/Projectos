import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

// Tipos de utilizador
type UserType = 'cliente' | 'profissional' | 'empresa' | 'admin';
type VerificationStatus = 'pendente' | 'verificado' | 'rejeitado';

// Interface do utilizador
interface User {
  user_id: string;
  email: string;
  name: string;
  phone?: string;
  photo?: string;
  bi_photo?: string;
  bi_number?: string;
  user_type: UserType;
  verification_status: VerificationStatus;
  company_name?: string;
  company_logo?: string;
  nif?: string;
  province?: string;
  city?: string;
  subscription_plan: string;
  rating: number;
  total_reviews: number;
  total_jobs_completed: number;
  is_active: boolean;
}

// Interface do contexto de autenticação
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string, userType?: UserType, companyName?: string, nif?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Funções auxiliares para armazenamento seguro (compatível com web e mobile)
const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Verificar autenticação ao iniciar
  const checkAuth = async () => {
    try {
      const token = await secureStorage.getItem('session_token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        setUser(response.data);
      }
    } catch (error) {
      console.log('Não autenticado');
      await secureStorage.deleteItem('session_token');
    } finally {
      setIsLoading(false);
    }
  };

  // Login com email e senha
  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, session_token } = response.data;
    
    await secureStorage.setItem('session_token', session_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${session_token}`;
    setUser(userData);
  };

  // Registar novo utilizador
  const register = async (
    email: string, 
    password: string, 
    name: string, 
    phone: string,
    userType: UserType = 'cliente',
    companyName?: string,
    nif?: string
  ) => {
    const response = await api.post('/auth/register', { 
      email, 
      password, 
      name, 
      phone,
      user_type: userType,
      company_name: companyName,
      nif: nif
    });
    const { user: userData, session_token } = response.data;
    
    await secureStorage.setItem('session_token', session_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${session_token}`;
    setUser(userData);
  };

  // Login com Google OAuth
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
        
        // Extrair session_id do hash ou query
        if (url.includes('#session_id=')) {
          sessionId = url.split('#session_id=')[1]?.split('&')[0];
        } else if (url.includes('?session_id=')) {
          sessionId = url.split('?session_id=')[1]?.split('&')[0];
        }
        
        if (sessionId) {
          const response = await api.post('/auth/google/callback', { session_id: sessionId });
          const { user: userData, session_token } = response.data;
          
          await secureStorage.setItem('session_token', session_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${session_token}`;
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Erro no login com Google:', error);
      throw error;
    }
  };

  // Terminar sessão
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.log('Erro ao terminar sessão:', error);
    }
    await secureStorage.deleteItem('session_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Atualizar dados do utilizador
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Erro ao atualizar utilizador:', error);
    }
  };

  // Actualizar perfil do utilizador
  const updateProfile = async (data: Partial<User>) => {
    try {
      await api.put('/users/profile', data);
      await refreshUser();
    } catch (error) {
      console.error('Erro ao actualizar perfil:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, loginWithGoogle, logout, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
