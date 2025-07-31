"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, forwardRef, useEffect } from "react";
import { usePathname } from 'next/navigation';
import { useAuth } from "@/hooks/useAuth";
import logo from "@/app/assets/logo.png";
import IconButton from "@/components/ui/IconButton";

// X 圖標組件
const XIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);


const Header = forwardRef((props, ref) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, signOut, isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();

  // 當選單打開時，禁止背景滾動
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // 組件卸載時恢復滾動
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);


  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    await signOut();
    closeMenu();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  };

  // --- 導覽連結定義 ---
  const navLinks = [
    { href: '/', label: '首頁' },
    { href: '/ai-assistant', label: 'AI 獎學金助理' },
    { href: '/profile', label: '個人資料', auth: true, admin: false },
    { href: '/manage', label: '管理後台', auth: true, admin: true },
  ];

  const getFilteredLinks = (isMobile = false) => {
    let links = [];
    if (!isAuthenticated) {
      links = [
        ...navLinks.slice(0, 2),
        { href: '/login', label: '登入' },
        { href: '/register', label: '註冊' },
      ];
    } else if (isAdmin) {
      links = [
        navLinks.find(l => l.href === '/'),
        navLinks.find(l => l.href === '/ai-assistant'),
        navLinks.find(l => l.href === '/profile'),
        navLinks.find(l => l.href === '/manage'),
      ].filter(Boolean);
    } else {
       links = navLinks.filter(link => !link.admin && link.auth === true);
       links.unshift(navLinks.find(l => l.href === '/ai-assistant'));
       links.unshift(navLinks.find(l => l.href === '/'));
    }
    
    if (isMobile && isAuthenticated) {
        // 在手機上，個人資料連結已經存在，所以不需要額外處理
    }
    
    return links;
  };

  const desktopNavLinks = getFilteredLinks();

  // --- Logo 和標題組件，方便復用 ---
  const LogoTitle = () => (
    <Link href="/" className="flex items-center space-x-2 sm:space-x-3 focus:outline-none p-1" aria-label="回到首頁" onClick={closeMenu}>
      <Image src={logo} alt="NCUE Logo" width={48} height={48} className="h-8 w-8" priority />
      <h1 className="font-bold text-sm" style={{ color: 'var(--primary)' }}>
        生輔組 校外獎助學金資訊平台
      </h1>
    </Link>
  );

  return (
    <>
      {/* --- 標準 Header --- */}
      <header className="header-fixed bg-surface" ref={ref}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo 區域 (桌面版) */}
            <div className="hidden md:flex">
              <LogoTitle />
            </div>
             {/* Logo 區域 (手機版) */}
            <div className="md:hidden">
              <LogoTitle />
            </div>

            {/* 桌面版導航選單 */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2" role="navigation">
              {desktopNavLinks.map(link => (
                <Link key={link.href} href={link.href} className={`nav-link underline-extend navbar-link ${pathname === link.href ? 'active' : ''}`}>
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <div className="relative group ml-4">
                  <button className="flex flex-row items-center space-x-2 nav-link navbar-link">
                    <span>Hi, {user?.user_metadata?.name || '使用者'}</span>
                    <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="py-2"><button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-red-600">登出</button></div>
                  </div>
                </div>
              )}
            </nav>

            {/* 手機版漢堡選單按鈕 */}
            <div className="md:hidden">
              <IconButton variant="ghost" className="text-muted" aria-label="開啟選單" onClick={toggleMenu}>
                <div className="relative w-6 h-6">
                  <span className="absolute left-0 top-1 w-6 h-0.5 bg-current" />
                  <span className="absolute left-0 top-2.5 w-6 h-0.5 bg-current" />
                  <span className="absolute left-0 top-4 w-6 h-0.5 bg-current" />
                </div>
              </IconButton>
            </div>
          </div>
        </div>
      </header>

      {/* --- 全螢幕手機版選單 --- */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-surface z-50 flex flex-col md:hidden"
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
        >
          {/* 選單頂部 */}
          <div className="flex items-center justify-between h-[var(--header-height)] px-3 sm:px-6 border-b">
            <LogoTitle />
            <IconButton variant="ghost" className="text-muted" aria-label="關閉選單" onClick={toggleMenu}>
              <XIcon />
            </IconButton>
          </div>

          {/* 選單內容 */}
          <div className="flex-grow p-4 flex flex-col">
            <nav className="flex-grow">
              {getFilteredLinks(true).map(link => (
                <Link
                  key={`mobile-${link.href}`}
                  href={link.href}
                  className={`block w-full text-left px-4 py-3 my-1 rounded-lg text-lg ${pathname === link.href ? 'text-primary font-semibold bg-blue-50' : 'text-text'}`}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {isAuthenticated && (
              <div className="border-t pt-4">
                <div className="text-left text-text px-4 py-2">
                  Hi, {user?.user_metadata?.name || '使用者'}
                </div>
                <button
                  className="block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg text-lg"
                  onClick={handleLogout}
                >
                  登出
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});

Header.displayName = 'Header';
export default Header;