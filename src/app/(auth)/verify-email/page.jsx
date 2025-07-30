"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import LinkButton from "@/components/ui/LinkButton";

function VerifyEmailContent() {
  const router = useRouter();
  const { resendOtp } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState("checking"); // checking, waiting, success, error, expired
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const type = searchParams.get("type");
    const emailParam = searchParams.get("email");
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    if (token && type === 'signup') {
      verifyEmailToken(token);
    } else if (token) {
      // 處理其他類型的驗證
      verifyEmailToken(token);
    } else {
      setVerificationStatus("waiting");
      setMessage("請檢查您的電子郵件收件箱，點擊郵件中的驗證連結來完成註冊");
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const verifyEmailToken = async (token) => {
    try {
      setVerificationStatus("checking");
      
      // 這裡應該調用驗證 token 的 API
      // 暫時模擬驗證過程
      const result = await fetch('/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      if (result.ok) {
        setVerificationStatus("success");
        setMessage("電子郵件驗證成功！您現在可以正常使用所有功能。");
        
        // 3秒後自動跳轉到登入頁面
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        const errorData = await result.json();
        if (errorData.error?.includes('expired')) {
          setVerificationStatus("expired");
          setMessage("驗證連結已過期，請重新申請驗證郵件");
        } else {
          setVerificationStatus("error");
          setMessage(errorData.error || "驗證失敗，請聯繫管理員");
        }
      }
      
    } catch (error) {
      setVerificationStatus("error");
      setMessage("驗證過程中發生錯誤，請稍後再試");
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || !email) return;
    
    setIsResending(true);
    try {
      const result = await resendOtp(email, 'signup');
      
      if (result.success) {
        setMessage("驗證郵件已重新發送！請檢查您的收件箱。");
        setResendCooldown(60); // 60秒冷卻時間
      } else {
        setMessage(`重新發送失敗: ${result.error}`);
      }
    } catch (error) {
      setMessage("重新發送驗證郵件時發生錯誤");
    } finally {
      setIsResending(false);
    }
  };

  // 成功狀態
  if (verificationStatus === "success") {
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
              驗證成功！
            </h2>
            
            <div className="p-4 rounded-lg mb-4 sm:mb-6" style={{ backgroundColor: '#e8f5e8', color: '#2d5f2d', border: '1px solid #4caf50' }}>
              {message}
            </div>

            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              正在跳轉到登入頁面...
            </p>
            
            <LinkButton href="/login" className="w-full">
              立即登入
            </LinkButton>
          </div>
        </div>
      </div>
    );
  }

  // 驗證中狀態
  if (verificationStatus === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center py-4 sm:py-12 px-3 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-sm md:max-w-lg lg:max-w-xl w-full">
          <div className="card text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3" style={{ color: 'var(--text)' }}>
              驗證中...
            </h2>
            
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              正在驗證您的電子郵件，請稍候
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 錯誤或過期狀態
  if (verificationStatus === "error" || verificationStatus === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center py-4 sm:py-12 px-3 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
        <div className="max-w-sm md:max-w-lg lg:max-w-xl w-full">
          <div className="card text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3" style={{ color: 'var(--text)' }}>
              {verificationStatus === "expired" ? "驗證連結已過期" : "驗證失敗"}
            </h2>
            
            <div className="p-4 rounded-lg mb-4 sm:mb-6" style={{ backgroundColor: '#fee', color: 'var(--error)', border: '1px solid var(--error)' }}>
              {message}
            </div>

            <div className="space-y-3">
              {email && (
                <Button
                  onClick={handleResendEmail}
                  disabled={resendCooldown > 0 || isResending}
                  loading={isResending}
                  className="w-full"
                >
                  {isResending ? "發送中..." : resendCooldown > 0 ? `重新發送 (${resendCooldown}s)` : "重新發送驗證郵件"}
                </Button>
              )}
              
              <LinkButton href="/register" variant="secondary" className="w-full">
                返回註冊頁面
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 等待郵件驗證狀態
  return (
    <div className="min-h-screen flex items-center justify-center py-4 sm:py-12 px-3 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-sm md:max-w-lg lg:max-w-xl w-full">
        <div className="text-center mb-4 sm:mb-8">
          <div className="flex justify-center mb-2 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text)' }}>
            驗證電子郵件
          </h2>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
            請檢查您的電子郵件收件箱，點擊郵件中的驗證連結來完成註冊
          </p>
        </div>

        <div className="card">
          {message && (
            <div className="p-4 rounded-lg mb-6" style={{ 
              backgroundColor: message.includes('成功') || message.includes('發送') ? '#e8f5e8' : '#e3f2fd', 
              color: message.includes('成功') || message.includes('發送') ? '#2d5f2d' : '#1565c0', 
              border: `1px solid ${message.includes('成功') || message.includes('發送') ? '#4caf50' : '#1976d2'}` 
            }}>
              {message}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-2" style={{ color: 'var(--primary)' }}>
              📧 接下來該怎麼做？
            </h3>
            <ol className="text-sm text-left space-y-2" style={{ color: 'var(--text-muted)' }}>
              <li>1. 檢查您的電子郵件收件箱（包含垃圾郵件夾）</li>
              <li>2. 找到來自 NCUE 獎助學金平台的驗證郵件</li>
              <li>3. 點擊郵件中的「驗證電子郵件」按鈕或連結</li>
              <li>4. 完成驗證後即可正常登入使用</li>
            </ol>
          </div>

          <div className="space-y-4">
            {email && (
              <div className="form-group">
                <label className="form-label">驗證郵件已發送到：</label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <span className="font-medium" style={{ color: 'var(--text)' }}>{email}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {email && (
                <Button
                  variant="secondary"
                  onClick={handleResendEmail}
                  disabled={resendCooldown > 0 || isResending}
                  loading={isResending}
                  className="w-full"
                >
                  {isResending ? "發送中..." : resendCooldown > 0 ? `重新發送 (${resendCooldown}s)` : "重新發送驗證郵件"}
                </Button>
              )}
              
              <LinkButton href="/login" className="w-full">
                前往登入頁面
              </LinkButton>
              
              <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                <Link
                  href="/register"
                  className="font-medium underline-extend"
                  style={{ color: 'var(--primary)' }}
                >
                  返回註冊頁面
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
