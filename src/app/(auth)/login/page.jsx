"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, resetPassword, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // 檢查是否已經登入
    if (!loading && isAuthenticated) {
      // 如果有redirect參數，則重定向到該頁面，否則重定向到個人資料頁面
      const redirectTo = searchParams.get('redirect') || '/profile';
      router.push(redirectTo);
    }
  }, [isAuthenticated, loading, router, searchParams]);

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
    // 清除訊息
    if (message) {
      setMessage("");
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
    setErrors({});
    setMessage("");
    
    try {
      const result = await signIn(formData.email, formData.password);
      
      if (result.success) {
        setMessage("登入成功！正在重定向...");
        setTimeout(() => {
          // 如果有redirect參數，則重定向到該頁面，否則重定向到個人資料頁面
          const redirectTo = searchParams.get('redirect') || '/profile';
          router.push(redirectTo);
        }, 1000);
      } else {
        setErrors({ submit: result.error });
      }
      
    } catch (error) {
      setErrors({ submit: "登入失敗，請檢查您的網路連線" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" flex items-start justify-center py-4 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-sm md:max-w-lg lg:max-w-xl w-full">
        {/* Logo 和標題 */}
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: 'var(--primary)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text)' }}>
            登入您的帳號
          </h2>
          <p className="mt-1 text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
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

            {message && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#e8f5e8', color: '#2d5f2d', border: '1px solid #4caf50' }}>
                {message}
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

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
