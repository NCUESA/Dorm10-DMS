"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { authService } from '@/lib/supabase/auth';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        // 初始載入時，立即獲取一次使用者狀態
        const getInitialUser = async () => {
            const result = await authService.getCurrentUser();
            if (result.success && result.user) {
                setUser(result.user);
            }
            setLoading(false);
        };
        
        getInitialUser();

        // 監聽後續的認證狀態變化
        const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
            // 不論是 SIGNED_IN 還是 TOKEN_REFRESHED，都重新獲取使用者完整資料
            if (session?.user) {
                const result = await authService.getCurrentUser();
                if (result.success && result.user) {
                    setUser(result.user);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const signUp = async (email, password, userData = {}) => {
        setError(null);
        const result = await authService.signUp(email, password, userData);
        if (!result.success) {
            setError(result.error);
        }
        return result;
    };

    const signIn = async (email, password) => {
        setError(null);
        const result = await authService.signIn(email, password);
        if (!result.success) {
            setError(result.error);
        }
        return result;
    };

    const signOut = async () => {
        setError(null);
        const result = await authService.signOut();
        if (result.success) {
            setUser(null);
            router.push('/login'); // 登出後跳轉到登入頁
        } else {
            setError(result.error);
        }
        return result;
    };
    
    const updateProfile = async (profileData) => {
        setError(null);
        const result = await authService.updateProfile(profileData);
        if (result.success) {
            // 更新成功後，重新獲取最新的 user 物件 (包含 profile)
            const refreshed = await authService.getCurrentUser();
            if (refreshed.success) {
                setUser(refreshed.user);
            }
        } else {
            setError(result.error);
        }
        return result;
    };

    // --- START: 核心修正區塊 ---
    // 補全所有函式，確保它們呼叫 authService 並回傳結果

    const resetPassword = async (email) => {
        setError(null);
        const result = await authService.resetPassword(email);
        if (!result.success) {
            setError(result.error);
        }
        return result;
    };

    const updatePassword = async (password) => {
        setError(null);
        const result = await authService.updatePassword(password);
        if (!result.success) {
            setError(result.error);
        }
        return result;
    };

    const verifyOtp = async (email, token, type = 'email') => {
        setError(null);
        const result = await authService.verifyOtp(email, token, type);
        if (!result.success) {
            setError(result.error);
        }
        return result;
    };

    const resendOtp = async (email, type = 'signup') => {
        setError(null);
        const result = await authService.resendOtp(email, type);
        if (!result.success) {
            setError(result.error);
        }
        return result;
    };
    // --- END: 核心修正區塊 ---


    const value = {
        user,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        verifyOtp,
        resendOtp,
        isAuthenticated: !!user,
        // isAdmin 的判斷應該來自合併後的 profile
        isAdmin: user?.profile?.role === 'admin',
        
        // 將 supabase client 實例本身也加入到 context value 中
        supabase,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};