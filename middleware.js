import { NextResponse } from 'next/server';

export function middleware(request) {
  // 從 cookies 或 headers 中獲取認證信息
  const token = request.cookies.get('auth-token')?.value;
  const userInfo = request.cookies.get('user-info')?.value;
  
  // 解析用戶信息
  let parsedUserInfo = null;
  if (userInfo) {
    try {
      parsedUserInfo = JSON.parse(decodeURIComponent(userInfo));
    } catch (error) {
      console.error('Failed to parse user info:', error);
    }
  }

  // 創建 response
  const response = NextResponse.next();
  
  // 添加認證狀態到 headers，讓組件可以讀取
  response.headers.set('x-user-authenticated', token ? 'true' : 'false');
  if (parsedUserInfo) {
    response.headers.set('x-user-info', JSON.stringify(parsedUserInfo));
  }

  // 保護需要認證的路由
  const protectedPaths = ['/manage', '/profile', '/my-scholarships'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // 如果訪問受保護的路由但未登入，重定向到登入頁面
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 如果已登入但訪問登入/註冊頁面，重定向到首頁
  if (token && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

// 配置 middleware 運行的路徑
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
