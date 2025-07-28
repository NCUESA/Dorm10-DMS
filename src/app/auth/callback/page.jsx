'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('處理中...');
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 處理認證回調
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('認證回調錯誤:', error);
          setStatus('驗證失敗，請重試');
          setTimeout(() => router.push('/auth/login'), 3000);
          return;
        }

        if (data?.session?.user) {
          const user = data.session.user;
          console.log('用戶驗證成功:', user.id);

          // 檢查是否已有 profile 記錄
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            // 沒有找到 profile，嘗試創建
            console.log('未找到用戶檔案，嘗試從 user_metadata 創建');
            
            const metadata = user.user_metadata || {};
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                name: metadata.name || '',
                student_id: metadata.student_id || '',
                department: metadata.department || '',
                year: metadata.year || '',
                role: 'user'
              });

            if (insertError) {
              console.error('創建用戶檔案失敗:', insertError);
              // 即使檔案創建失敗，用戶仍可以登入
            } else {
              console.log('用戶檔案創建成功');
            }
          } else if (profile) {
            console.log('用戶檔案已存在:', profile);
          }

          setStatus('驗證成功！正在跳轉...');
          
          // 跳轉到主頁面或管理頁面
          setTimeout(() => {
            router.push('/manage');
          }, 1500);
        } else {
          setStatus('未找到有效的認證會話');
          setTimeout(() => router.push('/auth/login'), 3000);
        }
      } catch (error) {
        console.error('處理認證回調時發生錯誤:', error);
        setStatus('處理過程中發生錯誤');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">處理認證中</h1>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
