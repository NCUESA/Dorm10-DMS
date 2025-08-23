"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function DemeritPage() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [loading, isAuthenticated, router]);

    if (loading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center p-4">
                <span className="text-gray-600">載入中...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 my-16">
            <h1 className="text-3xl font-bold mb-6">違規記點</h1>
            <p className="text-lg">
                目前記點：<span className="font-semibold text-red-600">{user?.profile?.demerit ?? 0}</span>
            </p>
        </div>
    );
}
