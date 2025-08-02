import { NextResponse } from 'next/server'
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware'
import { GoogleGenAI, Type } from "@google/genai"

// 模擬的系統 prompt - 與前端保持一致
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

// 定義聊天回應的 JSON Schema - 參考 AI_ANALYSIS_METHODS.md
const chatResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "公告標題，簡潔明瞭地概括公告主要內容"
    },
    summary: {
      type: Type.STRING,
      description: "公告摘要，3-5句話概括重點內容"
    },
    category: {
      type: Type.STRING,
      description: "公告類別",
      enum: ["獎學金", "助學金", "工讀金", "競賽獎金", "交換計畫", "其他"]
    },
    applicationDeadline: {
      type: Type.STRING,
      description: "申請截止日期，格式: YYYY-MM-DD，如果沒有明確日期則為 null",
      nullable: true
    },
    announcementEndDate: {
      type: Type.STRING,
      description: "公告結束日期，格式: YYYY-MM-DD，如果沒有明確日期則為 null",
      nullable: true
    },
    targetAudience: {
      type: Type.STRING,
      description: "適用對象描述，例如：大學部學生、研究生、特定科系等"
    },
    applicationLimitations: {
      type: Type.STRING,
      description: "申請限制條件，包括成績要求、家庭狀況等"
    },
    submissionMethod: {
      type: Type.STRING,
      description: "申請方式說明，包括線上申請、紙本申請等"
    },
    requiredDocuments: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING
      },
      description: "所需文件清單"
    },
    contactInfo: {
      type: Type.OBJECT,
      properties: {
        department: {
          type: Type.STRING,
          description: "承辦單位"
        },
        phone: {
          type: Type.STRING,
          description: "聯絡電話",
          nullable: true
        },
        email: {
          type: Type.STRING,
          description: "聯絡信箱",
          nullable: true
        },
        office: {
          type: Type.STRING,
          description: "辦公室位置",
          nullable: true
        }
      }
    },
    amount: {
      type: Type.OBJECT,
      properties: {
        currency: {
          type: Type.STRING,
          description: "貨幣單位，通常為 TWD"
        },
        min: {
          type: Type.INTEGER,
          description: "最低金額",
          nullable: true
        },
        max: {
          type: Type.INTEGER,
          description: "最高金額",
          nullable: true
        },
        fixed: {
          type: Type.INTEGER,
          description: "固定金額",
          nullable: true
        }
      }
    },
    // 額外的 metadata 欄位
    response_type: {
      type: Type.STRING,
      description: "回應類型",
      enum: ["structured_info", "conversational", "error"]
    },
    referenced_announcements: {
      type: Type.ARRAY,
      items: {
        type: Type.INTEGER
      },
      description: "參考的內部公告ID列表"
    },
    confidence_level: {
      type: Type.STRING,
      description: "回答可信度",
      enum: ["high", "medium", "low"]
    }
  },
  required: ["summary", "response_type"]
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

// 將結構化的回應轉換為 Markdown 格式
function generateMarkdownFromStructure(responseData) {
  if (!responseData || !responseData.content || !responseData.content.sections) return '';
  
  let markdown = '';
  
  responseData.content.sections.forEach(section => {
    // 添加節標題
    markdown += `## ${section.title}\n\n`;
    
    section.content.forEach(item => {
      switch (item.type) {
        case 'text':
          markdown += `${item.text}\n\n`;
          break;
        case 'list':
          if (item.items && item.items.length > 0) {
            item.items.forEach(listItem => {
              markdown += `- ${listItem}\n`;
            });
            markdown += '\n';
          }
          break;
        case 'table':
          if (item.table_data && item.table_data.length > 0) {
            // 創建 Markdown 表格
            const headers = item.table_data[0];
            markdown += `| ${headers.join(' | ')} |\n`;
            markdown += `| ${headers.map(() => '---').join(' | ')} |\n`;
            
            for (let i = 1; i < item.table_data.length; i++) {
              const row = item.table_data[i];
              markdown += `| ${row.join(' | ')} |\n`;
            }
            markdown += '\n';
          }
          break;
        case 'highlight_important':
          if (item.amount) {
            markdown += `**� ${item.amount}**\n\n`;
          } else {
            markdown += `**�🔸 ${item.text}**\n\n`;
          }
          break;
        case 'highlight_deadline':
          markdown += `**⏰ 截止日期：${item.deadline}**\n\n`;
          break;
        case 'source_link':
          if (item.link_url && item.link_text) {
            markdown += `[${item.link_text}](${item.link_url})\n\n`;
          }
          break;
        case 'contact_info':
          markdown += `📞 **聯絡資訊**\n${item.text}\n\n`;
          break;
        default:
          markdown += `${item.text || ''}\n\n`;
          break;
      }
    });
  });
  
  // 添加後續建議
  if (responseData.follow_up_suggestions && responseData.follow_up_suggestions.length > 0) {
    markdown += `\n---\n\n### 💡 您可能還想了解：\n\n`;
    responseData.follow_up_suggestions.forEach(suggestion => {
      markdown += `- ${suggestion}\n`;
    });
    markdown += '\n';
  }
  
  return markdown.trim();
}

// 使用 Gemini 2.5 Flash 和 responseSchema 生成結構化回應
async function generateStructuredAIResponse(prompt, sourceType = 'none', searchResults = null, relevantAnnouncements = null) {
  try {
    // 如果有 API key，使用真正的 Gemini API
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      const genAI = new GoogleGenAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseSchema: chatResponseSchema,
          responseMimeType: "application/json"
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return JSON.parse(text);
    }
    
    // 否則使用模擬回應
    return generateMockStructuredResponse(prompt, sourceType, searchResults, relevantAnnouncements);
    
  } catch (error) {
    console.error('Gemini API 錯誤，使用模擬回應:', error);
    return generateMockStructuredResponse(prompt, sourceType, searchResults, relevantAnnouncements);
  }
}

// 模擬結構化回應（當 API 不可用時）
function generateMockStructuredResponse(prompt, sourceType = 'none', searchResults = null, relevantAnnouncements = null) {
  // 簡化的模擬回應，直接返回可讀的文本
  if (prompt.includes('低收') || prompt.includes('減免')) {
    return "## 低收入戶學雜費減免申請\n\n" +
           "**申請對象：**\n" +
           "- 持有低收入戶證明之在學學生\n" +
           "- 須為本校正式學籍學生\n" +
           "- 每學期均需重新申請\n\n" +
           "**申請期間：** 每學期開學前一個月\n\n" +
           "**應備文件：**\n" +
           "1. 申請表\n" +
           "2. 低收入戶證明\n" +
           "3. 學生證影本\n\n" +
           "**承辦單位：** 學務處生活輔導組\n" +
           "**聯絡電話：** 04-7232105 轉 1221\n\n";
  }
  
  if (prompt.includes('獎學金')) {
    return "## 獎學金申請資訊\n\n" +
           "目前有多種獎學金可供申請，包括：\n\n" +
           "**政府獎學金：**\n" +
           "- 教育部學產基金低收入戶學生助學金\n" +
           "- 各縣市政府獎助學金\n\n" +
           "**校內獎學金：**\n" +
           "- 優秀學生獎學金\n" +
           "- 特殊才能獎學金\n\n" +
           "**民間獎學金：**\n" +
           "- 各企業及基金會提供之獎助學金\n\n" +
           "請關注學校公告了解最新申請資訊。";
  }
  
  // 預設回應
  return "謝謝您的提問！我是專門協助獎學金申請相關問題的AI助理。\n\n" +
         "我可以協助您了解：\n" +
         "- 各類獎學金申請條件\n" +
         "- 申請流程與所需文件\n" +
         "- 申請期間與截止日期\n" +
         "- 聯絡方式與承辦單位\n\n" +
         "請告訴我您想了解哪方面的獎學金資訊？";
}

// 新的簡化意圖檢測
async function checkIntent(message) {
  const scholarshipKeywords = ['獎學金', '助學金', '補助', '減免', '申請', '文件', '資格', '條件', '期間', '截止', '聯絡'];
  
  const hasScholarshipKeyword = scholarshipKeywords.some(keyword => 
    message.includes(keyword)
  );
  
  return hasScholarshipKeyword ? 'SCHOLARSHIP' : 'UNRELATED';
}

// 模擬的網路搜尋功能
async function searchWithSerpAPI(query) {
  // 模擬搜尋結果
  return [
    {
      title: "教育部學產基金設置急難慰問金實施要點",
      link: "https://www.edu.tw/News_Content.aspx?n=9E7AC85F1954DDA8&s=Example123",
      snippet: "針對低收入戶、中低收入戶學生提供學雜費減免和生活助學金..."
    }
  ];
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
      const rejectionMessage = "抱歉，我專門協助獎學金相關問題。如果您有獎學金申請的疑問，我很樂意為您解答！";

      return NextResponse.json({
        response: rejectionMessage,
        structured_response: false,
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
${contextText}

請根據以上資料，用結構化的方式回答用戶問題。`

      aiResponse = await generateStructuredAIResponse(fullPrompt, 'internal', null, relevantData.announcements)
      
      // 添加公告卡片標籤
      if (relevantData.announcements && relevantData.announcements.length > 0) {
        const announcementIds = relevantData.announcements.map(ann => ann.id).join(',')
        aiResponse += `\n\n[ANNOUNCEMENT_CARD:${announcementIds}]`
      }
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
${contextText}

請根據以上資料，用結構化的方式回答用戶問題，並在適當位置加入來源連結。`

        aiResponse = await generateStructuredAIResponse(fullPrompt, 'external', searchResults, null)
      } else {
        aiResponse = await generateStructuredAIResponse(message, 'none', null, null)
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
      response: aiResponse,
      structured_response: false,
      timestamp: new Date().toISOString(),
      sourceType
    })

  } catch (error) {
    return handleApiError(error, '/api/chat');
  }
}
