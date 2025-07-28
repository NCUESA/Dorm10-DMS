"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function CreateAnnouncementModal({ isOpen, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [formData, setFormData] = useState({
      title: '',
      content: '',
      summary: '',
      category: '',
      applicationDeadline: '',
      applicationMethod: '',
      announcementDeadline: '',
      targetAudience: '',
      status: 'draft'
    });
  const [sources, setSources] = useState({
    pdfFiles: [],
    externalUrls: '',
    textContent: ''
  });
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      title: '',
      content: '',
      summary: '',
      category: '',
      applicationDeadline: '',
      applicationMethod: '',
      announcementDeadline: '',
      targetAudience: '',
      status: 'draft'
    });
    setSources({
      pdfFiles: [],
      externalUrls: '',
      textContent: ''
    });
    setAnalysisResult(null);
    setAnalysisError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileUpload = (files) => {
    setSources(prev => ({
      ...prev,
      pdfFiles: [...prev.pdfFiles, ...Array.from(files)]
    }));
  };

  const removeFile = (index) => {
    setSources(prev => ({
      ...prev,
      pdfFiles: prev.pdfFiles.filter((_, i) => i !== index)
    }));
  };

  const handleAiAnalysis = async () => {
    if (!sources.pdfFiles.length && !sources.externalUrls && !sources.textContent) {
      setAnalysisError('請至少提供一種資料來源');
      return;
    }

    setAiAnalyzing(true);
    setAnalysisError('');

    try {
      // 模擬 AI 分析過程
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 模擬 AI 分析結果
      const mockResult = {
        title: '國際學程交流協會中華民國總會「開蒙愛‧讀夢想起飛-國立大學清寒女學生助學方案」',
        summary: `
大一新生及大二學生錄取後補助2年學雜費；大二及大三學生需重新申請。

大二及大四學生錄取後補助1年學雜費（大二學生於大三時重重新申請）。

特殊經濟困難個案經核准後，可額外補助雜費及住宿費。
        `.trim(),
        category: 'C',
        applicationDeadline: '2025-07-23',
        applicationMethod: '線上系統申請',
        targetAudience: `
申請對象：
1. 申請書（需家長及學生本人簽名，黏貼2吋大頭照1張，就讀年級請填寫14學年2年級）。
2. 戶年成績單（需含積計成績）：大一新生請提供高三全學年成績單（含會考成績表現）或本校取通知單。
3. 大一新生及碩學生需加附3-2學期期成績單，前往本組統一函附。
4. 全戶設戶籍分戶資本（印父母不同戶籍，需一併檢附）。
5. 全戶113年所得及財產清單。
6. 其他家庭狀況左證資料（如重大傷病卡、身障手冊、醫院診療證明等，影本請於文件右下方加蓋「與正本相符」並署名功能；日期；無則免）。
        `.trim()
      };

      setAnalysisResult(mockResult);
      setFormData(prev => ({
        ...prev,
        ...mockResult
      }));
      setCurrentStep(3);
    } catch (error) {
      setAnalysisError('AI 分析失敗，請稍後再試');
    }

    setAiAnalyzing(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('announcements')
        .insert([{
          title: formData.title,
          content: formData.content,
          summary: formData.summary,
          category: formData.category,
          application_deadline: formData.applicationDeadline || null,
          application_method: formData.applicationMethod,
          announcement_deadline: formData.announcementDeadline || null,
          target_audience: formData.targetAudience,
          status: formData.status,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      onSuccess(data);
      handleClose();
      alert('公告創建成功！');
    } catch (error) {
      console.error('創建公告失敗:', error);
      alert('創建失敗，請稍後再試');
    }

    setLoading(false);
  };

  const handleQuickPublish = () => {
    if (!formData.title.trim()) {
      alert('請填寫公告標題');
      return;
    }
    
    setFormData(prev => ({ ...prev, status: 'published' }));
    handleSubmit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={handleClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* 標題列 */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">新增獎學金公告</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* 步驟指示器 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">提供來源</span>
                </div>
                <div className={`flex items-center ${currentStep >= 2 ? 'text-red-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep >= 2 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">AI 分析</span>
                </div>
                <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium">審閱儲存</span>
                </div>
              </div>
            </div>
          </div>

          {/* 內容區域 */}
          <div className="px-6 py-6">
            {currentStep === 1 && (
              <Step1ProvideSource 
                sources={sources}
                setSources={setSources}
                onFileUpload={handleFileUpload}
                onRemoveFile={removeFile}
                onNext={() => setCurrentStep(2)}
                onQuickPublish={() => setCurrentStep(3)}
              />
            )}

            {currentStep === 2 && (
              <Step2AiAnalysis
                sources={sources}
                analysisResult={analysisResult}
                analysisError={analysisError}
                aiAnalyzing={aiAnalyzing}
                onAnalyze={handleAiAnalysis}
                onBack={() => setCurrentStep(1)}
                onNext={() => setCurrentStep(3)}
              />
            )}

            {currentStep === 3 && (
              <Step3ReviewAndSave
                formData={formData}
                setFormData={setFormData}
                analysisResult={analysisResult}
                loading={loading}
                onBack={() => setCurrentStep(analysisResult ? 2 : 1)}
                onSave={handleSubmit}
                onQuickPublish={handleQuickPublish}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 步驟1：提供資料來源
function Step1ProvideSource({ sources, setSources, onFileUpload, onRemoveFile, onNext, onQuickPublish }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          步驟一：提供資料來源 (AI 分析，可選)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左側：資料來源選項 */}
          <div>
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    checked={sources.pdfFiles.length > 0}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        setSources(prev => ({ ...prev, pdfFiles: [] }));
                      }
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">PDF 檔案</span>
                </label>
                {sources.pdfFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {sources.pdfFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <button
                          onClick={() => onRemoveFile(index)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          移除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">外部網址</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">文字內容</span>
                </label>
              </div>
            </div>

            <div className="mt-6">
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={(e) => onFileUpload(e.target.files)}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 cursor-pointer"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                AI 摘要
              </label>
            </div>
          </div>

          {/* 右側：表單欄位 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公告狀態</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                <option>下架 (草稿)</option>
                <option>已發布</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">獎學金分類</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                <option>N/A</option>
                <option>A</option>
                <option>B</option>
                <option>C</option>
                <option>D</option>
                <option>E</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">申請截止日期</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公告下架日期</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">適用對象</label>
              <textarea
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="請描述獎學金適用對象..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* 底部按鈕 */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onQuickPublish}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          略過 AI 分析，直接編輯
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          下一步：AI 分析
        </button>
      </div>
    </div>
  );
}

// 步驟2：AI 分析
function Step2AiAnalysis({ sources, analysisResult, analysisError, aiAnalyzing, onAnalyze, onBack, onNext }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          步驟二：AI 分析
        </h3>
        
        {analysisError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">分析失敗：{analysisError}</p>
          </div>
        )}

        {!analysisResult && !aiAnalyzing && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="mt-4 text-gray-600">準備進行 AI 分析</p>
            <button
              onClick={onAnalyze}
              className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              開始 AI 分析
            </button>
          </div>
        )}

        {aiAnalyzing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">AI 正在分析資料，請稍候...</p>
          </div>
        )}

        {analysisResult && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-800 font-medium">AI 分析完成</span>
            </div>
            <p className="text-green-700 text-sm">已成功分析並自動填入表單欄位，請前往下一步進行審閱。</p>
          </div>
        )}
      </div>

      {/* 底部按鈕 */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          上一步
        </button>
        {analysisResult && (
          <button
            onClick={onNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            下一步：審閱內容
          </button>
        )}
      </div>
    </div>
  );
}

// 步驟3：審閱與儲存
function Step3ReviewAndSave({ formData, setFormData, analysisResult, loading, onBack, onSave, onQuickPublish }) {
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          步驟三：審閱與編輯
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              公告標題 (必填)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="請輸入公告標題"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              公告摘要 (必填)
            </label>
            <div className="relative">
              <textarea
                rows={6}
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="請輸入公告摘要"
              />
              {analysisResult && (
                <button className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-xs">
                  重新生成摘要
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">獎學金分類</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">請選擇分類</option>
                <option value="A">A - 各縣市政府獎助學金</option>
                <option value="B">B - 縣市政府以外之各級公家機關及公營事業獎助學金</option>
                <option value="C">C - 宗教會及民間各項指定分類獎助學金</option>
                <option value="D">D - 各民間團體、經濟不利、學業優良或其他無法歸納之獎助學金</option>
                <option value="E">E - 獎學金特殊案件公告</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公告狀態</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="draft">草稿</option>
                <option value="published">已發布</option>
                <option value="archived">已封存</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">申請截止日期</label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">申請方式</label>
              <input
                type="text"
                value={formData.applicationMethod}
                onChange={(e) => handleInputChange('applicationMethod', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公告下架日期</label>
              <input
                type="date"
                value={formData.announcementDeadline}
                onChange={(e) => handleInputChange('announcementDeadline', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">適用對象</label>
            <textarea
              rows={6}
              value={formData.targetAudience}
              onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="請描述獎學金適用對象、申請條件等詳細資訊"
            />
          </div>
        </div>
      </div>

      {/* 底部按鈕 */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={loading}
        >
          上一步
        </button>
        <div className="flex space-x-3">
          <button
            onClick={onSave}
            disabled={loading || !formData.title.trim()}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? '儲存中...' : '儲存'}
          </button>
          <button
            onClick={onQuickPublish}
            disabled={loading || !formData.title.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '發布中...' : '儲存公告'}
          </button>
        </div>
      </div>
    </div>
  );
}
