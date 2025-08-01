import { NextResponse } from 'next/server'
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware'

// 模擬的系統 prompt
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

// 模擬檢查意圖相關性
async function checkIntent(message) {
  // 簡單的關鍵字檢查 - 在實際應用中這裡會調用 Gemini API
  const scholarshipKeywords = [
    '獎學金', '補助', '申請', '資格', '條件', '截止', '期限', '文件', '證明', 
    '低收', '中低收', '清寒', '助學金', '學雜費', '生活費', '彰師', 'NCUE',
    '申請表', '推薦函', '成績', '戶籍', '所得', '財產'
  ]
  
  const isRelated = scholarshipKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  )
  
  return isRelated ? 'RELATED' : 'UNRELATED'
}

// 模擬 SERP API 搜尋
async function searchWithSerpAPI(query) {
  // 這裡會調用真正的 SERP API
  // 目前返回模擬資料
  return [
    {
      title: "教育部獎助學金申請指南",
      link: "https://www.edu.tw/scholarship",
      snippet: "提供各類獎助學金申請資訊，包含申請條件、時程和必要文件..."
    },
    {
      title: "大專院校弱勢學生助學計畫",
      link: "https://www.edu.tw/assist",
      snippet: "針對低收入戶、中低收入戶學生提供學雜費減免和生活助學金..."
    }
  ]
}

// 模擬相關性檢索
async function retrieveRelevantAnnouncements(message, history) {
  // 這裡會連接到真正的資料庫和向量搜尋
  // 目前返回模擬資料
  const mockAnnouncements = [
    {
      id: 1,
      title: "113學年度低收入戶學雜費減免申請",
      summary: "符合低收入戶資格之學生可申請學雜費全額減免",
      full_content: "申請對象：持有低收入戶證明之在學學生\n申請期間：每學期開學前一個月\n應備文件：1.申請表 2.低收入戶證明 3.學生證影本"
    }
  ]
  
  // 簡單的關鍵字匹配
  const relevantAnnouncements = mockAnnouncements.filter(ann => 
    message.includes('低收') || message.includes('減免') || message.includes('學雜費')
  )
  
  return relevantAnnouncements.length > 0 ? {
    announcements: relevantAnnouncements,
    confidence: 8
  } : null
}

// 模擬 AI 生成回應
async function generateAIResponse(prompt) {
  // 這裡會調用真正的 Gemini API
  // 目前返回基於規則的模擬回應
  if (prompt.includes('低收')) {
    return `根據您的查詢，關於低收入戶學雜費減免的相關資訊如下：

## 申請對象
- 持有低收入戶證明之在學學生

## 申請期間
- 每學期開學前一個月

## 應備文件
1. 申請表
2. 低收入戶證明
3. 學生證影本

## 申請流程
1. 準備相關文件
2. 填寫申請表
3. 送交學務處辦理

如有任何疑問，建議您直接洽詢學務處獎助學金承辦人員。

<div class="ai-disclaimer">此為 AI 依據校內公告生成的摘要內容，如有異同請以平台公告原文為準。</div>

[ANNOUNCEMENT_CARD:1]`
  }
  
  return "感謝您的提問！我正在學習中，目前提供的是模擬回應。實際的 AI 功能將會整合完整的獎學金資料庫，為您提供更精確的建議。"
}

export async function POST(request) {
  try {
    // 1. Rate limiting 檢查
    const rateLimitCheck = checkRateLimit(request, 'chat', 30, 60000); // 每分鐘30次
    if (!rateLimitCheck.success) {
      return rateLimitCheck.error;
    }

    // 2. 用戶身份驗證（聊天需要登入）
    const authCheck = await verifyUserAuth(request, {
      requireAuth: true,
      requireAdmin: false,
      endpoint: '/api/chat'
    });
    
    if (!authCheck.success) {
      return authCheck.error;
    }

    // 3. 驗證請求資料
    const body = await request.json();
    const dataValidation = validateRequestData(
      body,
      ['message'], // 必填欄位
      ['history'] // 可選欄位
    );
    
    if (!dataValidation.success) {
      return dataValidation.error;
    }

    const { message, history = [] } = dataValidation.data;
    
    // 4. 額外的訊息驗證
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: '訊息內容不可為空' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: '訊息長度不能超過1000字符' },
        { status: 400 }
      );
    }

    if (history.length > 50) {
      return NextResponse.json(
        { error: '對話歷史過長' },
        { status: 400 }
      );
    }

    // 1. 意圖檢測
    const intent = await checkIntent(message)
    
    if (intent === 'UNRELATED') {
      const rejectionMessage = `🤖 哎呀！我目前只專精於獎學金相關問題呢~

對於您提出的問題，我可能無法提供準確的回答。不過別擔心，我們有專業的承辦人員可以為您提供協助！

如果您需要更詳細的協助，歡迎使用真人支援服務 👇

🔵【需要專人協助？點擊申請真人支援】

<img src="/ai-rejection.png" alt="AI助理" style="width: 100px; height: 100px; object-fit: cover;" />`

      return NextResponse.json({
        role: 'model',
        content: rejectionMessage,
        timestamp: new Date().toISOString()
      })
    }

    // 2. 嘗試從內部公告檢索
    const relevantData = await retrieveRelevantAnnouncements(message, history)
    let aiResponse
    let sourceType = 'none'

    if (relevantData && relevantData.confidence >= 8) {
      // 使用內部公告資料
      sourceType = 'internal'
      const contextText = relevantData.announcements
        .map(ann => `## 公告標題：《${ann.title}》\n**摘要:** ${ann.summary}\n**內文:**\n${ann.full_content}\n---`)
        .join('\n\n')
      
      const fullPrompt = `${SYSTEM_PROMPT}

# 對話歷史
${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
user: ${message}

# 參考資料 (內部獎學金公告)：
${contextText}`

      aiResponse = await generateAIResponse(fullPrompt)
    } else {
      // 使用外部搜尋
      sourceType = 'external'
      const searchResults = await searchWithSerpAPI(message)
      
      if (searchResults.length > 0) {
        const contextText = searchResults
          .map(result => `## 網頁標題: ${result.title}\n## 網頁連結: ${result.link}\n## 內容摘要: ${result.snippet}\n---`)
          .join('\n\n')
        
        const fullPrompt = `${SYSTEM_PROMPT}

# 對話歷史
${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
user: ${message}

# 參考資料 (外部網頁搜尋結果)：
${contextText}`

        aiResponse = await generateAIResponse(fullPrompt)
        
        // 添加外部搜尋免責聲明
        aiResponse += '\n\n<div class="ai-disclaimer">此為 AI 依據網路搜尋結果生成的摘要內容，請點擊來源連結查證資訊。</div>'
      } else {
        aiResponse = '抱歉，關於您提出的問題，我目前找不到相關的資訊。'
      }
    }

    // 記錄成功的聊天操作
    logSuccessAction('CHAT_RESPONSE', '/api/chat', {
      userId: authCheck.user.id,
      messageLength: message.length,
      sourceType,
      hasHistory: history.length > 0
    });

    return NextResponse.json({
      role: 'model',
      content: aiResponse,
      timestamp: new Date().toISOString(),
      sourceType
    })

  } catch (error) {
    return handleApiError(error, '/api/chat');
  }
}
