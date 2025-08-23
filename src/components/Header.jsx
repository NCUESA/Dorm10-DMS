"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, forwardRef, useEffect, useRef, createContext } from "react";
import { usePathname } from 'next/navigation';
import { useAuth } from "@/hooks/useAuth";
import logo from "@/app/assets/logo.png";
import IconButton from "@/components/ui/IconButton";

export const HeaderContext = createContext({ isHeaderVisible: true });

const Header = forwardRef((props, ref) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isOverDark, setIsOverDark] = useState(false);
	const mobileMenuRef = useRef(null);

	const [isHeaderVisible, setIsHeaderVisible] = useState(true);
	const scrollPosition = useRef(0);
	const scrollingDownDelta = useRef(0);

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

	useEffect(() => {
		const SCROLL_DOWN_THRESHOLD = 150;
		const TOP_OFFSET = 100;

		const handleScroll = () => {
			const currentPosition = window.scrollY;
			if (isMenuOpen) {
				setIsHeaderVisible(true);
				return;
			}
			const direction = currentPosition > scrollPosition.current ? 'down' : 'up';
			if (direction === 'up' || currentPosition < TOP_OFFSET) {
				setIsHeaderVisible(true);
				scrollingDownDelta.current = 0;
			} else {
				scrollingDownDelta.current += (currentPosition - scrollPosition.current);
				if (scrollingDownDelta.current > SCROLL_DOWN_THRESHOLD) {
					setIsHeaderVisible(false);
				}
			}
			scrollPosition.current = currentPosition;
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, [isMenuOpen]);

	useEffect(() => {
		if (!isMenuOpen) return;
		const footer = document.querySelector('footer');
		const menu = mobileMenuRef.current;
		if (!footer || !menu) return;
		const checkOverlap = () => {
			const menuRect = menu.getBoundingClientRect();
			const footerRect = footer.getBoundingClientRect();
			const isOverlapping = menuRect.bottom > footerRect.top && menuRect.top < footerRect.bottom;
			setIsOverDark(isOverlapping);
		};
		checkOverlap();
		window.addEventListener('scroll', checkOverlap, { passive: true });
		return () => {
			window.removeEventListener('scroll', checkOverlap);
		};
	}, [isMenuOpen]);


        const navLinks = [
                { href: '/', label: '首頁' },
                { href: '/ai-assistant', label: 'AI 獎學金助理'},
                { href: '/resource', label: '相關資源' },
                { href: '/demerit', label: '違規記點', auth: true },
                { href: '/terms-and-privacy', label: '服務條款', auth: true },
                { href: '/manage', label: '管理後台', auth: true, admin: true },
        ];

	const getFilteredLinks = () => {
		if (!isAuthenticated) {
			const publicLinks = navLinks.filter(link => !link.auth);
			return [
				...publicLinks,
				{ href: '/login', label: '登入' },
				{ href: '/register', label: '註冊' },
			];
		}
		return isAdmin
			? navLinks.filter(l => l.auth || !l.hasOwnProperty('auth'))
			: navLinks.filter(l => !l.admin);
	};

	const filteredNavLinks = getFilteredLinks();

	const LogoTitle = () => (
		<Link href="/" className="flex items-center space-x-3 focus:outline-none p-1" aria-label="回到首頁" onClick={closeMenu}>
			<Image src={logo} alt="NCUE Logo" width={52} height={52} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" priority />
			<h1
				className="font-bold text-base sm:text-lg whitespace-nowrap transition-colors duration-300"
				style={{ color: isMenuOpen && isOverDark ? 'var(--primary-light)' : 'var(--primary)' }}
			>
				十宿
			</h1>
		</Link>
	);

	return (
		<HeaderContext.Provider value={{ isHeaderVisible }}>
			<header
				className={`header-fixed ${isHeaderVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${isMenuOpen ? 'menu-open' : ''}`}
				ref={ref}
				onKeyDown={handleKeyDown}
			>
				<div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full flex items-center justify-between relative z-10">
					<LogoTitle />
					<nav className="hidden lg:flex items-center space-x-1 lg:space-x-2" role="navigation">
						{filteredNavLinks.map(link => (
							<Link key={link.href} href={link.href} className={`nav-link underline-extend navbar-link ${pathname === link.href ? 'active' : ''}`}>
								{link.label}
							</Link>
						))}
						{isAuthenticated && (
							<div className="relative group ml-4">
								<button className="flex flex-row items-center space-x-2 nav-link navbar-link">
									<span>Hi, {user?.user_metadata?.name || 'User'}</span>
									<svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
								</button>
								<div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2">
									<Link href="/profile" className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
										個資管理
									</Link>
									<button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md">
										登出
									</button>
								</div>
							</div>
						)}
					</nav>
					<div className="lg:hidden">
						<IconButton variant="ghost" className="text-muted z-20" aria-label="選單" onClick={toggleMenu}>
							<div className="relative w-6 h-6">
								<span className={`absolute left-0 w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${isMenuOpen ? 'rotate-45 top-1/2 -translate-y-1/2' : 'top-1'}`} />
								<span className={`absolute left-0 w-6 h-0.5 bg-current transition-all duration-300 ease-in-out top-1/2 -translate-y-1/2 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
								<span className={`absolute left-0 w-6 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${isMenuOpen ? '-rotate-45 top-1/2 -translate-y-1/2' : 'bottom-1'}`} />
							</div>
						</IconButton>
					</div>
				</div>

				{/* --- 手機版下拉選單 --- */}
				<div
					ref={mobileMenuRef}
					className={`lg:hidden absolute left-0 w-full 
						bg-surface/85 backdrop-blur-lg shadow-lg 
						transition-all duration-300 ease-in-out overflow-y-auto 
						${isMenuOpen ? 'max-h-[570px] top-0' : 'max-h-0 top-full'}`
					}
				>
					<div style={{ height: 'var(--header-height)' }} />

					<div className="p-4 space-y-2">
						{filteredNavLinks.map((link, index) => (
							<Link
								key={`mobile-${link.href}`}
								href={link.href}
								className={`block w-full text-left px-4 py-3 my-1 rounded-lg text-lg 
									transition-all duration-300 ease-in-out
									${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}
									${pathname === link.href
										? (isOverDark ? 'bg-white/25 text-white' : 'bg-[#00A6D6]/20 backdrop-blur-sm text-primary font-semibold')
										: (isOverDark ? 'text-white' : 'text-text')
									}`
								}
								style={{ transitionDelay: isMenuOpen ? `${index * 50}ms` : '0ms' }}
								onClick={closeMenu}
							>
								{link.label}
							</Link>
						))}
						{isAuthenticated && (
							<div
								className={`border-t pt-4 mt-4 transition-all duration-300 ease-in-out ${isOverDark ? 'border-white/20' : 'border-t-gray-200'} ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
								style={{ transitionDelay: isMenuOpen ? `${filteredNavLinks.length * 50}ms` : '0ms' }}
							>
								<div className={`text-left px-4 py-2 transition-colors duration-200 ${isOverDark ? 'text-white' : 'text-text'}`}>
									Hi, {user?.user_metadata?.name || 'User'}
								</div>
								<Link
									href="/profile"
									className={`block w-full text-left px-4 py-3 rounded-lg text-lg transition-colors duration-200 ${isOverDark ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
									onClick={closeMenu}
								>
									個資管理
								</Link>
								<hr className={`my-1 ${isOverDark ? 'border-white/20' : 'border-t-gray-200'}`} />
								<button
									className={`block w-full text-left px-4 py-3 rounded-lg text-lg transition-colors duration-200 ${isOverDark ? 'text-red-400 hover:bg-white/10' : 'text-red-600 hover:bg-red-50'}`}
									onClick={handleLogout}
								>
									登出
								</button>
							</div>
						)}
					</div>
				</div>
			</header>
		</HeaderContext.Provider>
	);
});

Header.displayName = 'Header';
export default Header;