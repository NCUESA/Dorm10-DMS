'use client';

const UsageStep = ({ number, title, children }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
      {number}
    </div>
    <div>
      <h5 className="font-semibold text-lg text-gray-800">{title}</h5>
      <p className="text-gray-600 mt-1">{children}</p>
    </div>
  </div>
);

const AdviceCard = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center mb-3">
        <svg className="w-6 h-6 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h5 className="font-semibold text-gray-800">{title}</h5>
      </div>
      <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
        {children}
      </ul>
    </div>
);


export default function UsageTab() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="p-8 bg-white rounded-lg shadow-sm border border-gray-200/80">
        <div className="flex items-center mb-6">
          <svg className="w-8 h-8 text-indigo-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h3 className="text-2xl font-bold text-gray-900">智慧公告發布流程說明</h3>
        </div>
        
        <div className="space-y-6">
          <UsageStep number="1" title="提供資料來源 (AI 分析)">
            點擊「新增公告」，在步驟一中提供一個或多個資料來源（PDF、外部網址、文字內容）。提供的資料越完整、越豐富，AI 分析的準確度越高。
          </UsageStep>
          
          <UsageStep number="2" title="審閱與發布">
            AI 會自動讀取所有來源、生成摘要並填寫右側欄位。您可以在此基礎上進行最終審閱、修改，然後儲存並發布公告。
          </UsageStep>
          
          <UsageStep number="3" title="快速發布 (省略前二步驟，直接發布)">
            您也可以完全略過 AI 分析流程。直接在步驟三的「公告標題」和「公告摘要」中手動填寫內容，即可啟用儲存按鈕，進行快速發布。
          </UsageStep>
        </div>
      </div>

      <AdviceCard title="使用提醒">
        <li>
            <strong>參考資料完整性</strong>：請盡可能上傳所有參考資料來源(包括 PDF、網址、純文字內容)，越多的參考資料，AI 摘要的效果會更好。意即請盡量至獎學金提供者官網下載相關 PDF，並上傳至此平台當成資料源。
        </li>
        <li>
            <strong>盡量避免掃描檔</strong>：多模態之 PDF (掃描之非文字檔) 雖然可以正確讀取並生成摘要，但會無法加入 AI 參考資料，請盡可能避免。
        </li>
        <li>
            <strong>公告發布原則</strong>：如欲修改公告，建議創建新公告而不要直接修改原公告(需多模態讀取之 PDF 可能會無法正確被引入成 AI 資料源)。
        </li>
        <li>
            <strong>錯誤回報</strong>：由於此 AI 摘要的工作流極其複雜，因此難以避免有邏輯錯誤，有錯誤時請務必回報以讓開發者快速解決。
        </li>
      </AdviceCard>
    </div>
  );
}
