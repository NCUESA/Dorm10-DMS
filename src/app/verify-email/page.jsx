"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmail() {
  const [verificationStatus, setVerificationStatus] = useState("verifying"); // verifying, success, error, expired
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    if (token) {
      verifyEmailToken(token);
    } else {
      setVerificationStatus("error");
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
      // 模擬API調用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 這裡會連接到實際的驗證API
      console.log("驗證token:", token);
      
      // 模擬驗證結果
      const random = Math.random();
      if (random > 0.7) {
        setVerificationStatus("expired");
      } else if (random > 0.3) {
        setVerificationStatus("success");
      } else {
        setVerificationStatus("error");
      }
    } catch (error) {
      setVerificationStatus("error");
    }
  };

  const resendVerificationEmail = async () => {
    if (resendCooldown > 0) return;
    
    try {
      // 這裡會連接到重新發送驗證郵件的API
      console.log("重新發送驗證郵件到:", email);
      
      // 模擬API調用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert("驗證郵件已重新發送！請檢查您的收件箱。");
      setResendCooldown(60); // 60秒冷卻時間
      
    } catch (error) {
      alert("發送失敗，請稍後再試");
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case "verifying":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              正在驗證您的電子郵件...
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              請稍候，我們正在驗證您的電子郵件地址。
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              電子郵件驗證成功！
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
              您的帳號已成功啟用，現在可以使用所有功能了。
            </p>
            <Link href="/login" className="btn-primary">
              立即登入
            </Link>
          </div>
        );

      case "expired":
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              驗證連結已過期
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
              此驗證連結已過期，請重新發送驗證郵件。
            </p>
            {email && (
              <div className="mb-6">
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  將重新發送驗證郵件到: <strong>{email}</strong>
                </p>
                <button
                  onClick={resendVerificationEmail}
                  disabled={resendCooldown > 0}
                  className="btn-primary"
                >
                  {resendCooldown > 0 ? `重新發送 (${resendCooldown}s)` : "重新發送驗證郵件"}
                </button>
              </div>
            )}
            <Link href="/register" className="btn-secondary">
              重新註冊
            </Link>
          </div>
        );

      case "error":
      default:
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              驗證失敗
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
              驗證連結無效或已損壞，請聯繫客服或重新註冊。
            </p>
            <div className="space-x-4">
              <Link href="/register" className="btn-primary">
                重新註冊
              </Link>
              <Link href="/contact" className="btn-secondary">
                聯繫客服
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-md w-full">
        <div className="card">
          {renderContent()}
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
