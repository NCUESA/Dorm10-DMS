import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { checkRateLimit, handleApiError } from '@/lib/apiMiddleware';

export async function POST(request) {
    try {
        // 1. Rate limiting 檢查 (保留)
        const rateLimitCheck = checkRateLimit(request, 'check-duplicate', 20, 60000);
        if (!rateLimitCheck.success) {
            return rateLimitCheck.error;
        }

        // 2. 從請求中獲取需要驗證的資料 (保留)
        const { email, student_id, room } = await request.json();

        if (!email || !student_id || !room) {
            return NextResponse.json(
                { error: '缺少必要的驗證欄位 (email, student_id, room)' },
                { status: 400 }
            );
        }

        // 3. 初始化 Supabase 客戶端 (保留)
        const supabase = supabaseServer;

        // 4. 初始化回傳狀態 (保留)
        let emailExists = false;
        let studentIdExists = false;
        let roomExists = false;

        // --- START: 核心修正區塊 ---
        // 5. 使用 `supabase.auth.admin.listUsers` 來安全地檢查 Email
        // 這是 Supabase 官方推薦的伺服器端用戶查詢方法
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({
            perPage: 1, // 我們只需要找到一個就夠了
        });

        if (authError) {
            console.error('Error listing users for email check:', authError);
            throw new Error('檢查電子郵件時發生錯誤');
        }

        // 在獲取的用戶列表中查找是否有匹配的 email
        if (users && users.some(user => user.email === email.toLowerCase())) {
            emailExists = true;
        }
        // --- END: core_fix_block ---

        // 6. 查詢 profiles 表中的 student_id 和 room (邏輯正確，保留)
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('student_id, room')
            .or(`student_id.eq.${student_id},room.eq.${room}`);

        if (profileError) {
            console.error('Error checking profile:', profileError);
            throw new Error('檢查學號或房號時發生錯誤');
        }

        if (profiles && profiles.length > 0) {
            for (const p of profiles) {
                if (p.student_id === student_id) {
                    studentIdExists = true;
                }
                if (p.room === room) {
                    roomExists = true;
                }
            }
        }

        // 7. 回傳最終的驗證結果 (保留)
        return NextResponse.json({
            emailExists,
            studentIdExists,
            roomExists,
        });

    } catch (error) {
        return handleApiError(error, '/api/check-duplicate');
    }
}