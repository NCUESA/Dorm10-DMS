"use client";

import { useState, useEffect } from 'react';
import { authUtils } from '../utils/auth';

export function useAuthFromHeaders() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 檢查客戶端的認證狀態
    const checkAuthStatus = () => {
      const authenticated = authUtils.isAuthenticated();
      const user = authUtils.getUserInfo();
      
      setIsLoggedIn(authenticated);
      setUserInfo(user);
      setIsLoading(false);
    };

    checkAuthStatus();

    // 監聽 storage 變化（如果在其他標籤頁登入/登出）
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    isLoggedIn,
    userInfo,
    isLoading,
    login: authUtils.login,
    logout: authUtils.logout
  };
}
