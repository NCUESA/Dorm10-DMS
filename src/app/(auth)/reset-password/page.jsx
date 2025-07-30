"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import LinkButton from "@/components/ui/LinkButton";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updatePassword, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // 檢查是否有有效的重設令牌
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    // 如果沒有令牌，重定向到忘記密碼頁面
    if (!token) {
      router.push('/forgot-password');
      return;
    }

    // 如果已經登入，重定向到個人資料頁面
    if (isAuthenticated) {
      router.push('/profile');
    }
  }, [token, isAuthenticated, router]);

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
    
    if (!formData.password) {
      newErrors.password = "請輸入新密碼";
    } else if (formData.password.length < 8) {
      newErrors.password = "密碼至少需要8個字符";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "請確認新密碼";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "密碼確認不一致";
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
      const result = await updatePassword(formData.password);
      
      if (result.success) {
        setIsSuccess(true);
        setMessage("密碼重設成功！您現在可以使用新密碼登入了。");
      } else {
        setErrors({ submit: result.error });
      }
      
    } catch (error) {
      setErrors({ submit: "密碼重設失敗，請檢查您的網路連線或重新申請重設連結" });
    } finally {
      setIsLoading(false);
    }
  };

  // 成功頁面
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center py-4 sm:py-12 px-3 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-sm md:max-w-lg lg:max-w-xl w-full">
          <div className="card text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3" style={{ color: 'var(--text)' }}>
              密碼重設成功
            </h2>
            
            <div className="p-4 rounded-lg mb-4 sm:mb-6" style={{ backgroundColor: '#e8f5e8', color: '#2d5f2d', border: '1px solid #4caf50' }}>
              {message}
            </div>
            
            <LinkButton
              href="/login"
              className="w-full"
            >
              立即登入
            </LinkButton>
          </div>
          
          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-sm nav-link underline-extend"
            >
              返回首頁
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-4 sm:py-12 px-3 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-sm md:max-w-lg lg:max-w-xl w-full">
        {/* Logo 和標題 */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="flex justify-center mb-2 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text)' }}>
            重設密碼
          </h2>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
            請輸入您的新密碼
          </p>
        </div>

        {/* 重設密碼表單 */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#fee', color: 'var(--error)', border: '1px solid var(--error)' }}>
                {errors.submit}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                新密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="input-field"
                placeholder="請輸入新密碼（至少8個字符）"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="form-error">{errors.password}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                確認新密碼
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="input-field"
                placeholder="請再次輸入新密碼"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              className="w-full"
            >
              {isLoading ? "重設中..." : "重設密碼"}
            </Button>
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

            <div className="mt-6">
              <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                記起密碼了？{' '}
                <Link
                  href="/login"
                  className="font-medium underline-extend"
                  style={{ color: 'var(--primary)' }}
                >
                  返回登入
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
