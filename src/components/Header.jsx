"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, forwardRef } from "react";
import { usePathname } from 'next/navigation';
import { useAuth } from "@/hooks/useAuth";
import logo from "@/app/assets/logo.png";
import IconButton from "@/components/ui/IconButton";

const Header = forwardRef((props, ref) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, signOut, isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();

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
    { href: '/profile', label: '個資維護', auth: true, admin: false },
    { href: '/manage', label: '管理後台', auth: true, admin: true },
  ];

  const getFilteredLinks = () => {
    if (!isAuthenticated) {
      return [
        ...navLinks.slice(0, 2),
        { href: '/login', label: '登入' },
        { href: '/register', label: '註冊' },
      ];
    }
    if (isAdmin) {
      return [
        navLinks.find(l => l.href === '/'),
        navLinks.find(l => l.href === '/ai-assistant'),
        navLinks.find(l => l.href === '/profile'),
        navLinks.find(l => l.href === '/manage'),
      ].filter(Boolean);
    }
    return navLinks.filter(link => !link.admin);
  };

  const filteredNavLinks = getFilteredLinks();

  // --- 網站 Logo 和標題組件 ---
  const LogoTitle = () => (
    <Link href="/" className="flex items-center space-x-3 focus:outline-none p-1" aria-label="回到首頁" onClick={closeMenu}>
      <Image src={logo} alt="NCUE Logo" width={52} height={52} className="h-10 w-10 sm:h-12 sm:w-12" priority />
      <h1 className="font-bold text-base sm:text-lg" style={{ color: 'var(--primary)' }}>
        生輔組 校外獎助學金資訊平台
      </h1>
    </Link>
  );

  return (
    <header className="header-fixed bg-surface" ref={ref} onKeyDown={handleKeyDown}>
      {/* 頂部固定內容 (Logo 和導航) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-[var(--header-height)] flex items-center justify-between">
        <LogoTitle />

        {/* 桌面版導航選單 */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2" role="navigation">
          {filteredNavLinks.map(link => (
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
              <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-md z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="py-1"><button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-red-600 rounded-md m-1">登出</button></div>
              </div>
            </div>
          )}
        </nav>

        {/* 手機版漢堡選單按鈕 */}
        <div className="md:hidden">
          <IconButton variant="ghost" className="text-muted z-20" aria-label="選單" onClick={toggleMenu}>
            <div className="relative w-6 h-6">
              <span className={`absolute left-0 w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${isMenuOpen ? 'rotate-45 top-1/2 -translate-y-1/2' : 'top-1'}`} />
              <span className={`absolute left-0 w-6 h-0.5 bg-current transition-all duration-300 ease-in-out top-1/2 -translate-y-1/2 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
              <span className={`absolute left-0 w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${isMenuOpen ? '-rotate-45 top-1/2 -translate-y-1/2' : 'bottom-1'}`} />
            </div>
          </IconButton>
        </div>
      </div>

      {/* --- RWD 可展開選單 --- */}
      <div
        className={`md:hidden bg-surface w-full transition-all duration-300 ease-in-out overflow-hidden ${
          isMenuOpen ? 'max-h-[500px]' : 'max-h-0'
        }`}
      >

        <div className="p-4 space-y-2 border-t border-border">
          {filteredNavLinks.map(link => (
            <Link
              key={`mobile-${link.href}`}
              href={link.href}
              className={`block w-full text-left px-4 py-3 my-1 rounded-lg text-lg ${pathname === link.href ? 'text-primary font-semibold bg-blue-50' : 'text-text'}`}
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <div className="border-t pt-4 mt-4">
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
    </header>
  );
});

Header.displayName = 'Header';
export default Header;