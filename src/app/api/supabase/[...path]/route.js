import { NextResponse } from 'next/server';

// 僅限伺服器端使用的 Supabase 連接配置
const INTERNAL_SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:8000';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 安全檢查：確保此 API 只能在伺服器端使用
if (typeof window !== 'undefined') {
  throw new Error('此 API 僅限伺服器端使用');
}

/**
 * 安全的 Supabase 代理
 * - 隱藏直接的資料庫連接
 * - 提供額外的安全檢查
 * - 記錄和監控 API 使用
 */
async function secureSupabaseProxy(request, { params }) {
  const resolvedParams = await params;
  const { path = [] } = resolvedParams;
  const pathString = Array.isArray(path) ? path.join('/') : '';
  const search = request.nextUrl.searchParams.toString();
  
  // 建構內部 Supabase URL
  const targetUrl = `${INTERNAL_SUPABASE_URL}/${pathString}${search ? `?${search}` : ''}`;
  
  try {
    console.log(`[SECURE-PROXY] ${request.method} request to internal Supabase:`, pathString);
    
    // 檢查請求來源 (適度安全檢查)
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    // 允許的來源清單 (本地和外部網域)
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://10.21.44.243:3000',
      'https://scholarship.ncuesa.org.tw',
      'http://scholarship.ncuesa.org.tw'
    ];
    
    // 對於外部請求進行來源驗證
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      console.warn(`[SECURE-PROXY] Blocked request from unauthorized origin: ${origin}`);
      return NextResponse.json(
        { error: 'Unauthorized origin' },
        { status: 403 }
      );
    }
    
    // 設置安全的請求標頭
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'x-client-info': 'ncue-scholarship-secure-proxy/1.0',
      'User-Agent': 'NCUE-Scholarship-Server/1.0'
    };
    
    // 保留重要的客戶端標頭
    const clientAuthHeader = request.headers.get('authorization');
    if (clientAuthHeader && clientAuthHeader.startsWith('Bearer')) {
      headers['Authorization'] = clientAuthHeader;
    }
    
    const preferHeader = request.headers.get('prefer');
    if (preferHeader) {
      headers['Prefer'] = preferHeader;
    }
    
    const fetchOptions = {
      method: request.method,
      headers,
    };
    
    // 處理請求體
    if (!['GET', 'HEAD'].includes(request.method)) {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch (error) {
        console.warn('[SECURE-PROXY] Failed to read request body:', error);
      }
    }
    
    // 發送請求到內部 Supabase
    const response = await fetch(targetUrl, fetchOptions);
    
    console.log(`[SECURE-PROXY] Response: ${response.status} ${response.statusText}`);
    
    // 處理錯誤回應
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SECURE-PROXY] Error response:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { 
          error: 'Database request failed',
          status: response.status,
          message: response.status === 404 ? 'Resource not found' : 'Internal server error'
        }, 
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, prefer',
          }
        }
      );
    }
    
    // 讀取成功回應
    const contentType = response.headers.get('content-type') || '';
    let responseData;
    
    try {
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (error) {
      console.error('[SECURE-PROXY] Failed to parse response:', error);
      responseData = { error: 'Failed to parse response' };
    }
    
    // 創建安全回應
    const nextResponse = contentType.includes('application/json')
      ? NextResponse.json(responseData, { status: response.status })
      : new NextResponse(responseData, { 
          status: response.status,
          headers: { 'Content-Type': contentType }
        });
    
    // 設置安全的 CORS 標頭
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, prefer');
    nextResponse.headers.set('Access-Control-Expose-Headers', 'content-range');
    
    // 複製重要的回應標頭
    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      nextResponse.headers.set('content-range', contentRange);
    }
    
    // 記錄成功的請求
    console.log(`[SECURE-PROXY] Successfully proxied ${request.method} ${pathString}`);
    
    return nextResponse;
    
  } catch (error) {
    console.error('[SECURE-PROXY] Request failed:', error);
    return NextResponse.json(
      { 
        error: 'Proxy request failed', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      }, 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, prefer',
        }
      }
    );
  }
}

// HTTP 方法處理器
export function GET(request, context) {
  return secureSupabaseProxy(request, context);
}

export function POST(request, context) {
  return secureSupabaseProxy(request, context);
}

export function PUT(request, context) {
  return secureSupabaseProxy(request, context);
}

export function DELETE(request, context) {
  return secureSupabaseProxy(request, context);
}

export function PATCH(request, context) {
  return secureSupabaseProxy(request, context);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, prefer',
      'Access-Control-Max-Age': '86400',
    }
  });
}
