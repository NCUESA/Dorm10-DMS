import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { rateLimit, logSecurityEvent } from '@/lib/security';

export async function GET(request) {
  try {
    // 0. Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`users-get-${ip}`, 20, 60000)) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip, endpoint: '/api/users' });
      return NextResponse.json(
        { error: '請求過於頻繁，請稍後再試' },
        { status: 429 }
      );
    }

    // 1. 驗證用戶身份 - 使用 Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授權：請先登入' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = supabaseServer;
    
    // 2. 驗證 JWT Token 並獲取用戶資訊
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logSecurityEvent('INVALID_TOKEN', { ip, endpoint: '/api/users', error: authError?.message });
      return NextResponse.json(
        { error: '未授權：無效的驗證令牌' },
        { status: 401 }
      );
    }

    // 3. 檢查用戶是否為管理員
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !currentUserProfile || currentUserProfile.role !== 'admin') {
      return NextResponse.json(
        { error: '權限不足：需要管理員權限' },
        { status: 403 }
      );
    }

    // 4. 獲取所有用戶資料，包含 auth.users 的電子信箱
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        student_id, 
        username, 
        role, 
        created_at, 
        avatar_url
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: '獲取用戶資料失敗' },
        { status: 500 }
      );
    }

    // 獲取對應的電子信箱資料
    const userIds = profiles.map(p => p.id);
    const { data: authUsers, error: emailFetchError } = await supabase.auth.admin.listUsers();
    
    if (emailFetchError) {
      console.error('Error fetching auth users:', emailFetchError);
    }

    // 建立 email 對應表
    const emailMap = {};
    if (authUsers?.users) {
      authUsers.users.forEach(user => {
        emailMap[user.id] = user.email;
      });
    }

    // 5. 格式化資料並進行脫敏處理
    const formattedUsers = profiles.map(profile => {
      const email = emailMap[profile.id] || '';
      
      return {
        id: profile.id,
        studentId: profile.student_id || '',
        name: profile.username || '',
        // 電子信箱脫敏處理 (只顯示前3個字符和@後的網域)
        email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : '',
        emailFull: email, // 保留完整電子信箱供編輯使用
        role: profile.role === 'admin' ? '管理員' : '一般使用者',
        createdAt: profile.created_at,
        avatarUrl: profile.avatar_url
      };
    });

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}
