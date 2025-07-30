"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import LinkButton from "@/components/ui/LinkButton";

export default function ForgotPassword() {
  const router = useRouter();
  const { resetPassword, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // 如果已經登入，重定向到個人資料頁面
    if (isAuthenticated) {
      router.push('/profile');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e) => {
    setEmail(e.target.value);
    // 清除錯誤
    if (errors.email) {
      setErrors({});
    }
    // 清除訊息
    if (message) {
      setMessage("");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = "請輸入電子郵件";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "請輸入有效的電子郵件格式";
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
      const result = await resetPassword(email);
      
      if (result.success) {
        setIsSuccess(true);
        setMessage("密碼重設郵件已發送到您的信箱，請檢查您的電子郵件並按照指示重設密碼。");
      } else {
        setErrors({ submit: result.error });
      }
      
    } catch (error) {
      setErrors({ submit: "發送重設郵件失敗，請檢查您的網路連線" });
    } finally {
      setIsLoading(false);
    }
  };

  // 成功頁面
  if (isSuccess) {
    return (
      <div className="flex items-center justify-center py-4 sm:py-12 px-3 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-sm md:max-w-lg lg:max-w-xl w-full">
          <div className="card text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3" style={{ color: 'var(--text)' }}>
              郵件已發送
            </h2>
            
            <div className="p-4 rounded-lg mb-4 sm:mb-6" style={{ backgroundColor: '#e8f5e8', color: '#2d5f2d', border: '1px solid #4caf50' }}>
              {message}
            </div>
            
            <p className="text-sm sm:text-base mb-4 sm:mb-6" style={{ color: 'var(--text-muted)' }}>
              如果您沒有收到郵件，請檢查垃圾郵件資料夾，或稍後再試一次。
            </p>
            
            <div className="space-y-3">
              <LinkButton
                href="/login"
                className="w-full"
              >
                返回登入頁面
              </LinkButton>
              
              <Button
                variant="secondary"
                onClick={() => {
                  setIsSuccess(false);
                  setMessage("");
                  setEmail("");
                }}
                className="w-full"
              >
                重新發送
              </Button>
            </div>
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
    <div className="flex items-center justify-center py-4 sm:py-12 px-3 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
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
            忘記密碼
          </h2>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
            請輸入您的電子郵件地址，我們將發送密碼重設連結給您
          </p>
        </div>

        {/* 忘記密碼表單 */}
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
                placeholder="請輸入您註冊時使用的電子郵件"
                value={email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="form-error">{errors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              className="w-full"
            >
              {isLoading ? "發送中..." : "發送重設連結"}
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

            <div className="mt-6 space-y-3">
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
