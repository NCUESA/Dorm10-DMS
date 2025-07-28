import { supabase } from './client';

// 用戶認證相關函數
export const authService = {
  // 註冊新用戶
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      // 如果用戶成功註冊，立即創建 profile 記錄
      if (data?.user) {
        console.log('用戶註冊成功，創建 profile 記錄:', data.user.id);
        
        // 創建用戶檔案記錄
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name: userData.name || '',
            student_id: userData.student_id || '',
            department: userData.department || '',
            year: userData.year || '',
            role: 'user' // 預設為 'user'
          });
        
        if (profileError) {
          console.error('創建用戶檔案失敗:', profileError);
          // 不拋出錯誤，因為認證已經成功，profile 可以稍後創建
        } else {
          console.log('用戶檔案創建成功');
        }
        
        // 如果用戶已註冊但未驗證，需要重新發送驗證郵件
        if (!data.user.email_confirmed_at) {
          console.log('發送驗證郵件到:', email);
        }
      }
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 用戶登入
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 用戶登出
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 獲取當前用戶
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      // 如果用戶存在，獲取完整的profile信息
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        
        // 將profile信息合併到user對象中
        const userWithProfile = {
          ...user,
          profile: profile || null,
          role: profile?.role || 'user'
        };
        
        return { success: true, user: userWithProfile };
      }
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 獲取用戶profile
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 重設密碼
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 更新密碼
  async updatePassword(password) {
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 驗證 OTP
  async verifyOtp(email, token, type = 'email') {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 重新發送 OTP
  async resendOtp(email, type = 'signup') {
    try {
      const { error } = await supabase.auth.resend({
        type,
        email
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 監聽認證狀態變化
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
};
