'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import MarkdownRenderer from './MarkdownRenderer'
import Toast from './ui/Toast'
import { authFetch } from '@/lib/authFetch'

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

const ChatInterface = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const messagesEndRef = useRef(null)

  // 快捷問題
  const quickQuestions = [
    {
      id: 1,
      text: "如何申請低收入戶學雜費減免？",
      icon: "💰",
      category: "申請流程"
    },
    {
      id: 2, 
      text: "有哪些獎學金目前開放申請？",
      icon: "📋",
      category: "現有機會"
    },
    {
      id: 3,
      text: "申請獎學金需要準備什麼文件？",
      icon: "📄",
      category: "文件準備"
    },
    {
      id: 4,
      text: "獎學金的申請資格限制有哪些？",
      icon: "✅",
      category: "申請條件"
    }
  ]

  // 自動滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 處理滾動容器的事件，阻擋冒泡和預設行為
  const handleScrollContainerEvent = (e) => {
    // 只阻擋在滾動容器邊界時的冒泡
    const target = e.currentTarget
    const { scrollTop, scrollHeight, clientHeight } = target
    
    // 如果滾動到頂部或底部，阻擋冒泡防止觸發父元素滾動
    if ((scrollTop === 0 && e.deltaY < 0) || 
        (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0)) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 修復 sendQuickQuestion 函數
  const sendQuickQuestion = (questionText) => {
    if (isLoading) return
    
    setInput(questionText)
    
    // 直接調用 handleSubmit 而不是模擬事件
    const fakeEvent = {
      preventDefault: () => {},
      target: { value: questionText }
    }
    
    // 延遲一點讓 input 值更新
    setTimeout(() => {
      handleSubmit(fakeEvent)
    }, 50)
  }

  // 渲染訊息 - 輕量化設計
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
      <div key={index} className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar - 輕量化設計 */}
        <div className="flex-shrink-0 w-8 h-8">
          <div className={`w-full h-full rounded-lg flex items-center justify-center text-white text-sm font-medium ${
            isUser ? 'bg-blue-500' : 'bg-gray-400'
          }`}>
            {isUser ? (
              userName.substring(0, 1).toUpperCase()
            ) : (
              <img src="/logo.png" alt="AI" className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col min-w-0 flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Name and Time */}
          <div className={`text-xs text-gray-500 mb-1 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
            {isUser ? userName : 'AI助理'}
            <span className="ml-2">{time}</span>
          </div>
          
          {/* Message Bubble - 輕量化設計 */}
          <div className={`px-3 py-2 rounded-lg text-sm break-words border ${
            isUser 
              ? 'bg-blue-500 text-white border-blue-500 rounded-br-sm' 
              : 'bg-white text-gray-800 border-gray-200 rounded-bl-sm'
          }`}>
            {/* 渲染 Markdown 內容 */}
            <div className="prose prose-sm max-w-none">
              <MarkdownRenderer 
                content={content} 
                className={`${isUser ? 'prose-invert' : ''} prose-blue prose-headings:text-sm prose-headings:font-medium prose-p:my-1 prose-ul:my-1 prose-li:my-0`}
              />
            </div>
            
            {/* 渲染公告卡片 */}
            {announcementIds.length > 0 && (
              <div className="mt-2 space-y-2">
                {announcementIds.map(id => (
                  <div key={id} className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <div className="flex items-center gap-2 text-blue-600 font-medium mb-1 text-xs">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                      參考公告 #{id}
                    </div>
                    <div className="text-xs text-gray-600">正在載入公告內容...</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 清除對話記錄
  const clearHistory = () => {
    setMessages([])
    setToast({ message: '對話記錄已清除', type: 'success' })
  }

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 確保有輸入內容且不在載入中
    const messageText = input.trim()
    if (!messageText || isLoading) return

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    // 立即清空輸入框和添加用戶訊息
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await authFetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          conversationHistory: messages
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // 處理 API 回應
      let aiContent = ''
      
      if (data.structured_response) {
        // 處理結構化回應
        aiContent = data.response || '我收到了您的問題，正在處理中...'
      } else {
        // 處理普通回應
        aiContent = data.response || '抱歉，我遇到了一些問題。請稍後再試。'
      }

      const aiMessage = {
        role: 'assistant',
        content: aiContent,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setToast({ message: '發送訊息失敗，請稍後再試', type: 'error' })
      
      // 發生錯誤時提供友善的回應
      const errorMessage = {
        role: 'assistant',
        content: '抱歉，我遇到了一些問題。請檢查您的網路連線後再試一次。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - 輕量化設計 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <img src="/logo.png" alt="AI" className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI 助理</h1>
              <p className="text-sm text-gray-500">智能獎學金申請顧問</p>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">
                {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
              </span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {(user.user_metadata?.name || user.email?.split('@')[0] || 'U').substring(0, 1).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area - 輕量化容器 */}
      <div 
        className="flex-1 overflow-y-auto"
        onWheel={handleScrollContainerEvent}
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="max-w-4xl mx-auto p-4">
          {/* 歡迎訊息 - 僅在無對話時顯示 */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">您好！我是您的 AI 助理</h2>
              <p className="text-gray-600 mb-6">我可以協助您查詢獎學金相關資訊，請點選下方問題或直接輸入您的問題</p>
              
              {/* 快捷問題 - 輕量化卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mb-8">
                {quickQuestions.map((question) => (
                  <button
                    key={question.id}
                    onClick={() => sendQuickQuestion(question.text)}
                    disabled={isLoading}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{question.icon}</span>
                      <span className="text-sm text-gray-700 group-hover:text-blue-700">{question.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 對話訊息 */}
          {messages.map((message, index) => renderMessage(message, index))}
          
          {/* Loading indicator - 簡潔設計 */}
          {isLoading && (
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <img src="/logo.png" alt="AI" className="w-5 h-5" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 max-w-xs">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-sm text-gray-500">思考中...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - 輕量化設計 */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          {/* 操作按鈕 */}
          <div className="flex gap-2 mb-3 justify-center">
            <button
              type="button"
              onClick={clearHistory}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-md transition-all border border-gray-200 hover:border-red-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              清除記錄
            </button>
          </div>

          {/* 輸入表單 */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="詢問獎學金相關問題..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          show={true}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default ChatInterface
