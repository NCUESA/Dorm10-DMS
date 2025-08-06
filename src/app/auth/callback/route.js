import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL || 'http://localhost:8000',
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (newCookies) => {
            newCookies.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options })
            })
          }
        }
      }
    )
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('驗證錯誤:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=${encodeURIComponent(error.message)}`)
      }

      if (data?.user) {
        // 創建用戶檔案（如果不存在）
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name: data.user.user_metadata?.name || '',
            student_id: data.user.user_metadata?.student_id || '',
            department: data.user.user_metadata?.department || '',
            year: data.user.user_metadata?.year || '',
            role: 'user'
          })
        
        if (profileError) {
          console.error('創建用戶檔案錯誤:', profileError)
        }
      }

      // 驗證成功，重定向到儀表板
      return NextResponse.redirect(`${requestUrl.origin}/profile`)
    } catch (err) {
      console.error('處理驗證回調時發生錯誤:', err)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=${encodeURIComponent('驗證過程中發生錯誤')}`)
    }
  }

  // 沒有驗證碼，重定向到登入頁面
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
