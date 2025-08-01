import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET: 獲取用戶的聊天記錄
export async function GET(request) {
  try {
    // 1. Rate limiting 檢查
    const rateLimitCheck = checkRateLimit(request, 'chat-history-get', 60, 60000); // 每分鐘60次
    if (!rateLimitCheck.success) {
      return rateLimitCheck.error;
    }

    // 2. 用戶身份驗證
    const authCheck = await verifyUserAuth(request, {
      requireAuth: true,
      requireAdmin: false,
      endpoint: '/api/chat-history'
    });
    
    if (!authCheck.success) {
      return authCheck.error;
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')

    // 3. 權限檢查：用戶只能查看自己的聊天記錄，除非是管理員
    if (userId && userId !== authCheck.user.id && authCheck.profile.role !== 'admin') {
      return NextResponse.json(
        { error: '權限不足：無法查看其他用戶的聊天記錄' },
        { status: 403 }
      );
    }

    // 4. 使用當前用戶 ID（如果沒有指定或權限不足）
    const targetUserId = (userId && (userId === authCheck.user.id || authCheck.profile.role === 'admin')) 
      ? userId 
      : authCheck.user.id;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', targetUserId)
      .order('timestamp', { ascending: true })

    // 如果提供了 sessionId，則只獲取該會話的記錄
    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data, error } = await query

    if (error) {
      console.error('獲取聊天記錄失敗:', error)
      return NextResponse.json(
        { error: '獲取聊天記錄失敗' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('聊天記錄 API 錯誤:', error)
    return NextResponse.json(
      { error: '內部伺服器錯誤' },
      { status: 500 }
    )
  }
}

// POST: 保存新的聊天消息
export async function POST(request) {
  try {
    // 1. Rate limiting 檢查
    const rateLimitCheck = checkRateLimit(request, 'chat-history-post', 100, 60000); // 每分鐘100次
    if (!rateLimitCheck.success) {
      return rateLimitCheck.error;
    }

    // 2. 用戶身份驗證
    const authCheck = await verifyUserAuth(request, {
      requireAuth: true,
      requireAdmin: false,
      endpoint: '/api/chat-history POST'
    });
    
    if (!authCheck.success) {
      return authCheck.error;
    }

    // 3. 驗證請求資料
    const body = await request.json();
    const dataValidation = validateRequestData(
      body,
      ['userId', 'role', 'messageContent'], // 必填欄位
      ['sessionId'] // 可選欄位
    );
    
    if (!dataValidation.success) {
      return dataValidation.error;
    }

    const { userId, sessionId, role, messageContent } = dataValidation.data;

    // 4. 權限檢查：用戶只能為自己保存聊天記錄
    if (userId !== authCheck.user.id && authCheck.profile.role !== 'admin') {
      return NextResponse.json(
        { error: '權限不足：無法為其他用戶保存聊天記錄' },
        { status: 403 }
      );
    }

    // 5. 驗證 role 值
    if (!['user', 'model'].includes(role)) {
      return NextResponse.json(
        { error: '無效的角色值' },
        { status: 400 }
      );
    }

    // 6. 驗證消息長度
    if (messageContent.length > 10000) {
      return NextResponse.json(
        { error: '消息內容過長' },
        { status: 400 }
      );
    }

    // 如果沒有提供 sessionId，則創建新的會話
    const finalSessionId = sessionId || crypto.randomUUID()

    const { data, error } = await supabase
      .from('chat_history')
      .insert([
        {
          user_id: userId,
          session_id: finalSessionId,
          role: role,
          message_content: messageContent,
          timestamp: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('保存聊天記錄失敗:', error)
      return NextResponse.json(
        { error: '保存聊天記錄失敗' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data: data[0],
      sessionId: finalSessionId
    })

  } catch (error) {
    console.error('保存聊天記錄 API 錯誤:', error)
    return NextResponse.json(
      { error: '內部伺服器錯誤' },
      { status: 500 }
    )
  }
}

// DELETE: 清除用戶的聊天記錄
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId)

    // 如果提供了 sessionId，則只刪除該會話的記錄
    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { error } = await query

    if (error) {
      console.error('刪除聊天記錄失敗:', error)
      return NextResponse.json(
        { error: '刪除聊天記錄失敗' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('刪除聊天記錄 API 錯誤:', error)
    return NextResponse.json(
      { error: '內部伺服器錯誤' },
      { status: 500 }
    )
  }
}
