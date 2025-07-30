"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

export default function AIAssistant() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setIsRedirecting(true);
      // 未登入時跳轉到登入頁面
      router.push('/login?redirect=/ai-assistant');
    }
  }, [isAuthenticated, loading, router]);

  const handleStartAnalysis = () => {
    router.push('/ai-assistant/chat');
  };

  // 顯示載入狀態
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isRedirecting ? '正在跳轉到登入頁面...' : '載入中...'}
          </p>
        </div>
      </div>
    );
  }

  // 如果未登入，不渲染內容（已經在 useEffect 中處理跳轉）
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI 獎學金助理
            </h1>
            <p className="text-gray-600">
              讓AI幫您找到最適合的獎學金申請機會
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">🎯 智能推薦</h3>
              <p className="text-blue-700">
                根據您的學業成績、科系、年級等條件，AI會為您推薦最合適的獎學金項目。
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-3">📋 申請指導</h3>
              <p className="text-green-700">
                提供詳細的申請流程指導，包括所需文件、截止日期等重要資訊。
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">開始使用</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <p className="text-gray-700">完善您的個人資料，包括科系、年級、成績等資訊</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <p className="text-gray-700">與AI助理對話，描述您的需求和條件</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <p className="text-gray-700">獲得個人化的獎學金推薦清單</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={handleStartAnalysis}
              disabled={loading || isRedirecting}
              size="lg"
            >
              開始AI分析
            </Button>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-yellow-800 font-medium">注意事項</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  AI助理會根據現有的獎學金資料庫提供建議，實際申請前請務必確認最新的申請條件和截止日期。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
