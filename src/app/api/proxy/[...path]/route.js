import { NextResponse } from 'next/server';

// 從環境變數安全地獲取配置
const SUPABASE_URL = process.env.EXTERNAL_SUPABASE_URL || 'https://scholarship-api.ncuesa.org.tw/project/default';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DASHBOARD_USERNAME = process.env.EXTERNAL_DASHBOARD_USERNAME;
const DASHBOARD_PASSWORD = process.env.EXTERNAL_DASHBOARD_PASSWORD;

// 檢查必要的環境變數
if (!DASHBOARD_USERNAME || !DASHBOARD_PASSWORD) {
  console.error('[PROXY] ⚠️  Missing required environment variables: EXTERNAL_DASHBOARD_USERNAME or EXTERNAL_DASHBOARD_PASSWORD');
}

async function proxyRequest(request, { params }) {
  const resolvedParams = await params;
  const { path = [] } = resolvedParams;
  const pathString = Array.isArray(path) ? path.join('/') : '';
  const search = request.nextUrl.searchParams.toString();
  
  const targetUrl = `${SUPABASE_URL}/${pathString}${search ? `?${search}` : ''}`;
  
  try {
    console.log(`[PROXY] ${request.method} request to:`, targetUrl);
    
    // 設置認證和基本 headers
    const headers = {
      'Content-Type': request.headers.get('Content-Type') || 'application/json',
      'Accept': 'application/json',
      'x-client-info': 'supabase-js/2.50.0',
      'x-supabase-api-version': '2024-01-01',
      'apikey': SUPABASE_ANON_KEY,
    };

    // 只有在環境變數存在時才添加基本認證
    if (DASHBOARD_USERNAME && DASHBOARD_PASSWORD) {
      headers['Authorization'] = `Basic ${btoa(`${DASHBOARD_USERNAME}:${DASHBOARD_PASSWORD}`)}`;
    } else {
      console.warn('[PROXY] ⚠️  No dashboard credentials configured');
    }
    
    // 保留客户端的重要 headers
    const clientHeaders = ['prefer', 'authorization'];
    clientHeaders.forEach(headerName => {
      const value = request.headers.get(headerName);
      if (value && headerName === 'authorization' && !value.startsWith('Basic')) {
        headers['X-Supabase-Token'] = value;
      } else if (value && headerName === 'prefer') {
        headers['Prefer'] = value;
      }
    });
    
    const fetchOptions = {
      method: request.method,
      headers,
    };
    
    // 处理请求体
    if (!['GET', 'HEAD'].includes(request.method)) {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch (error) {
        console.warn('[PROXY] Failed to read request body:', error);
      }
    }
    
    const response = await fetch(targetUrl, fetchOptions);
    
    console.log(`[PROXY] Response: ${response.status} ${response.statusText}`);
    
    // 读取响应数据
    const contentType = response.headers.get('content-type') || '';
    let responseData;
    
    try {
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (error) {
      console.error('[PROXY] Failed to parse response:', error);
      responseData = await response.text();
    }
    
    // 创建响应
    const nextResponse = contentType.includes('application/json')
      ? NextResponse.json(responseData, { status: response.status })
      : new NextResponse(responseData, { 
          status: response.status,
          headers: { 'Content-Type': contentType }
        });
    
    // 设置 CORS headers
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, prefer, x-client-info, x-supabase-api-version');
    nextResponse.headers.set('Access-Control-Expose-Headers', 'content-range, x-supabase-api-version');
    
    // 复制重要的响应 headers
    ['content-range', 'x-supabase-api-version'].forEach(headerName => {
      const value = response.headers.get(headerName);
      if (value) {
        nextResponse.headers.set(headerName, value);
      }
    });
    
    return nextResponse;
    
  } catch (error) {
    console.error('[PROXY] Request failed:', error);
    return NextResponse.json(
      { 
        error: 'Proxy request failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      }, 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, prefer, x-client-info, x-supabase-api-version',
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
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, prefer, x-client-info, x-supabase-api-version',
      'Access-Control-Expose-Headers': 'content-range, x-supabase-api-version',
      'Access-Control-Max-Age': '86400',
    }
  });
}
