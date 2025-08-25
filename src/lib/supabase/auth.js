// src/lib/supabase/auth.js
import { supabase } from './client';

// User authentication functions
export const authService = {
    async signUp(email, password, userData = {}) {
        try {
            const combinedRoom = `${userData.roomNumber}-${userData.bedNumber}`;
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        // --- START: 修正區塊 1 ---
                        // 將 'name' 改為 'username' 以匹配資料庫 trigger 和 profiles 表的欄位
                        username: userData.username,
                        // --- END: 修正區塊 1 ---
                        student_id: userData.student_id,
                        room: combinedRoom,
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error("Sign-up failed:", error);
            return { success: false, error: error.message };
        }
    },

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

    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;

            if (user) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') { // Ignore "no rows found" error
                    console.error("Error fetching profile:", profileError);
                }

                return {
                    success: true,
                    user: {
                        ...user,
                        profile: profile || null,
                        role: profile?.role || 'user'
                    }
                };
            }

            return { success: true, user: null };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

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

    async updateProfile({ username, student_id, roomNumber, bedNumber }) {
        try {
            // 1. 獲取當前使用者，確保我們有 user ID
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error("使用者未登入，無法更新資料");

            // 2. 準備要更新到 profiles 表的資料
            const combinedRoom = `${roomNumber}-${bedNumber}`;
            const updates = {
                username,
                student_id,
                room: combinedRoom,
            };

            // 3. 只更新 public.profiles 表
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) {
                // 如果是後端 unique constraint 錯誤，Supabase 會在這裡報錯
                // 例如 'duplicate key value violates unique constraint "profiles_student_id_key"'
                throw error;
            }

            // 成功時，回傳成功的狀態和更新後的 user 物件 (雖然 user 本身沒變，但這是個好習慣)
            return { success: true, user };

        } catch (error) {
            console.error('更新個人資料失敗:', error);
            // 將完整的錯誤訊息回傳給前端，而不是只有 error.message
            return { success: false, error: error.message || '發生未知錯誤' };
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
