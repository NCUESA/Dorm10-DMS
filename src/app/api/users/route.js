import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, checkRateLimit, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

export async function GET(request) {
    try {
        // 1. Rate limiting 檢查
        const rateLimitCheck = checkRateLimit(request, 'users-get', 20, 60000);
        if (!rateLimitCheck.success) {
            return rateLimitCheck.error;
        }

        // 2. 用戶身份驗證
        const authCheck = await verifyUserAuth(request, {
            requireAuth: true,
            requireAdmin: true,
            endpoint: '/api/users'
        });

        if (!authCheck.success) {
            return authCheck.error;
        }

        // 3. 獲取所有 profiles 資料
        const supabase = supabaseServer;
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select(`
                id,
                student_id,
                username,
                role,
                room,
                created_at
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching profiles:', error);
            throw new Error('獲取 profiles 資料失敗');
        }

        // 4. 準備後續查詢
        const userIds = profiles.map(p => p.id);
        const demeritMap = {};
        const emailMap = {};

        // 5. 高效地獲取所有相關的 demerit 總數
        // --- START: 修正區塊 2 ---
        // 根據 Schema，demerit 表的 `id` 欄位關聯到 users，所以我們用 `id` 來 group 和 in
        if (userIds.length > 0) {
            const { data: demerits, error: demeritError } = await supabase
                .from('demerit')
                .select('id, count:id') // 選擇 id 並計算每個 id 的數量
                .in('id', userIds)       // 篩選出我們需要的使用者
                .group('id');            // 根據 id 分組

            if (demeritError) {
                console.error('Error fetching demerits:', demeritError);
            } else if (Array.isArray(demerits)) {
                demerits.forEach(item => {
                    // 使用 item.id 來建立 map
                    demeritMap[item.id] = item.count;
                });
            }
        }
        // --- END: 修正區塊 2 ---

        // 6. 獲取所有 auth.users 的資料來建立 email 對應表
        const { data: authUsers, error: emailFetchError } = await supabase.auth.admin.listUsers();
        if (emailFetchError) {
            console.error('Error fetching auth users:', emailFetchError);
        } else if (authUsers?.users) {
            authUsers.users.forEach(user => {
                emailMap[user.id] = user.email;
            });
        }

        // 7. 格式化最終回傳的資料
        const formattedUsers = profiles.map(profile => {
            const email = emailMap[profile.id] || '';

            return {
                id: profile.id,
                studentId: profile.student_id || '',
                name: profile.username || '',
                // 電子信箱脫敏處理邏輯保留
                email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : '',
                emailFull: email,
                role: profile.role || 'user',
                room: profile.room || '',
                demerit: demeritMap[profile.id] || 0, // demeritMap 的 key 是 profile.id
                joinedAt: profile.created_at,
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