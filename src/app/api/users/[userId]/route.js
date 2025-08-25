// src/app/api/users/[userId]/route.js

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

export async function PUT(request, { params }) {
    try {
        const { userId } = params;

        // 1. Rate limiting 檢查 (正確)
        const rateLimitCheck = checkRateLimit(request, 'users-put', 5, 60000);
        if (!rateLimitCheck.success) {
            return rateLimitCheck.error;
        }

        // 2. 用戶身份驗證 (正確)
        const authCheck = await verifyUserAuth(request, {
            requireAuth: true,
            requireAdmin: true,
            endpoint: '/api/users/[userId]'
        });

        if (!authCheck.success) {
            return authCheck.error;
        }

        // 3. 驗證請求資料 (正確，欄位均為選填)
        const body = await request.json();
        const dataValidation = validateRequestData(
            body,
            [], // 必填欄位為空
            ['role', 'username', 'roomNumber', 'bedNumber'] // 所有欄位都是選填
        );

        if (!dataValidation.success) {
            return dataValidation.error;
        }

        const { role, username, roomNumber, bedNumber } = dataValidation.data;

        // 4. 驗證 userId 格式 (正確)
        if (!userId || typeof userId !== 'string') {
            return NextResponse.json({ error: '無效的用戶 ID' }, { status: 400 });
        }

        // 5. 防止管理員移除自己的管理員權限 (正確)
        if (userId === authCheck.user.id && role && role !== 'admin') {
            return NextResponse.json({ error: '不能移除自己的管理員權限' }, { status: 400 });
        }

        // 6. 準備要更新的資料 (正確)
        const supabase = supabaseServer;
        const updateData = {};
        if (role !== undefined) {
            updateData.role = role;
        }
        if (username !== undefined) {
            updateData.username = username;
        }
        if (roomNumber !== undefined && bedNumber !== undefined) {
            const combinedRoom = `${roomNumber}-${bedNumber}`;
            updateData.room = combinedRoom;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: '沒有提供要更新的資料' }, { status: 400 });
        }
        
        // 7. 更新 profiles 表 (正確，select 的欄位均存在)
        const { data, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId)
            .select('id, student_id, username, role, room, created_at')
            .single();

        if (error) {
            console.error('Error updating user profile:', error);
            throw new Error(`更新 profiles 表失敗: ${error.message}`);
        }

        // 8. 獲取對應的電子信箱 (正確)
        const { data: authUsers, error: emailFetchError } = await supabase.auth.admin.listUsers();
        let email = '';
        if (authUsers?.users) {
            const authUser = authUsers.users.find(u => u.id === data.id);
            email = authUser?.email || '';
        }

        // --- START: 核心修正區塊 ---
        // 9. 從 demerit 表中計算該使用者的記點總數
        // 根據 Schema，demerit 表的 `id` 欄位關聯到 profiles 的 id
        const { count, error: demeritError } = await supabase
            .from('demerit')
            .select('id', { count: 'exact', head: true })
            .eq('id', userId); // 將 'user_id' 修正為 'id'
        // --- END: 核心修正區塊 ---

        if (demeritError) {
            console.error('Error fetching demerit count:', demeritError);
        }

        // 10. 格式化最終回傳的資料 (正確，欄位均存在)
        const formattedUser = {
            id: data.id,
            studentId: data.student_id || '',
            name: data.username || '',
            email: email,
            role: data.role,
            room: data.room || '',
            demerit: demeritError ? 0 : count,
            createdAt: data.created_at,
        };

        // 記錄成功操作 (正確)
        logSuccessAction('UPDATE_USER', '/api/users/[userId]', {
            adminId: authCheck.user.id,
            targetUserId: userId,
            changes: updateData
        });

        return NextResponse.json({
            success: true,
            data: formattedUser
        });

    } catch (error) {
        return handleApiError(error, '/api/users/[userId]');
    }
}