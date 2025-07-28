"use client";

import { useState, useEffect } from 'react';
import { supabase, testConnection, getDatabaseInfo } from '@/lib/supabase';

export default function SupabaseTestPage() {
  const [connectionStatus, setConnectionStatus] = useState({
    loading: true,
    success: false,
    message: '',
    error: null
  });
  
  const [databaseInfo, setDatabaseInfo] = useState(null);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    performTests();
  }, []);

  const performTests = async () => {
    setConnectionStatus({ loading: true, success: false, message: '', error: null });

    try {
      // 測試基本連線
      const connectionResult = await testConnection();
      
      if (connectionResult.success) {
        setConnectionStatus({
          loading: false,
          success: true,
          message: connectionResult.message,
          error: null
        });

        // 嘗試獲取數據庫信息
        try {
          const dbInfo = await getDatabaseInfo();
          if (dbInfo.success) {
            setDatabaseInfo(dbInfo.data);
          }
        } catch (err) {
          console.log('Database info not available:', err);
        }

        // 嘗試列出可用的表
        try {
          const { data: tableData, error: tableError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(10);

          if (!tableError && tableData) {
            setTables(tableData);
          }
        } catch (err) {
          console.log('Tables info not available:', err);
        }

      } else {
        setConnectionStatus({
          loading: false,
          success: false,
          message: '',
          error: connectionResult.error
        });
      }
    } catch (err) {
      setConnectionStatus({
        loading: false,
        success: false,
        message: '',
        error: err.message
      });
    }
  };

  const testAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        alert(`認證測試失敗: ${error.message}`);
      } else if (user) {
        alert(`當前用戶: ${user.email}`);
      } else {
        alert('目前未登入任何用戶');
      }
    } catch (err) {
      alert(`認證測試錯誤: ${err.message}`);
    }
  };

  const testAnonymousSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        alert(`匿名登入失敗: ${error.message}`);
      } else {
        alert(`匿名登入成功！用戶ID: ${data.user?.id}`);
      }
    } catch (err) {
      alert(`匿名登入錯誤: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Supabase 連線測試
          </h1>

          {/* 連線狀態 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">連線狀態</h2>
            <div className={`p-4 rounded-lg ${
              connectionStatus.loading 
                ? 'bg-yellow-50 border border-yellow-200' 
                : connectionStatus.success 
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
            }`}>
              {connectionStatus.loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mr-3"></div>
                  <span className="text-yellow-800">測試連線中...</span>
                </div>
              ) : connectionStatus.success ? (
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    ✅ 連線成功！
                  </h3>
                  <p className="text-green-800">{connectionStatus.message}</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    ❌ 連線失敗
                  </h3>
                  <p className="text-red-800">{connectionStatus.error}</p>
                </div>
              )}
            </div>
          </div>

          {/* 環境變數檢查 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">環境變數檢查</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="font-medium w-32">Supabase URL:</span>
                  <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ 已設置' : '✗ 未設置'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium w-32">Anon Key:</span>
                  <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ 已設置' : '✗ 未設置'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 數據庫信息 */}
          {databaseInfo && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">數據庫信息</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <pre className="text-sm text-blue-800">{JSON.stringify(databaseInfo, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* 可用表格 */}
          {tables.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">可用表格</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {tables.map((table, index) => (
                    <div key={index} className="bg-white px-3 py-2 rounded border">
                      {table.table_name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 測試按鈕 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">功能測試</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={performTests}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                重新測試連線
              </button>
              <button
                onClick={testAuth}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                測試認證狀態
              </button>
              <button
                onClick={testAnonymousSignIn}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              >
                測試匿名登入
              </button>
            </div>
          </div>

          {/* 說明文字 */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">
              測試說明
            </h3>
            <ul className="space-y-2 text-yellow-800">
              <li><strong>連線測試:</strong> 檢查是否能成功連接到 Supabase</li>
              <li><strong>環境變數:</strong> 確認必要的環境變數是否正確設置</li>
              <li><strong>認證測試:</strong> 檢查當前的用戶認證狀態</li>
              <li><strong>匿名登入:</strong> 測試 Supabase 的匿名認證功能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
