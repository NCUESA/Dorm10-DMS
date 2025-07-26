"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除對應的錯誤
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = "請輸入電子郵件";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "請輸入有效的電子郵件格式";
    }
    
    if (!formData.password) {
      newErrors.password = "請輸入密碼";
    } else if (formData.password.length < 6) {
      newErrors.password = "密碼至少需要6個字符";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 這裡會連接到實際的登錄API
      console.log("登錄數據:", formData);
      
      // 模擬API調用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 登錄成功後的處理
      alert("登錄成功！");
      
    } catch (error) {
      setErrors({ submit: "登錄失敗，請檢查您的憑證" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-4 sm:py-12 px-3 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-sm sm:max-w-md w-full">
        {/* Logo 和標題 */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="flex justify-center mb-2 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: 'var(--primary)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text)' }}>
            登入您的帳號
          </h2>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
            歡迎回到 NCUE 獎助學金資訊平台
          </p>
        </div>

        {/* 登錄表單 */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#fee', color: 'var(--error)', border: '1px solid var(--error)' }}>
                {errors.submit}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                電子郵件
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field"
                placeholder="請輸入您的電子郵件"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="form-error">{errors.email}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input-field"
                placeholder="請輸入您的密碼"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="form-error">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  style={{ accentColor: 'var(--primary)' }}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm" style={{ color: 'var(--text)' }}>
                  記住我
                </label>
              </div>

              <Link
                href="/forgot-password"
                className="text-sm underline-extend"
                style={{ color: 'var(--primary)' }}
              >
                忘記密碼？
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? "登錄中..." : "登入"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white" style={{ color: 'var(--text-muted)' }}>
                  或
                </span>
              </div>
            </div>

            <div className="mt-3 sm:mt-6">
              <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                還沒有帳號？{' '}
                <Link
                  href="/register"
                  className="font-medium underline-extend"
                  style={{ color: 'var(--primary)' }}
                >
                  立即註冊
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
