"use client";

import { useState, useEffect } from 'react';
import { authService } from '@/lib/auth/supabase-auth';

export default function AuthTestPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  // 表單狀態
  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    name: ''
  });
  
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    // 檢查當前用戶狀態
    checkUser();
    
    // 監聽認證狀態變化
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null);
        setMessage('用戶已登入');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setMessage('用戶已登出');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    setLoading(true);
    const result = await authService.getCurrentUser();
    if (result.success) {
      setUser(result.user);
    } else {
      setMessage(result.error);
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await authService.signUp(
      signUpForm.email, 
      signUpForm.password,
      { name: signUpForm.name }
    );
    
    if (result.success) {
      setMessage('註冊成功！請檢查您的電子郵件以確認帳號。');
      setSignUpForm({ email: '', password: '', name: '' });
    } else {
      setMessage(`註冊失敗: ${result.error}`);
    }
    
    setLoading(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await authService.signIn(signInForm.email, signInForm.password);
    
    if (result.success) {
      setUser(result.data.user);
      setMessage('登入成功！');
      setSignInForm({ email: '', password: '' });
    } else {
      setMessage(`登入失敗: ${result.error}`);
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    const result = await authService.signOut();
    
    if (result.success) {
      setUser(null);
      setMessage('已成功登出');
    } else {
      setMessage(`登出失敗: ${result.error}`);
    }
    
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!signInForm.email) {
      setMessage('請先輸入電子郵件地址');
      return;
    }
    
    setLoading(true);
    const result = await authService.resetPassword(signInForm.email);
    
    if (result.success) {
      setMessage('密碼重設郵件已發送，請檢查您的信箱');
    } else {
      setMessage(`重設密碼失敗: ${result.error}`);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Supabase 認證測試
          </h1>

          {/* 消息顯示 */}
          {message && (
            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-blue-800">{message}</p>
            </div>
          )}

          {/* 當前用戶狀態 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">當前用戶狀態</h2>
            <div className={`p-4 rounded-lg ${user ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              {user ? (
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    ✅ 已登入用戶
                  </h3>
                  <div className="space-y-1 text-green-800">
                    <p><strong>用戶ID:</strong> {user.id}</p>
                    <p><strong>電子郵件:</strong> {user.email}</p>
                    <p><strong>電子郵件已驗證:</strong> {user.email_confirmed_at ? '是' : '否'}</p>
                    <p><strong>創建時間:</strong> {new Date(user.created_at).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    登出
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    未登入
                  </h3>
                  <p className="text-gray-600">請使用下方表單登入或註冊</p>
                </div>
              )}
            </div>
          </div>

          {!user && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* 註冊表單 */}
              <div>
                <h2 className="text-xl font-semibold mb-4">用戶註冊</h2>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      姓名
                    </label>
                    <input
                      type="text"
                      value={signUpForm.name}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電子郵件
                    </label>
                    <input
                      type="email"
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      密碼
                    </label>
                    <input
                      type="password"
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      minLength={6}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    註冊
                  </button>
                </form>
              </div>

              {/* 登入表單 */}
              <div>
                <h2 className="text-xl font-semibold mb-4">用戶登入</h2>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電子郵件
                    </label>
                    <input
                      type="email"
                      value={signInForm.email}
                      onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      密碼
                    </label>
                    <input
                      type="password"
                      value={signInForm.password}
                      onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    登入
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="w-full px-4 py-2 text-blue-600 hover:text-blue-800 focus:outline-none focus:underline disabled:opacity-50"
                  >
                    忘記密碼？
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 說明文字 */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">
              測試說明
            </h3>
            <ul className="space-y-2 text-yellow-800">
              <li><strong>註冊:</strong> 填寫表單創建新帳號，Supabase 會發送確認郵件</li>
              <li><strong>登入:</strong> 使用已註冊的帳號登入系統</li>
              <li><strong>登出:</strong> 清除當前用戶會話</li>
              <li><strong>重設密碼:</strong> 發送重設密碼郵件到指定信箱</li>
              <li><strong>實時更新:</strong> 認證狀態變化會即時反映在界面上</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
