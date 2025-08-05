import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://scholarship-api.ncuesa.org.tw';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY;

// 从 supabase-project/.env 获取的认证信息
const DASHBOARD_USERNAME = 'supabase';
const DASHBOARD_PASSWORD = 'Chang757';

async function proxyRequest(request, { params }) {
  const resolvedParams = await params;
  const { path = [] } = resolvedParams;
  const pathString = Array.isArray(path) ? path.join('/') : '';
  const search = request.nextUrl.searchParams.toString();
  
  const targetUrl = `${SUPABASE_URL}/${pathString}${search ? `?${search}` : ''}`;
  
  try {
    console.log(`[PROXY] ${request.method} request to:`, targetUrl);
    
    // 设置基本的 headers
    const headers = {
      'Content-Type': request.headers.get('Content-Type') || 'application/json',
      'Accept': 'application/json',
      'x-client-info': 'supabase-js/2.50.0',
      'x-supabase-api-version': '2024-01-01',
    };
    
    // 设置 Basic Auth（Kong 网关的仪表板认证）
    const basicAuth = btoa(`${DASHBOARD_USERNAME}:${DASHBOARD_PASSWORD}`);
    headers['Authorization'] = `Basic ${basicAuth}`;
    
    // 设置 API Key（Kong 的 key-auth 插件）
    headers['apikey'] = SUPABASE_ANON_KEY;
    
    // 保留客户端的 Authorization header 作为备用
    const clientAuthHeader = request.headers.get('authorization');
    if (clientAuthHeader && !clientAuthHeader.startsWith('Basic')) {
      // 如果客户端发送了 Bearer token，作为额外的认证
      headers['X-Supabase-Token'] = clientAuthHeader;
    }
    
    // 保留重要的客户端 headers
    const preferHeader = request.headers.get('prefer');
    if (preferHeader) {
      headers['Prefer'] = preferHeader;
    }
    
    const fetchOptions = {
      method: request.method,
      headers,
    };
    
    // 處理 body（除了 GET 和 HEAD）
    if (!['GET', 'HEAD'].includes(request.method)) {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch (error) {
        console.warn('Failed to read request body:', error);
      }
    }
    
    console.log(`[PROXY] Request headers:`, {
      'Authorization': 'Basic ***',
      'apikey': headers['apikey'] ? headers['apikey'].substring(0, 20) + '...' : 'none',
      'Content-Type': headers['Content-Type'],
      'Accept': headers['Accept']
    });
    
    const response = await fetch(targetUrl, fetchOptions);
    
    console.log(`[PROXY] Response status: ${response.status}`);
    console.log(`[PROXY] Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PROXY] Error response:`, errorText);
      
      return NextResponse.json(
        { 
          error: 'Supabase API error', 
          status: response.status,
          message: errorText,
          url: targetUrl,
          requestHeaders: {
            'Authorization': 'Basic ***',
            'apikey': headers['apikey'] ? headers['apikey'].substring(0, 20) + '...' : 'none'
          }
        }, 
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, prefer, x-client-info, x-supabase-api-version',
          }
        }
      );
    }
    
    // 讀取回應
    const contentType = response.headers.get('content-type') || '';
    let data;
    
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (error) {
        console.warn('Failed to parse JSON:', error);
        data = await response.text();
      }
    } else {
      data = await response.text();
    }
    
    // 創建回應
    const nextResponse = contentType.includes('application/json')
      ? NextResponse.json(data, { status: response.status })
      : new NextResponse(data, { 
          status: response.status,
          headers: { 'Content-Type': contentType }
        });
    
    // 設置 CORS headers
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, prefer, x-client-info, x-supabase-api-version, accept, accept-encoding, accept-language, cache-control, pragma');
    nextResponse.headers.set('Access-Control-Expose-Headers', 'content-range, x-supabase-api-version');
    
    // 複製重要的回應 headers
    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      nextResponse.headers.set('content-range', contentRange);
    }
    
    return nextResponse;
  } catch (error) {
    console.error('[PROXY] Request failed:', error);
    return NextResponse.json(
      { 
        error: 'Proxy request failed', 
        details: error.message,
        url: targetUrl 
      }, 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

export function GET(request, context) {
  return proxyRequest(request, context);
}

export function POST(request, context) {
  return proxyRequest(request, context);
}

export function PUT(request, context) {
  return proxyRequest(request, context);
}

export function DELETE(request, context) {
  return proxyRequest(request, context);
}

export function PATCH(request, context) {
  return proxyRequest(request, context);
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, apikey, x-client-info, x-supabase-api-version, prefer');
  headers.set('Access-Control-Expose-Headers', 'content-range, x-supabase-api-version');
  headers.set('Access-Control-Max-Age', '86400');
  
  return new Response(null, { status: 200, headers });
}