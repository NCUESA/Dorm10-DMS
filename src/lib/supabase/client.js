import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 測試連線函數
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('_health')
      .select('*')
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      console.error('Supabase connection error:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Supabase connection successful!')
    return { success: true, message: 'Connection successful!' }
  } catch (err) {
    console.error('Connection test failed:', err)
    return { success: false, error: err.message }
  }
}

// 獲取數據庫版本信息
export async function getDatabaseInfo() {
  try {
    const { data, error } = await supabase.rpc('version')
    
    if (error) {
      console.error('Database info error:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (err) {
    console.error('Database info failed:', err)
    return { success: false, error: err.message }
  }
}
