import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, handleApiError } from '@/lib/apiMiddleware';

export async function GET(request) {
    try {
        // 驗證管理員身份
        const authCheck = await verifyUserAuth(request, { requireAuth: true, requireAdmin: true });
        if (!authCheck.success) return authCheck.error;

        const supabase = supabaseServer;

        // 1. 獲取所有 profiles 資料
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select(`id, student_id, username, role, room, created_at`)
            .order('created_at', { ascending: false });

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            throw new Error('獲取 profiles 資料失敗');
        }

        if (!profiles || profiles.length === 0) {
            return NextResponse.json({ success: true, users: [] });
        }

        const userIds = profiles.map(p => p.id);

        // 2. 一次性獲取所有相關使用者的「所有」違規紀錄 (包含已撤銷的)
        //    並透過關聯查詢獲取 recorder 和 remover 的姓名
        const { data: demeritRecords, error: demeritError } = await supabase
            .from('demerit')
            .select(`
        *,
        recorder:profiles!recorder_id(username),
        remover:profiles!removed_by(username)
      `)
            .in('user_id', userIds);

        if (demeritError) {
            console.error('Error fetching demerits:', demeritError);
            throw new Error('獲取違規紀錄失敗');
        }

        // 3. 在 JavaScript 中處理資料，建立一個包含總點數和所有紀錄的 Map
        const demeritDataMap = (demeritRecords || []).reduce((acc, record) => {
            // 如果 map 中還沒有這個使用者，先初始化
            if (!acc[record.user_id]) {
                acc[record.user_id] = { totalPoints: 0, allRecords: [] };
            }

            // 只有在紀錄未被撤銷時，才加總點數
            if (!record.removed_at) {
                acc[record.user_id].totalPoints += record.points;
            }

            // 將所有紀錄 (不論是否撤銷) 都加入到列表中
            acc[record.user_id].allRecords.push(record);

            return acc;
        }, {});

        // 4. 獲取 email 資料
        const { data: authUsers, error: emailFetchError } = await supabase.auth.admin.listUsers();
        if (emailFetchError) {
            // 這不是致命錯誤，我們可以繼續，只是 email 可能會是空的
            console.error('Error fetching auth users:', emailFetchError);
        }

        const emailMap = (authUsers?.users || []).reduce((acc, user) => {
            acc[user.id] = user.email;
            return acc;
        }, {});

        // 5. 格式化最終回傳的資料
        const formattedUsers = profiles.map(profile => {
            const email = emailMap[profile.id] || '';
            const demeritInfo = demeritDataMap[profile.id] || { totalPoints: 0, allRecords: [] };

            return {
                id: profile.id,
                studentId: profile.student_id || '',
                name: profile.username || '',
                room: profile.room || '-',
                email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : '',
                emailFull: email,
                role: profile.role || 'user',
                demerit: demeritInfo.totalPoints,       // 這是加總後的「有效」點數
                demeritRecords: demeritInfo.allRecords, // 這是「所有」紀錄，包含已撤銷的
                joinedAt: profile.created_at,
            };
        });

        return NextResponse.json({
            success: true,
            users: formattedUsers
        });

    } catch (error) {
        return handleApiError(error, '/api/users');
    }
}