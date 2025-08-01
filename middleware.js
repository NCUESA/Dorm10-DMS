import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request) {
	const res = NextResponse.next();
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll: () => request.cookies.getAll(),
				setAll: (cookies) => {
					cookies.forEach(({ name, value, options }) => {
						res.cookies.set({ name, value, ...options });
					});
				},
			},
		}
	);

	// 刷新 session（如果過期的話）
	const { data: { session } } = await supabase.auth.getSession();

	const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
		request.nextUrl.pathname.startsWith('/register') ||
		request.nextUrl.pathname.startsWith('/forgot-password');

	const isProtectedPage = request.nextUrl.pathname.startsWith('/profile') ||
		request.nextUrl.pathname.startsWith('/manage') ||
		request.nextUrl.pathname.startsWith('/management');

	// 如果用戶已登入但訪問認證頁面，重定向到個人資料頁面
	if (session && isAuthPage) {
		return NextResponse.redirect(new URL('/profile', request.url));
	}

	// 如果用戶未登入但訪問受保護頁面，重定向到登入頁面
	if (!session && isProtectedPage) {
		return NextResponse.redirect(new URL('/login', request.url));
	}

	return res;
}

export const config = {
	matcher: [
		'/login',
		'/register',
		'/forgot-password',
		'/profile',
		'/manage/:path*',
		'/management/:path*'
	]
};
