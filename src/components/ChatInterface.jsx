'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import MarkdownRenderer from './MarkdownRenderer'
import Toast from './ui/Toast'
import { authFetch } from '@/lib/authFetch'

const SYSTEM_PROMPT = `# 角色 (Persona)
你是一位專為「NCUE 獎學金資訊整合平台」設計的**頂尖AI助理**。你的個性是專業、精確且樂於助人。

# 你的核心任務
你的核心任務是根據我提供給你的「# 參考資料」（這可能來自內部公告或外部網路搜尋），用**自然、流暢的繁體中文**總結並回答使用者關於獎學金的問題。

# JSON 輸出格式要求
當需要結構化回應時，請按照以下 JSON 格式輸出：
{
  "title": "公告標題，簡潔明瞭地概括公告主要內容",
  "summary": "公告摘要，3-5句話概括重點內容",
  "category": "獎學金|助學金|工讀金|競賽獎金|交換計畫|其他",
  "applicationDeadline": "YYYY-MM-DD 或 null",
  "announcementEndDate": "YYYY-MM-DD 或 null", 
  "targetAudience": "適用對象描述",
  "applicationLimitations": "申請限制條件",
  "submissionMethod": "申請方式說明",
  "requiredDocuments": ["所需文件清單"],
  "contactInfo": {
    "department": "承辦單位",
    "phone": "聯絡電話",
    "email": "聯絡信箱", 
    "office": "辦公室位置"
  },
  "amount": {
    "currency": "TWD",
    "min": 最低金額數字,
    "max": 最高金額數字,
    "fixed": 固定金額數字
  }
}

# 表達與格式化規則
1.  **智能回應模式:** 根據問題複雜度選擇輸出格式：
    - 簡單問答：直接用自然語言回答
    - 複雜資訊整理：使用上述 JSON 格式結構化輸出
2.  **直接回答:** 請直接以對話的方式回答問題，不要說「根據我找到的資料...」。
3.  **結構化輸出:** 當資訊包含多個項目時，請**務必使用 Markdown 的列表或表格**來呈現。
4.  **引用來源:** 
    -   如果參考資料來源是「外部網頁搜尋結果」，你【必須】在回答的適當位置，以 \`[參考連結](URL)\` 的格式自然地嵌入來源連結。
    -   如果參考資料來源是「內部公告」，你【絕對不能】生成任何連結。
5.  **最終回應:** 在你的主要回答內容之後，如果本次回答參考了內部公告，請務必在訊息的【最後】加上 \`[ANNOUNCEMENT_CARD:id1,id2,...]\` 這樣的標籤，其中 id 是你參考的公告 ID。
6.  **嚴禁事項:**
    -   【絕對禁止】輸出任何非指定格式的 JSON 程式碼或物件。
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
  const scrollContainerRef = useRef(null)
  const shouldScrollToBottom = useRef(true)
  const inputAreaRef = useRef(null)
  
  // 聊天會話管理
  const [sessionId, setSessionId] = useState(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isClearingHistory, setIsClearingHistory] = useState(false)
  
  // 移除不需要的狀態變數，因為現在採用固定高度方案
  // const [inputAreaHeight, setInputAreaHeight] = useState(0)
  // const [isInputFixed, setIsInputFixed] = useState(true)

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

  // 自動滾動到底部 - 僅限聊天容器內部
  const scrollToBottom = () => {
    if (shouldScrollToBottom.current && scrollContainerRef.current && messagesEndRef.current) {
      // 確保滾動只發生在聊天容器內部，不影響外部頁面滾動
      const container = scrollContainerRef.current
      const target = messagesEndRef.current
      
      // 計算目標元素在容器內的位置
      const containerRect = container.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const scrollTop = container.scrollTop + (targetRect.top - containerRect.top)
      
      // 平滑滾動到目標位置
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      })
    }
  }

  // 載入聊天歷史記錄
  const loadChatHistory = async () => {
    if (!user) return
    
    try {
      setIsLoadingHistory(true)
      const response = await authFetch(`/api/chat-history?userId=${user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.length > 0) {
          // 轉換歷史記錄格式
          const historyMessages = data.data.map(record => ({
            role: record.role === 'model' ? 'assistant' : record.role,
            content: record.message_content,
            timestamp: new Date(record.timestamp),
            sessionId: record.session_id
          }))
          
          setMessages(historyMessages)
          // 使用最新的 sessionId 或創建新的
          const latestSessionId = data.data[data.data.length - 1]?.session_id
          setSessionId(latestSessionId || crypto.randomUUID())
        } else {
          // 沒有歷史記錄，創建新會話
          setSessionId(crypto.randomUUID())
        }
      }
    } catch (error) {
      console.error('載入聊天歷史失敗:', error)
      setSessionId(crypto.randomUUID()) // 創建新會話
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // 保存聊天消息到後端
  const saveChatMessage = async (role, content, currentSessionId = sessionId) => {
    if (!user || !currentSessionId) return
    
    try {
      await authFetch('/api/chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          sessionId: currentSessionId,
          role: role === 'assistant' ? 'model' : role,
          messageContent: content
        })
      })
    } catch (error) {
      console.error('保存聊天記錄失敗:', error)
      // 不中斷用戶體驗，只記錄錯誤
    }
  }

  // 監聽使用者在聊天視窗內的滾動
  const handleUserScroll = (e) => {
    const target = e.currentTarget
    const { scrollTop, scrollHeight, clientHeight } = target

    // 如果使用者手動向上滾動，就暫停自動滾動
    if (scrollTop < scrollHeight - clientHeight - 20) {
      shouldScrollToBottom.current = false
    } else {
      shouldScrollToBottom.current = true
    }
  }

  useEffect(() => {
    // 只有當有訊息時才滾動到底部，避免初始載入時的不必要滾動
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages])

  // 載入用戶聊天歷史
  useEffect(() => {
    if (user) {
      loadChatHistory()
    }
  }, [user])

  // 當歷史記錄載入完成後，滾動到底部
  useEffect(() => {
    if (!isLoadingHistory && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom()
      }, 100) // 短暫延遲確保DOM已更新
    }
  }, [isLoadingHistory])

  // 移除複雜的 Footer 檢測邏輯，改為固定對話框高度
  // useEffect(() => {
  //   const handleScroll = () => {
  //     // 檢查 footer 元素是否存在並計算其位置
  //     const footer = document.querySelector('footer')
  //     if (footer) {
  //       const footerRect = footer.getBoundingClientRect()
  //       const isFooterVisible = footerRect.top < window.innerHeight
  //       setIsInputFixed(!isFooterVisible) // Footer 不可見時才 fixed
  //     } else {
  //       // 如果找不到 footer，則保持 fixed
  //       setIsInputFixed(true)
  //     }
  //   }

  //   // 延遲執行初始檢查，避免頁面載入時的滾動
  //   const timeoutId = setTimeout(() => {
  //     handleScroll()
  //   }, 100)

  //   window.addEventListener('scroll', handleScroll)

  //   return () => {
  //     clearTimeout(timeoutId)
  //     window.removeEventListener('scroll', handleScroll)
  //   }
  // }, [])

  // 移除 ResizeObserver，因為不再需要動態計算輸入框高度
  // useEffect(() => {
  //   if (inputAreaRef.current) {
  //     const resizeObserver = new ResizeObserver(entries => {
  //       for (let entry of entries) {
  //         setInputAreaHeight(entry.contentRect.height)
  //       }
  //     })
  //     resizeObserver.observe(inputAreaRef.current)
  //     return () => resizeObserver.disconnect()
  //   }
  // }, [])

  // 修復 sendQuickQuestion 函數
  const sendQuickQuestion = (questionText) => {
    if (isLoading || isLoadingHistory) return
    
    setInput(questionText)
    
    // 直接調用 handleSubmit 而不是模擬事件
    const fakeEvent = {
      preventDefault: () => {},
      target: { value: questionText }
    }
    
    // 延遲一點讓 input 值更新
    setTimeout(() => {
      shouldScrollToBottom.current = true // 發送新訊息時，恢復自動滾動
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
  const clearHistory = async () => {
    if (!user || isClearingHistory) return
    
    setIsClearingHistory(true)
    try {
      // 清除遠端記錄
      const response = await authFetch(`/api/chat-history?userId=${user.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // 清除本地記錄
        setMessages([])
        // 創建新的會話ID
        setSessionId(crypto.randomUUID())
        setToast({ message: '對話記錄已清除', type: 'success' })
      } else {
        throw new Error('清除遠端記錄失敗')
      }
    } catch (error) {
      console.error('清除對話記錄失敗:', error)
      setToast({ message: '清除記錄失敗，請稍後再試', type: 'error' })
    } finally {
      setIsClearingHistory(false)
    }
  }

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 確保有輸入內容且不在載入中
    const messageText = input.trim()
    if (!messageText || isLoading || !user) return

    shouldScrollToBottom.current = true // 發送新訊息時，恢復自動滾動

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    // 立即清空輸入框和添加用戶訊息
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // 保存用戶消息到後端
    await saveChatMessage('user', messageText)

    try {
      const response = await authFetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          // 將最新訊息一併送至後端，避免遺漏
          conversationHistory: [...messages, userMessage]
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
      
      // 保存AI回應到後端
      await saveChatMessage('assistant', aiContent)
      
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
      
      // 保存錯誤消息到後端
      await saveChatMessage('assistant', errorMessage.content)
      
    } finally {
      setIsLoading(false)
    }
  }

  // 取得 header 高度
  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight)
    }
  }, [])

  return (
    <div 
      className="flex flex-col bg-gray-50"
      style={{
        height: headerHeight ? `calc(100vh - ${headerHeight}px)` : '100vh'
      }}
    >
      {/* Header */}
      <div
        ref={headerRef}
        className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0"
      >
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
                {(user.user_metadata?.name || user.email?.split('@')[0] || 'U')
                  .substring(0, 1)
                  .toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat區塊：填滿剩餘高度 */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto bg-gray-50"
          onScroll={handleUserScroll}
        >
          <div className="max-w-4xl mx-auto p-4">
            {/* 載入歷史記錄狀態 */}
            {isLoadingHistory && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-sm">載入聊天記錄中...</span>
                </div>
              </div>
            )}
            
            {/* 歡迎訊息 */}
            {!isLoadingHistory && messages.length === 0 && (
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  您好！我是您的 AI 助理
                </h2>
                <p className="text-gray-600 mb-3 text-sm">
                  我可以協助您查詢獎學金相關資訊，請點選下方問題或直接輸入您的問題
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
                  {quickQuestions.map((question) => (
                    <button
                      key={question.id}
                      onClick={() => sendQuickQuestion(question.text)}
                      disabled={isLoading}
                      className="p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{question.icon}</span>
                        <span className="text-xs text-gray-700 group-hover:text-blue-700">
                          {question.text}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 對話訊息 */}
            {!isLoadingHistory && messages.map((message, index) => renderMessage(message, index))}

            {/* Loading 狀態 */}
            {isLoading && (
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <img src="/logo.png" alt="AI" className="w-5 h-5" />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 max-w-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500">思考中...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 滾動到底部的目標元素 */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input區 - 固定底部 */}
        <div
          ref={inputAreaRef}
          className="bg-white border-t border-gray-200 p-4 flex-shrink-0"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 mb-3 justify-center">
              <button
                type="button"
                onClick={clearHistory}
                disabled={isClearingHistory || isLoadingHistory}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-md transition-all border border-gray-200 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClearingHistory ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
                {isClearingHistory ? '清除中...' : '清除記錄'}
              </button>
            </div>

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
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Toast通知 */}
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
