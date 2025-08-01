import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { rateLimit, validateUserInput, sanitizeUserData, logSecurityEvent } from '@/lib/security';

export async function PUT(request, { params }) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { role, username } = body;

    // 0. Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`users-put-${ip}`, 5, 60000)) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip, endpoint: '/api/users/[userId]', userId });
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
      logSecurityEvent('INVALID_TOKEN', { ip, endpoint: '/api/users/[userId]', error: authError?.message });
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

    // 4. 驗證輸入資料
    const validationErrors = validateUserInput({ role, username });
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    // 5. 防止管理員意外移除自己的管理員權限
    if (userId === user.id && role === '一般使用者') {
      return NextResponse.json(
        { error: '不能移除自己的管理員權限' },
        { status: 400 }
      );
    }

    // 6. 清理和脫敏輸入資料
    const sanitizedData = sanitizeUserData({ role, username });
    
    // 7. 記錄安全事件
    logSecurityEvent('USER_UPDATE_ATTEMPT', {
      adminId: user.id,
      targetUserId: userId,
      changes: { role: sanitizedData.role, username: sanitizedData.username },
      ip
    });
    
    // 更新用戶資料
    const updateData = {};
    if (sanitizedData.role !== undefined) {
      updateData.role = sanitizedData.role === '管理員' ? 'admin' : 'user';
    }
    if (sanitizedData.username !== undefined) {
      updateData.username = sanitizedData.username;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('id, student_id, username, role, created_at, avatar_url')
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: '更新用戶資料失敗' },
        { status: 500 }
      );
    }

    // 獲取對應的電子信箱
    const { data: authUsers, error: emailFetchError } = await supabase.auth.admin.listUsers();
    let email = '';
    if (authUsers?.users) {
      const authUser = authUsers.users.find(u => u.id === data.id);
      email = authUser?.email || '';
    }

    // 格式化回傳資料
    const formattedUser = {
      id: data.id,
      studentId: data.student_id || '',
      name: data.username || '',
      email: email,
      role: data.role === 'admin' ? '管理員' : '一般使用者',
      createdAt: data.created_at,
      avatarUrl: data.avatar_url
    };

    // 記錄成功更新
    logSecurityEvent('USER_UPDATE_SUCCESS', {
      adminId: user.id,
      targetUserId: userId,
      changes: updateData,
      ip
    });

    return NextResponse.json({ user: formattedUser });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: '伺服器錯誤' },
      { status: 500 }
    );
  }
}
