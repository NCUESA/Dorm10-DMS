"use client";

// 客戶端認證工具函數
export const authUtils = {
  // 設置認證 cookies
  login: (userInfo, token = 'mock-token') => {
    // 設置 httpOnly cookies 的替代方案：使用 document.cookie
    document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Strict`;
    document.cookie = `user-info=${encodeURIComponent(JSON.stringify(userInfo))}; path=/; max-age=86400; SameSite=Strict`;
    
    // 重新載入頁面以觸發 middleware
    window.location.reload();
  },

  // 清除認證 cookies
  logout: () => {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user-info=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // 重定向到首頁
    window.location.href = '/';
  },

  // 從 cookies 中獲取用戶信息
  getUserInfo: () => {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const userInfoCookie = cookies.find(cookie => 
      cookie.trim().startsWith('user-info=')
    );
    
    if (!userInfoCookie) return null;
    
    try {
      const userInfoValue = userInfoCookie.split('=')[1];
      return JSON.parse(decodeURIComponent(userInfoValue));
    } catch (error) {
      console.error('Failed to parse user info from cookie:', error);
      return null;
    }
  },

  // 檢查是否已登入
  isAuthenticated: () => {
    if (typeof document === 'undefined') return false;
    
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => 
      cookie.trim().startsWith('auth-token=')
    );
    
    return !!tokenCookie && tokenCookie.split('=')[1] !== '';
  }
};
