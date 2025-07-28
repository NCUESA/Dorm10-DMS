"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/lib/supabase/auth';

const AuthContext = createContext({});

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
  const [error, setError] = useState(null);

  useEffect(() => {
    // 初始化用戶狀態
    const initializeAuth = async () => {
      try {
        const result = await authService.getCurrentUser();
        if (result.success && result.user) {
          setUser(result.user);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 監聽認證狀態變化
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // 獲取完整的用戶資料包括profile
        const result = await authService.getCurrentUser();
        if (result.success) {
          setUser(result.user);
        } else {
          setUser(session.user);
        }
        setError(null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setError(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // 刷新時也需要獲取完整資料
        const result = await authService.getCurrentUser();
        if (result.success) {
          setUser(result.user);
        } else {
          setUser(session.user);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, userData = {}) => {
    setError(null);
    const result = await authService.signUp(email, password, userData);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  };

  const signIn = async (email, password) => {
    setError(null);
    const result = await authService.signIn(email, password);
    if (result.success) {
      // 獲取完整的用戶資料包括profile
      const userResult = await authService.getCurrentUser();
      if (userResult.success) {
        setUser(userResult.user);
      } else {
        setUser(result.data.user);
      }
    } else {
      setError(result.error);
    }
    return result;
  };

  const signOut = async () => {
    setError(null);
    const result = await authService.signOut();
    if (result.success) {
      setUser(null);
    } else {
      setError(result.error);
    }
    return result;
  };

  const resetPassword = async (email) => {
    setError(null);
    const result = await authService.resetPassword(email);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  };

  const updatePassword = async (password) => {
    setError(null);
    const result = await authService.updatePassword(password);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  };

  const verifyOtp = async (email, token, type = 'email') => {
    setError(null);
    const result = await authService.verifyOtp(email, token, type);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  };

  const resendOtp = async (email, type = 'signup') => {
    setError(null);
    const result = await authService.resendOtp(email, type);
    if (!result.success) {
      setError(result.error);
    }
    return result;
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    verifyOtp,
    resendOtp,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.profile?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
