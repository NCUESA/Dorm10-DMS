import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, checkRateLimit, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

export async function GET(request) {
  try {
    // 1. Rate limiting 檢查
    const rateLimitCheck = checkRateLimit(request, 'users-get', 20, 60000); // 每分鐘20次
    if (!rateLimitCheck.success) {
      return rateLimitCheck.error;
    }

    // 2. 用戶身份驗證（需要管理員權限）
    const authCheck = await verifyUserAuth(request, {
      requireAuth: true,
      requireAdmin: true,
      endpoint: '/api/users'
    });
    
    if (!authCheck.success) {
      return authCheck.error;
    }

    // 3. 獲取所有用戶資料，包含 auth.users 的電子信箱
    const supabase = supabaseServer;
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
      throw new Error('獲取用戶資料失敗');
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
        role: profile.role || 'user',
        joinedAt: profile.created_at,
        avatarUrl: profile.avatar_url
      };
    });

    // 記錄成功操作
    logSuccessAction('GET_USERS', '/api/users', {
      adminId: authCheck.user.id,
      userCount: formattedUsers.length
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers
    });

  } catch (error) {
    return handleApiError(error, '/api/users');
  }
}
