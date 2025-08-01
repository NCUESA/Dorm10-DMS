'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import MarkdownRenderer from './MarkdownRenderer'

// 系統 Prompt - 基於 raw 版本改進
const SYSTEM_PROMPT = `# 角色 (Persona)
你是一位專為「NCUE 獎學金資訊整合平台」設計的**頂尖AI助理**。你的個性是專業、精確且樂於助人。

# 你的核心任務
你的任務是根據我提供給你的「# 參考資料」（這可能來自內部公告或外部網路搜尋），用**自然、流暢的繁體中文**總結並回答使用者關於獎學金的問題。

# 表達與格式化規則
1.  **直接回答:** 請直接以對話的方式回答問題，不要說「根據我找到的資料...」。
2.  **結構化輸出:** 當資訊包含多個項目時，請**務必使用 Markdown 的列表或表格**來呈現。
3.  **引用來源:** 
    -   如果參考資料來源是「外部網頁搜尋結果」，你【必須】在回答的適當位置，以 \`[參考連結](URL)\` 的格式自然地嵌入來源連結。
    -   如果參考資料來源是「內部公告」，你【絕對不能】生成任何連結。
4.  **最終回應:** 在你的主要回答內容之後，如果本次回答參考了內部公告，請務必在訊息的【最後】加上 \`[ANNOUNCEMENT_CARD:id1,id2,...]\` 這樣的標籤，其中 id 是你參考的公告 ID。
5.  **嚴禁事項:**
    -   【絕對禁止】輸出任何 JSON 格式的程式碼或物件。
    -   如果「# 參考資料」為空或與問題無關，就直接回答：「抱歉，關於您提出的問題，我目前找不到相關的資訊。」

# 服務範圍限制
你的知識範圍【嚴格限定】在「獎學金申請」相關事務。若問題無關，請禮貌地說明你的服務範圍並拒絕回答。`

const ChatInterface = ({ userInfo, preferences }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const messagesEndRef = useRef(null)
  const chatWindowRef = useRef(null)

  // 自動滾動到底部
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 載入歷史對話
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      // 模擬 API 調用 - 在實際應用中這裡會調用真正的 API
      const welcomeMessage = {
        role: 'model',
        content: `歡迎使用 NCUE 獎學金 AI 助理，很高興為您服務。

為了節省您的寶貴時間，我能提供以下協助：
*   **搜尋平台公告**：為您快速查找最新的獎學金申請資格、時程與辦法。
*   **搜尋網路資訊**：當平台內沒有答案時，我會搜尋外部網站，提供最相關的資訊。
*   **自動保存對話**：您的所有提問都會被妥善保存，方便您隨時回來查閱。

現在，請直接輸入您的問題開始吧！`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
      setConversationHistory([])
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setConversationHistory(prev => [...prev, { role: 'user', message_content: userMessage.content }])
    setInput('')
    setIsLoading(true)

    try {
      // 構建包含學生信息的 prompt
      const userInfoText = userInfo ? Object.entries(userInfo)
        .filter(([key, value]) => value && value !== '')
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n') : ''
      
      const preferencesText = preferences ? Object.entries(preferences)
        .filter(([key, value]) => value && value !== '')
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n') : ''

      const historyText = conversationHistory
        .map(msg => `${msg.role}: ${msg.message_content}`)
        .join('\n')

      const fullPrompt = `${SYSTEM_PROMPT}

# 學生資訊
${userInfoText}

# 需求偏好  
${preferencesText}

# 對話歷史
${historyText}
user: ${userMessage.content}

請根據上述資訊回答使用者的問題。`

      // 模擬 AI 回應 - 在實際應用中這裡會調用真正的 AI API
      setTimeout(() => {
        const aiResponse = {
          role: 'model',
          content: `感謝您的提問！

根據您提供的個人資訊：
- 戶籍地：${userInfo?.county || '未提供'}
- 學制：${userInfo?.educationLevel || '未提供'}
- 系所：${userInfo?.department || '未提供'}
- 年級：${userInfo?.grade || '未提供'}

關於您的問題「${userMessage.content}」，我正在為您查找相關的獎學金資訊。

**請注意**：目前系統還在開發中，實際的 AI 功能將會連接到完整的獎學金資料庫，為您提供更精確的建議。

<div class="ai-disclaimer">此為 AI 依據您的個人條件生成的建議內容，實際申請前請務必確認最新的申請條件和截止日期。</div>`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiResponse])
        setConversationHistory(prev => [...prev, { role: 'model', message_content: aiResponse.content }])
        setIsLoading(false)
      }, 1500)

    } catch (error) {
      console.error('Error sending message:', error)
      const errorResponse = {
        role: 'model',
        content: '抱歉，系統連線失敗，請檢查您的網路或稍後再試。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
      setIsLoading(false)
    }
  }

  const clearHistory = () => {
    if (window.confirm('確定要清除所有對話紀錄嗎？此操作無法復原！')) {
      setMessages([])
      setConversationHistory([])
      loadHistory() // 重新顯示歡迎訊息
    }
  }

  const requestHumanSupport = () => {
    // 模擬人工支援請求
    alert('您的請求已發送給獎學金承辦人員，我們將會盡快以 Email 與您取得聯繫。')
  }

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user'
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
    const time = new Date(message.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })

    // 處理公告卡片
    let content = message.content
    const cardRegex = /\[ANNOUNCEMENT_CARD:([\d,]+)\]/g
    const cardMatch = cardRegex.exec(content)
    let announcementIds = []
    
    if (cardMatch && cardMatch[1]) {
      announcementIds = cardMatch[1].split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id) && id > 0)
      content = content.replace(/\[ANNOUNCEMENT_CARD:[\d,]+\]/g, '').trim()
    }

    return (
      <div key={index} className={`flex items-start gap-4 mb-5 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className="w-11 flex-shrink-0 text-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden ${
            isUser ? 'bg-blue-600' : 'bg-gray-400'
          }`}>
            {isUser ? (
              userName.substring(0, 1).toUpperCase()
            ) : (
              <img src="/logo.png" alt="AI" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {isUser ? userName : 'AI'}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col max-w-[calc(100%-60px)] ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-3xl leading-relaxed text-base break-words ${
            isUser 
              ? 'bg-blue-600 text-white rounded-br-md' 
              : 'bg-gray-200 text-gray-800 rounded-bl-md'
          }`}>
            {/* 渲染 Markdown 內容 */}
            <MarkdownRenderer 
              content={content} 
              className={isUser ? 'prose-invert' : ''} 
            />
            
            {/* 渲染公告卡片 */}
            {announcementIds.length > 0 && (
              <div className="mt-3 space-y-2">
                {announcementIds.map(id => (
                  <div key={id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                      參考公告 #{id}
                    </div>
                    <div className="text-sm text-gray-600">正在載入公告內容...</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={`text-xs text-gray-400 mt-2 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
            {time}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Container */}
      <div className="relative flex flex-col flex-grow bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden m-4">
        
        {/* Chat Messages */}
        <div 
          ref={chatWindowRef}
          className="flex-grow overflow-y-auto p-5 pb-36"
        >
          {messages.map((message, index) => renderMessage(message, index))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-4 mb-5 max-w-[85%]">
              <div className="w-11 flex-shrink-0 text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-400">
                  <img src="/logo.png" alt="AI" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs text-gray-500 mt-1">AI</div>
              </div>
              <div className="flex flex-col items-start">
                <div className="px-4 py-3 rounded-3xl rounded-bl-md bg-gray-200 text-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>AI 正在思考中...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none">
          <div className="relative rounded-full p-0.5 bg-gradient-to-r from-purple-500 via-blue-500 via-teal-500 via-yellow-500 to-red-500 animate-gradient-flow pointer-events-auto">
            <form onSubmit={handleSubmit} className="relative z-10 flex items-center bg-white rounded-full py-2 px-5 shadow-lg">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="詢問獎學金相關問題..."
                className="flex-grow bg-transparent border-none outline-none text-base placeholder-gray-500"
                disabled={isLoading}
              />
              
              {/* Clear History Button */}
              <button
                type="button"
                onClick={clearHistory}
                className="flex-shrink-0 bg-transparent text-gray-500 hover:text-red-500 hover:bg-red-50 border-none rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 mr-2"
                title="清除對話紀錄"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>清除紀錄</span>
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex-shrink-0 border-none bg-blue-600 hover:bg-blue-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="發送"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Support Button */}
        {messages.length > 1 && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <button
              className="bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
              onClick={requestHumanSupport}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              AI 無法解決？尋求真人支援
            </button>
          </div>
        )}
      </div>

      {/* Custom CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient-flow {
          0% { background-position: 400% 0; }
          100% { background-position: 0% 0; }
        }
        
        .animate-gradient-flow {
          background-size: 400%;
          animation: gradient-flow 10s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default ChatInterface
