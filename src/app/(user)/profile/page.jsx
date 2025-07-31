"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import { Eye, EyeOff } from "lucide-react";

// 設定 zxcvbn
zxcvbnOptions.setOptions({
  dictionary: {
    userInputs: ['ncue', 'scholarship', 'changhua', 'student']
  }
});

// 密碼輸入框元件，含強度顯示
const PasswordField = ({ id, name, placeholder, value, onChange, error, passwordStrength, isConfirmField = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const strength = !isConfirmField && value ? passwordStrength(value) : null;

  const strengthLevels = [
    { text: '非常弱', lightColor: 'bg-red-200', color: 'bg-red-500', textColor: 'text-red-600' },
    { text: '弱', lightColor: 'bg-orange-200', color: 'bg-orange-500', textColor: 'text-orange-600' },
    { text: '中等', lightColor: 'bg-yellow-200', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { text: '強', lightColor: 'bg-green-200', color: 'bg-green-500', textColor: 'text-green-600' },
    { text: '非常強', lightColor: 'bg-emerald-200', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  ];

  const currentStrength = strength ? strengthLevels[strength.score] : null;
  const widthPercentage = strength ? (strength.score + 1) * 20 : 0;

  return (
    <div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.993.883L4 8v10a1 1 0 00.883.993L5 19h10a1 1 0 00.993-.883L16 18V8a1 1 0 00-.883-.993L15 7h-1V6a4 4 0 00-4-4zm0 1.5a2.5 2.5 0 012.5 2.5V7h-5V6a2.5 2.5 0 012.5-2.5z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`block w-full rounded-md border-0 py-2.5 pl-10 pr-10 text-gray-900 ring-1 ring-inset ${error ? 'ring-red-500' : 'ring-gray-300'} placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
          required
        />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {!isConfirmField && currentStrength && (
        <div className="mt-2">
          <div className={`h-1.5 w-full rounded-full ${currentStrength.lightColor}`}>
            <div className={`h-full rounded-full ${currentStrength.color} transition-all duration-300`} style={{ width: `${widthPercentage}%` }} />
          </div>
          <p className={`mt-1 text-xs font-medium ${currentStrength.textColor}`}>{currentStrength.text}</p>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, signOut, updatePassword } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');

  useEffect(() => {
    // 如果未登入，重定向到登入頁面
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    // 從用戶物件中提取個人資料
    if (user) {
      setProfileData({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || '',
        student_id: user.user_metadata?.student_id || '',
        department: user.user_metadata?.department || '',
        year: user.user_metadata?.year || '',
        email_verified: user.email_confirmed_at !== null,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (pwErrors[name]) setPwErrors(prev => ({ ...prev, [name]: '' }));
    if (pwErrors.submit) setPwErrors(prev => ({ ...prev, submit: '' }));
    if (pwMessage) setPwMessage('');
  };

  const getPasswordStrength = (password) => zxcvbn(password);

  const validatePasswordForm = () => {
    const newErrors = {};
    if (getPasswordStrength(passwordData.password).score < 2) newErrors.password = '密碼強度不足，請嘗試更複雜的組合';
    if (passwordData.password !== passwordData.confirmPassword) newErrors.confirmPassword = '兩次輸入的密碼不一致';
    return newErrors;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validatePasswordForm();
    if (Object.keys(newErrors).length > 0) {
      setPwErrors(newErrors);
      return;
    }
    setPwLoading(true);
    setPwErrors({});
    try {
      const result = await updatePassword(passwordData.password);
      if (result.success) {
        setPwMessage('密碼已更新');
        setPasswordData({ password: '', confirmPassword: '' });
      } else {
        setPwErrors({ submit: result.error });
      }
    } catch (error) {
      setPwErrors({ submit: '更新密碼失敗，請稍後再試' });
    } finally {
      setPwLoading(false);
    }
  };

  // 載入中狀態
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

  // 未登入時不顯示任何內容（會被重定向）
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">個人資料</h1>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => router.push('/profile/edit')}>編輯資料</Button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                登出
              </button>
            </div>
          </div>

          {profileData && (
            <div className="space-y-6">
              {/* 基本資訊 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-4">
                  基本資訊
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電子郵件
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-900">{profileData.email}</span>
                      {profileData.email_verified ? (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          已驗證
                        </span>
                      ) : (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          待驗證
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {profileData.name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        姓名
                      </label>
                      <span className="text-gray-900">{profileData.name}</span>
                    </div>
                  )}
                  
                  {profileData.student_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        學號
                      </label>
                      <span className="text-gray-900">{profileData.student_id}</span>
                    </div>
                  )}
                  
                  {profileData.department && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        系所
                      </label>
                      <span className="text-gray-900">{profileData.department}</span>
                    </div>
                  )}
                  
                  {profileData.year && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        年級
                      </label>
                      <span className="text-gray-900">{profileData.year}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 帳號狀態 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  帳號狀態
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      用戶ID
                    </label>
                    <span className="text-sm text-gray-900 font-mono">{profileData.id}</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      註冊時間
                    </label>
                    <span className="text-gray-900">
                      {new Date(profileData.created_at).toLocaleString('zh-TW')}
                    </span>
                  </div>
                  
                  {profileData.last_sign_in && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        最後登入時間
                      </label>
                      <span className="text-gray-900">
                        {new Date(profileData.last_sign_in).toLocaleString('zh-TW')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 重設密碼 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-yellow-900 mb-4">
                  重設密碼
                </h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <PasswordField
                    id="password"
                    name="password"
                    placeholder="設定新密碼"
                    value={passwordData.password}
                    onChange={handlePasswordChange}
                    error={pwErrors.password}
                    passwordStrength={getPasswordStrength}
                  />
                  <PasswordField
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="再次輸入新密碼"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={pwErrors.confirmPassword}
                    isConfirmField={true}
                  />
                  {pwErrors.submit && (
                    <p className="text-sm text-red-600">{pwErrors.submit}</p>
                  )}
                  {pwMessage && (
                    <p className="text-sm text-green-600">{pwMessage}</p>
                  )}
                  <div className="flex justify-end">
                    <Button type="submit" loading={pwLoading}>更新密碼</Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
