"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, sendEmailOTP, verifyEmailOTP, logoutUser } from './appwrite';

interface User {
  $id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  phone: string;
  phoneVerification: boolean;
  status: boolean;
  labels: string[];
  prefs: Record<string, any>;
  registration: string;
  accessedAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sendOTP: (email: string, showGlobalLoading?: boolean) => Promise<{ userId: string }>;
  verifyOTP: (userId: string, secret: string) => Promise<void>;
  createAccount: (email: string, showGlobalLoading?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshAuthStatus: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  authStep: 'email' | 'otp' | 'authenticated';
  setAuthStep: (step: 'email' | 'otp' | 'authenticated') => void;
  email: string;
  setEmail: (email: string) => void;
  userId: string;
  setUserId: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStep, setAuthStep] = useState<'email' | 'otp' | 'authenticated'>('email');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setAuthStep('authenticated');
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshAuthStatus = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setAuthStep('authenticated');
      } else {
        setUser(null);
        setAuthStep('email');
      }
    } catch (error) {
      console.error('Failed to refresh auth status:', error);
      setUser(null);
      setAuthStep('email');
    } finally {
      setLoading(false);
    }
  };

  const validateSession = async () => {
    try {
      // Check if session is still valid
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setAuthStep('authenticated');
        return true;
      } else {
        setUser(null);
        setAuthStep('email');
        return false;
      }
    } catch (error) {
      console.error('Session validation failed:', error);
      setUser(null);
      setAuthStep('email');
      return false;
    }
  };

  const handleSendOTP = async (email: string, showGlobalLoading: boolean = true) => {
    try {
      if (showGlobalLoading) {
        setLoading(true);
      }
      const token = await sendEmailOTP(email);
      setEmail(email);
      setUserId(token.userId);
      if (showGlobalLoading) {
        setAuthStep('otp');
      }
      return { userId: token.userId };
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    } finally {
      if (showGlobalLoading) {
        setLoading(false);
      }
    }
  };

  const handleVerifyOTP = async (userId: string, secret: string) => {
    try {
      setLoading(true);
      const session = await verifyEmailOTP(userId, secret, email);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setAuthStep('authenticated');
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (email: string, showGlobalLoading: boolean = true) => {
    try {
      if (showGlobalLoading) {
        setLoading(true);
      }
      // For email OTP, we don't need to create user manually
      // createEmailToken automatically creates user if email doesn't exist
      await handleSendOTP(email, showGlobalLoading);
    } catch (error) {
      console.error('Create account error:', error);
      throw error;
    } finally {
      if (showGlobalLoading) {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setAuthStep('email');
      setEmail('');
      setUserId('');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    sendOTP: handleSendOTP,
    verifyOTP: handleVerifyOTP,
    createAccount: handleCreateAccount,
    logout: handleLogout,
    isAuthenticated: !!user,
    refreshAuthStatus,
    validateSession,
    authStep,
    setAuthStep,
    email,
    setEmail,
    userId,
    setUserId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


