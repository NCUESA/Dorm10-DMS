// API 安全工具函數
import { NextResponse } from 'next/server';

// 簡單的記憶體緩存 rate limiter (生產環境建議使用 Redis)
const rateLimitMap = new Map();

export function rateLimit(identifier, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, []);
  }
  
  const requests = rateLimitMap.get(identifier);
  
  // 清除過期的請求記錄
  while (requests.length > 0 && requests[0] < windowStart) {
    requests.shift();
  }
  
  // 檢查是否超過限制
  if (requests.length >= limit) {
    return false;
  }
  
  // 記錄新請求
  requests.push(now);
  return true;
}

export function validateUserInput(data) {
  const errors = [];
  
  if (data.username !== undefined) {
    if (typeof data.username !== 'string') {
      errors.push('使用者名稱必須是字符串');
    } else if (data.username.length < 1 || data.username.length > 50) {
      errors.push('使用者名稱長度必須在1-50字符之間');
    } else if (!/^[a-zA-Z0-9\u4e00-\u9fa5\s]+$/.test(data.username)) {
      errors.push('使用者名稱只能包含字母、數字、中文和空格');
    }
  }
  
  if (data.role !== undefined) {
    if (!['管理員', '一般使用者', 'admin', 'user'].includes(data.role)) {
      errors.push('無效的權限設定');
    }
  }
  
  return errors;
}

export function sanitizeUserData(userData) {
  return {
    ...userData,
    // XSS 防護
    name: userData.name?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''),
    studentId: userData.studentId?.replace(/[<>]/g, ''),
  };
}

// 檢查 IP 是否在允許的範圍內 (可選)
export function isAllowedIP(ip) {
  // 這裡可以加入 IP 白名單邏輯
  // 例如只允許學校內部 IP
  return true;
}

export function logSecurityEvent(event, details) {
  console.log(`[SECURITY] ${new Date().toISOString()} - ${event}:`, details);
}
