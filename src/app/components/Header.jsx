"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuthFromHeaders } from "../hooks/useAuth";
import logo from "../assets/logo.png";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoggedIn, userInfo, logout, isLoading } = useAuthFromHeaders();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  // 處理鍵盤導航
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  };

  // 如果還在載入中，顯示載入狀態
  if (isLoading) {
    return (
      <header className="header-fixed">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo 區域 */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link 
                href="/" 
                className="flex items-center space-x-2 sm:space-x-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1"
                aria-label="回到首頁"
              >
                <Image
                  src={logo}
                  alt="NCUE Logo"
                  width={48}
                  height={48}
                  className="h-8 w-8 sm:h-12 sm:w-12"
                  priority
                />
                <h1 className="font-bold" style={{ color: 'var(--primary)' }}>
                  <span className="text-sm sm:hidden">NCUE</span>
                  <span className="text-base hidden sm:block lg:text-xl">NCUE 獎助學金資訊平台</span>
                </h1>
              </Link>
            </div>
            
            {/* 載入中的骨架屏 */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* 手機版選單按鈕 */}
            <div className="md:hidden">
              <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`header-fixed ${isMenuOpen ? 'menu-open' : ''}`} onKeyDown={handleKeyDown}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo 區域 */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link 
              href="/" 
              className="flex items-center space-x-2 sm:space-x-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1"
              aria-label="回到首頁"
            >
              <Image
                src={logo}
                alt="NCUE Logo"
                width={48}
                height={48}
                className="h-8 w-8 sm:h-12 sm:w-12"
                priority
              />
              <h1 className="font-bold" style={{ color: 'var(--primary)' }}>
                <span className="text-sm sm:hidden">NCUE</span>
                <span className="text-base hidden sm:block lg:text-xl">NCUE 獎助學金資訊平台</span>
              </h1>
            </Link>
          </div>

          {/* 桌面版導航選單 */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6" role="navigation" aria-label="主要導航">
            <Link 
              href="/" 
              className="nav-link active underline-extend navbar-link"
              aria-current="page"
            >
              首頁
            </Link>
            <Link 
              href="/ai-assistant" 
              className="nav-link underline-extend navbar-link"
            >
              AI 獎學金助理
            </Link>
            
            {!isLoggedIn ? (
              // 未登入狀態的導航項目
              <>
                <Link 
                  href="/login" 
                  className="nav-link underline-extend navbar-link"
                >
                  登入
                </Link>
                <Link 
                  href="/register" 
                  className="nav-link underline-extend navbar-link"
                >
                  註冊
                </Link>
              </>
            ) : (
              // 已登入狀態的導航項目
              <>
                <Link 
                  href="/manage" 
                  className="nav-link underline-extend navbar-link"
                >
                  管理後台
                </Link>
                <div className="relative group">
                  <button 
                    className="flex items-center space-x-2 nav-link navbar-link hover:text-primary focus:outline-none"
                    aria-label="用戶選單"
                  >
                    <span>Hi, {userInfo?.name || '使用者'}</span>
                    <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* 下拉選單 */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                      >
                        個人資料
                      </Link>
                      <Link 
                        href="/my-scholarships" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                      >
                        我的申請
                      </Link>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button 
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors"
                        onClick={handleLogout}
                      >
                        登出
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </nav>

          {/* 手機版選單按鈕 */}
          <div className="md:hidden">
            <button
              type="button"
              className="relative text-muted hover:text-primary hover:bg-blue-50 focus:outline-none rounded-lg p-2 transition-all duration-300 hover:scale-110"
              aria-label={isMenuOpen ? "關閉選單" : "開啟選單"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              onClick={toggleMenu}
            >
              <span className="sr-only">{isMenuOpen ? "關閉選單" : "開啟選單"}</span>
              {/* 漢堡選單圖示 */}
              <div className="relative w-6 h-6">
                <span
                  className={`absolute left-0 top-1 w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                    isMenuOpen ? 'rotate-45 top-2.5' : ''
                  }`}
                />
                <span
                  className={`absolute left-0 top-2.5 w-6 h-0.5 bg-current transition-all duration-300 ease-in-out ${
                    isMenuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`absolute left-0 top-4 w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                    isMenuOpen ? '-rotate-45 top-2.5' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 手機版選單 */}
      <div
        id="mobile-menu"
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isMenuOpen ? (isLoggedIn ? 'max-h-80 opacity-100' : 'max-h-64 opacity-100') : 'max-h-0 opacity-0'
        }`}
        style={{
          background: 'rgba(248, 249, 250, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: isMenuOpen ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
        }}
      >
        <div className="px-3 pt-2 pb-4 space-y-1">
          <Link 
            href="/" 
            className="block w-full text-center px-4 py-3 text-primary font-medium rounded-lg hover:bg-blue-100 hover:shadow-sm focus:outline-none transition-all duration-300 transform hover:scale-[1.02]"
            onClick={closeMenu}
            aria-current="page"
          >
            首頁
          </Link>
          <Link 
            href="/ai-assistant" 
            className="block w-full text-center px-4 py-3 hover:text-primary hover:bg-blue-100 hover:shadow-sm rounded-lg focus:outline-none transition-all duration-300 transform hover:scale-[1.02]"
            style={{ color: 'var(--text-muted)' }}
            onClick={closeMenu}
          >
            AI 獎學金助理
          </Link>
          
          {!isLoggedIn ? (
            // 未登入狀態的手機版導航項目
            <>
              <Link 
                href="/login" 
                className="block w-full text-center px-4 py-3 hover:text-primary hover:bg-blue-100 hover:shadow-sm rounded-lg focus:outline-none transition-all duration-300 transform hover:scale-[1.02]"
                style={{ color: 'var(--text-muted)' }}
                onClick={closeMenu}
              >
                登入
              </Link>
              <Link 
                href="/register" 
                className="block w-full text-center px-4 py-3 hover:text-primary hover:bg-blue-100 hover:shadow-sm rounded-lg focus:outline-none transition-all duration-300 transform hover:scale-[1.02]"
                style={{ color: 'var(--text-muted)' }}
                onClick={closeMenu}
              >
                註冊
              </Link>
            </>
          ) : (
            // 已登入狀態的手機版導航項目
            <>
              <Link 
                href="/manage" 
                className="block w-full text-center px-4 py-3 hover:text-primary hover:bg-blue-100 hover:shadow-sm rounded-lg focus:outline-none transition-all duration-300 transform hover:scale-[1.02]"
                style={{ color: 'var(--text-muted)' }}
                onClick={closeMenu}
              >
                管理後台
              </Link>
              <Link 
                href="/profile" 
                className="block w-full text-center px-4 py-3 hover:text-primary hover:bg-blue-100 hover:shadow-sm rounded-lg focus:outline-none transition-all duration-300 transform hover:scale-[1.02]"
                style={{ color: 'var(--text-muted)' }}
                onClick={closeMenu}
              >
                個人資料
              </Link>
              <Link 
                href="/my-scholarships" 
                className="block w-full text-center px-4 py-3 hover:text-primary hover:bg-blue-100 hover:shadow-sm rounded-lg focus:outline-none transition-all duration-300 transform hover:scale-[1.02]"
                style={{ color: 'var(--text-muted)' }}
                onClick={closeMenu}
              >
                我的申請
              </Link>
              
              {/* 用戶資訊和登出 */}
              <div className="border-t border-gray-300 mt-2 pt-2">
                <div className="text-center text-sm text-gray-600 py-2">
                  Hi, {userInfo?.name || '使用者'}
                </div>
                <button 
                  className="block w-full text-center px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 hover:shadow-sm rounded-lg focus:outline-none transition-all duration-300 transform hover:scale-[1.02]"
                  onClick={handleLogout}
                >
                  登出
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
