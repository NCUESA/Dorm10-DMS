"use client";

import React from "react";

/**
 * 使用說明組件
 */
export default function UsageTab() {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          智慧公告發布流程說明
        </h2>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 步驟1 */}
          <div className="relative">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold text-lg mb-4">
              1
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">提供資料來源 (AI 分析)</h3>
            <p className="text-sm text-gray-600">
              點擊「新增公告」，在步驟一中提供一個或多個資料來源（PDF、
              外部網址、文字內容）。提供的資料越完整，「智慧填入」AI 分析的
              準確度越高。
            </p>
          </div>

          {/* 步驟2 */}
          <div className="relative">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold text-lg mb-4">
              2
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">審閱與發布</h3>
            <p className="text-sm text-gray-600">
              AI 會自動填寫所有資料欄位並幫填入所有欄位欄位，您可以在此
              基礎上進行最終審閱、修改，然後儲存並發布公告。
            </p>
          </div>

          {/* 步驟3 */}
          <div className="relative">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold text-lg mb-4">
              3
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">快速發布 (省略前兩步驟，直接發布)</h3>
            <p className="text-sm text-gray-600">
              您也可完全略過 AI 分析流程，直接在步驟三的「公告標題」和
              「公告摘要」中手動填寫內容，即可啟用快速發
              布。
            </p>
          </div>
        </div>

        {/* 使用提醒 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-2">使用提醒</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>參考資料完整性</strong>：請盡可能上傳有參考資料來源（包括 PDF、網址、純文字內容），越多的參考資料，AI 摘要的效果越佳。即時讀者是學生獲金公告資訊下載取相關 PDF，並上傳至主平台會設資料來源。</li>
                <li>• <strong>靈活選免錯誤</strong>：多檢查之 PDF（掃描非文字檔）雖然可以正確讀取並生成摘要，但會無法加入 AI 參考資料，請盡可能避免。</li>
                <li>• <strong>公告發布原則</strong>：如欲修改公告，建議創建新公告而不要直接修改原公告（需多線路讀取或 PDF 可能會無法正確引入或 AI 資料讀）。</li>
                <li>• <strong>錯誤回報</strong>：由於此 AI 摘要的工作流程其難雜，因此難以避免有錯誤，有錯誤時請必空白域我們快速解決。</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
