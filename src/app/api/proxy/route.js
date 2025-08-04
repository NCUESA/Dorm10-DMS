import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  
  // 真實的 Supabase URL 隱藏在後端環境變數中
  const realSupabaseUrl = 'https://scholarship-api.ncuesa.org.tw/supabase';
  
  try {
    // 伺服器端請求，繞過瀏覽器的 CORS 限制
    const response = await fetch(`${realSupabaseUrl}${path}`, {
      headers: {
        'Authorization': request.headers.get('authorization') || '',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // 設置 CORS headers，允許前端訪問
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
    
    return nextResponse;
  } catch (error) {
    console.error('代理請求失敗:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  const realSupabaseUrl = 'https://scholarship-api.ncuesa.org.tw/supabase';
  const body = await request.text();
  
  try {
    const response = await fetch(`${realSupabaseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('authorization') || '',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body,
    });
    
    const data = await response.json();
    
    const nextResponse = NextResponse.json(data, { status: response.status });
    
    // 設置 CORS headers
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
    
    return nextResponse;
  } catch (error) {
    console.error('代理請求失敗:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
    },
  });
}
