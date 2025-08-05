'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import MarkdownRenderer from './MarkdownRenderer'
import Toast from './ui/Toast'
import { authFetch } from '@/lib/authFetch'

// Support Modal Component
const SupportModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    urgency: '中',
    problemType: '其他',
    description: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">尋求真人支援</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">緊急程度</label>
            <select
              id="urgency"
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>低</option>
              <option>中</option>
              <option>高</option>
              <option>緊急</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="problemType" className="block text-sm font-medium text-gray-700 mb-1">問題類型</label>
            <select
              id="problemType"
              name="problemType"
              value={formData.problemType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>技術問題</option>
              <option>帳號問題</option>
              <option>功能建議</option>
              <option>其他</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">問題描述</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="請詳細描述您遇到的問題..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"
            >
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
              {isLoading ? '傳送中...' : '傳送請求'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


const ChatInterface = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const shouldScrollToBottom = useRef(true)
  
  // 聊天會話管理
  const [sessionId, setSessionId] = useState(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isClearingHistory, setIsClearingHistory] = useState(false)
  const [rejectedMessageIndex, setRejectedMessageIndex] = useState(-1);

  // 真人支援 Modal 狀態
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [isSendingSupportRequest, setIsSendingSupportRequest] = useState(false)


  const quickQuestions = [
    { id: 1, text: "如何申請低收入戶學雜費減免？", icon: "💰" },
    { id: 2, text: "有哪些獎學金目前開放申請？", icon: "📋" },
    { id: 3, text: "申請獎學金需要準備什麼文件？", icon: "📄" },
    { id: 4, text: "獎學金的申請資格限制有哪些？", icon: "✅" }
  ]

  const scrollToBottom = () => {
    if (shouldScrollToBottom.current && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }

  const loadChatHistory = async () => {
    if (!user) return
    setIsLoadingHistory(true)
    try {
      const response = await authFetch(`/api/chat-history?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.length > 0) {
          const historyMessages = data.data.map(record => ({
            role: record.role === 'model' ? 'assistant' : record.role,
            content: record.message_content,
            timestamp: new Date(record.timestamp),
            sessionId: record.session_id
          }))
          setMessages(historyMessages)
          setSessionId(data.data[data.data.length - 1]?.session_id)
        }
      }
    } catch (error) {
      console.error('載入聊天歷史失敗:', error)
    } finally {
      if (!sessionId) {
        setSessionId(crypto.randomUUID());
      }
      setIsLoadingHistory(false)
    }
  }

  const handleUserScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    shouldScrollToBottom.current = scrollTop >= scrollHeight - clientHeight - 20
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (user) {
      loadChatHistory()
    }
  }, [user])

  useEffect(() => {
    if (!isLoadingHistory && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }, [isLoadingHistory])

  const sendQuickQuestion = (questionText) => {
    if (isLoading || isLoadingHistory) return
    setInput(questionText)
    setTimeout(() => {
      const form = document.querySelector('form');
      if(form) form.requestSubmit();
    }, 50)
  }

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user'
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
    const time = new Date(message.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })

    let content = message.content
    const cardRegex = /\[ANNOUNCEMENT_CARD:([\d,]+)\]/g
    const cardMatch = cardRegex.exec(content)
    let announcementIds = []
    
    if (cardMatch && cardMatch[1]) {
      announcementIds = cardMatch[1].split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id) && id > 0)
      content = content.replace(cardRegex, '').trim()
    }

    const isRejected = index === rejectedMessageIndex;

    return (
      <div key={index} className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className="flex-shrink-0 w-8 h-8">
          <div className={`w-full h-full rounded-lg flex items-center justify-center text-white text-sm font-medium ${isUser ? 'bg-blue-500' : 'bg-gray-400'}`}>
            {isUser ? userName.substring(0, 1).toUpperCase() : <img src="/logo.png" alt="AI" className="w-5 h-5" />}
          </div>
        </div>
        <div className={`flex flex-col min-w-0 flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`text-xs text-gray-500 mb-1 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
            {isUser ? userName : 'AI助理'}
            <span className="ml-2">{time}</span>
          </div>
          <div className={`px-3 py-2 rounded-lg text-sm break-words border ${isUser ? 'bg-blue-500 text-white border-blue-500 rounded-br-sm' : 'bg-white text-gray-800 border-gray-200 rounded-bl-sm'}`}>
            <div className="prose prose-sm max-w-none">
              <MarkdownRenderer content={content} className={`${isUser ? 'prose-invert' : ''} prose-blue prose-headings:text-sm prose-headings:font-medium prose-p:my-1 prose-ul:my-1 prose-li:my-0`} />
            </div>
            {announcementIds.length > 0 && (
              <div className="mt-2 space-y-2">
                {announcementIds.map(id => (
                  <div key={id} className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <div className="flex items-center gap-2 text-blue-600 font-medium mb-1 text-xs">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                      參考公告 #{id}
                    </div>
                    <div className="text-xs text-gray-600">正在載入公告內容...</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {isRejected && (
             <button
                onClick={() => setIsSupportModalOpen(true)}
                className="mt-2 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-200 transition-all"
             >
                點此尋求真人支援
             </button>
          )}
        </div>
      </div>
    )
  }

  const clearHistory = async () => {
    if (!user || isClearingHistory) return
    setIsClearingHistory(true)
    try {
      const response = await authFetch(`/api/chat-history?userId=${user.id}`, { method: 'DELETE' })
      if (response.ok) {
        setMessages([])
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

  const handleSupportRequestSubmit = async (formData) => {
    if (!user) {
        setToast({ message: '請先登入', type: 'error' });
        return;
    }
    setIsSendingSupportRequest(true);
    try {
        const response = await authFetch('/api/send-support-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                userEmail: user.email,
                userName: user.user_metadata?.name || '未提供',
                conversationHistory: messages,
            }),
        });

        const result = await response.json();
        if (response.ok && result.success) {
            setToast({ message: '支援請求已成功發送！', type: 'success' });
            setIsSupportModalOpen(false);
        } else {
            throw new Error(result.error || '傳送失敗');
        }
    } catch (error) {
        setToast({ message: `傳送失敗: ${error.message}`, type: 'error' });
    } finally {
        setIsSendingSupportRequest(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    const messageText = input.trim()
    if (!messageText || isLoading || !user) return

    shouldScrollToBottom.current = true
    setRejectedMessageIndex(-1);

    const userMessage = { role: 'user', content: messageText, timestamp: new Date() }
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: currentMessages.slice(0, -1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            content: msg.content
          })),
          sessionId: sessionId,
        })
      })

      if (!response.ok || !response.body) {
        throw new Error(`請求失敗: ${response.statusText}`)
      }

      const returnedSessionId = response.headers.get('X-Session-Id')
      if (returnedSessionId && returnedSessionId !== sessionId) {
        setSessionId(returnedSessionId)
      }

      const sourceType = response.headers.get('X-Source-Type');

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      const aiMessage = { role: 'assistant', content: '', timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
      const assistantMessageIndex = currentMessages.length;

      let done = false
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        const chunk = decoder.decode(value, { stream: true })

        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[assistantMessageIndex].content += chunk;
            return newMessages;
        });
      }

      if (sourceType === 'rejection') {
        setRejectedMessageIndex(assistantMessageIndex);
      }

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = { role: 'assistant', content: `抱歉，我遇到了一些問題: ${error.message}`, timestamp: new Date() }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight)
    }
  }, [])

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: headerHeight ? `calc(100vh - ${headerHeight}px)` : '100vh' }}>
      <div ref={headerRef} className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
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
                <span className="text-sm text-gray-600 hidden sm:inline">{user.user_metadata?.name || user.email?.split('@')[0] || 'User'}</span>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {(user.user_metadata?.name || user.email?.split('@')[0] || 'U').substring(0, 1).toUpperCase()}
                </div>
            </div>
            )}
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto bg-gray-50" onScroll={handleUserScroll}>
          <div className="max-w-4xl mx-auto p-4">
            {isLoadingHistory && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-gray-500"><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div><span className="text-sm">載入聊天記錄中...</span></div>
              </div>
            )}
            {!isLoadingHistory && messages.length === 0 && (
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center"><svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">您好！我是您的 AI 助理</h2>
                <p className="text-gray-600 mb-3 text-sm">我可以協助您查詢獎學金相關資訊，請點選下方問題或直接輸入您的問題</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
                  {quickQuestions.map((question) => (
                    <button key={question.id} onClick={() => sendQuickQuestion(question.text)} disabled={isLoading} className="p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left group">
                      <div className="flex items-center gap-2"><span className="text-base">{question.icon}</span><span className="text-xs text-gray-700 group-hover:text-blue-700">{question.text}</span></div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!isLoadingHistory && messages.map((message, index) => renderMessage(message, index))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><img src="/logo.png" alt="AI" className="w-5 h-5" /></div>
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 max-w-xs">
                  <div className="flex items-center gap-2"><div className="flex space-x-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div></div><span className="text-sm text-gray-500">思考中...</span></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 mb-3 justify-center">
              <button type="button" onClick={clearHistory} disabled={isClearingHistory || isLoadingHistory} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-md transition-all border border-gray-200 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {isClearingHistory ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                {isClearingHistory ? '清除中...' : '清除記錄'}
              </button>
              <button type="button" onClick={() => setIsSupportModalOpen(true)} disabled={isLoading} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-md transition-all border border-gray-200 hover:border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                轉接真人客服
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="詢問獎學金相關問題..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={isLoading} />
              <button type="submit" disabled={isLoading || !input.trim()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center">
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
              </button>
            </form>
          </div>
        </div>
      </div>
      <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} onSubmit={handleSupportRequestSubmit} isLoading={isSendingSupportRequest} />
      {toast && <Toast show={true} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default ChatInterface
