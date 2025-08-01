import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// GET: 獲取用戶的聊天記錄
export async function GET(request) {
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
      .select('*')
      .eq('user_id', userId)
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
    const body = await request.json()
    const { userId, sessionId, role, messageContent } = body

    if (!userId || !role || !messageContent) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      )
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
