import { NextResponse } from 'next/server'
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware'
import { GoogleGenAI, Type } from "@google/genai"

// 模擬的系統 prompt
const SYSTEM_PROMPT = `# 角色 (Persona)
你是一位專為「NCUE 獎學金資訊整合平台」設計的**頂尖AI助理**。你的個性是專業、精確且樂於助人。

# 你的核心任務
你的任務是根據我提供給你的「# 參考資料」（這可能來自內部公告或外部網路搜尋），用**自然、流暢的繁體中文**總結並回答使用者關於獎學金的問題。

# 表達與格式化規則
1.  **直接回答:** 請直接以對話的方式回答問題，不要說「根據我找到的資料...」。
2.  **結構化輸出:** 當資訊包含多個項目時，請**務必使用結構化的方式**來呈現。
3.  **引用來源:** 
    -   如果參考資料來源是「外部網頁搜尋結果」，你【必須】在回答的適當位置，以連結的格式自然地嵌入來源連結。
    -   如果參考資料來源是「內部公告」，你【絕對不能】生成任何連結。
4.  **最終回應:** 在你的主要回答內容之後，如果本次回答參考了內部公告，請務必在訊息的【最後】提供參考的公告 ID。
5.  **嚴禁事項:**
    -   如果「# 參考資料」為空或與問題無關，就直接回答：「抱歉，關於您提出的問題，我目前找不到相關的資訊。」

# 服務範圍限制
你的知識範圍【嚴格限定】在「獎學金申請」相關事務。若問題無關，請禮貌地說明你的服務範圍並拒絕回答。`

// 定義聊天回應的 JSON Schema - 參考 AI_ANALYSIS_METHODS.md
const chatResponseSchema = {
  type: Type.OBJECT,
  properties: {
    answer_type: {
      type: Type.STRING,
      description: "回答類型",
      enum: ["scholarship_info", "application_guide", "document_requirements", "eligibility_criteria", "contact_info", "general_help", "rejection"]
    },
    content: {
      type: Type.OBJECT,
      properties: {
        sections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "段落標題"
              },
              content: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      description: "內容類型：text, list, table, highlight_important, highlight_deadline, source_link, contact_info"
                    },
                    text: {
                      type: Type.STRING,
                      description: "文字內容"
                    },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.STRING
                      },
                      description: "列表項目，當type為list時使用"
                    },
                    table_data: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.STRING
                        }
                      },
                      description: "表格數據，當type為table時使用"
                    },
                    link_url: {
                      type: Type.STRING,
                      description: "連結網址，當type為source_link時使用"
                    },
                    link_text: {
                      type: Type.STRING, 
                      description: "連結文字，當type為source_link時使用"
                    },
                    deadline: {
                      type: Type.STRING,
                      description: "截止日期，當type為highlight_deadline時使用"
                    },
                    amount: {
                      type: Type.STRING,
                      description: "金額資訊，當type為highlight_important時使用"
                    }
                  },
                  required: ["type"]
                }
              }
            },
            required: ["title", "content"]
          }
        }
      },
      required: ["sections"]
    },
    referenced_announcements: {
      type: Type.ARRAY,
      items: {
        type: Type.INTEGER
      },
      description: "參考的內部公告ID列表"
    },
    source_type: {
      type: Type.STRING,
      description: "資料來源類型",
      enum: ["internal", "external", "none"]
    },
    confidence_level: {
      type: Type.STRING,
      description: "回答可信度",
      enum: ["high", "medium", "low"]
    },
    follow_up_suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING
      },
      description: "後續建議問題"
    }
  },
  required: ["answer_type", "content", "source_type", "confidence_level"]
}

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
    if (process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY) {
      const genAI = new GoogleGenAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY);
      
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
  // 根據 prompt 內容判斷回應類型
  if (prompt.includes('低收') || prompt.includes('減免')) {
    return {
      answer_type: "scholarship_info",
      content: {
        sections: [
          {
            title: "申請資格與對象",
            content: [
              {
                type: "highlight_important",
                text: "低收入戶學雜費減免申請"
              },
              {
                type: "list",
                items: [
                  "持有低收入戶證明之在學學生",
                  "須為本校正式學籍學生", 
                  "每學期均需重新申請"
                ]
              }
            ]
          },
          {
            title: "申請時程與流程",
            content: [
              {
                type: "highlight_deadline",
                deadline: "每學期開學前一個月"
              },
              {
                type: "table",
                table_data: [
                  ["申請期間", "每學期開學前一個月"],
                  ["申請地點", "學務處生輔組"],
                  ["處理時間", "約7-10個工作天"]
                ]
              }
            ]
          },
          {
            title: "應備文件",
            content: [
              {
                type: "list",
                items: [
                  "申請表（可至學務處索取或網站下載）",
                  "低收入戶證明正本（三個月內有效）",
                  "學生證正反面影本",
                  "印章"
                ]
              }
            ]
          },
          {
            title: "聯絡資訊",
            content: [
              {
                type: "contact_info",
                text: "學務處生輔組\n電話：04-7232105 轉 1221\n辦公室：行政大樓2樓"
              }
            ]
          }
        ]
      },
      referenced_announcements: relevantAnnouncements ? relevantAnnouncements.map(ann => ann.id) : [],
      source_type: sourceType,
      confidence_level: "high",
      follow_up_suggestions: [
        "其他經濟不利學生補助有哪些？",
        "如何申請校內工讀金？", 
        "獎學金申請的注意事項有哪些？"
      ]
    };
  }

  // 無關問題的拒絕回應
  if (!prompt.includes('獎學金') && !prompt.includes('補助') && !prompt.includes('申請')) {
    return {
      answer_type: "rejection",
      content: {
        sections: [
          {
            title: "服務範圍說明",
            content: [
              {
                type: "text",
                text: "🤖 哎呀！我目前只專精於獎學金相關問題呢~"
              },
              {
                type: "text",
                text: "對於您提出的問題，我可能無法提供準確的回答。不過別擔心，我們有專業的承辦人員可以為您提供協助！"
              },
              {
                type: "text",
                text: "如果您需要更詳細的協助，歡迎使用真人支援服務 👇"
              }
            ]
          }
        ]
      },
      referenced_announcements: [],
      source_type: "none",
      confidence_level: "high",
      follow_up_suggestions: [
        "查詢可申請的獎學金有哪些？",
        "獎學金申請條件說明",
        "申請獎學金需要什麼文件？"
      ]
    };
  }

  // 預設一般回應
  return {
    answer_type: "general_help",
    content: {
      sections: [
        {
          title: "系統回應",
          content: [
            {
              type: "text",
              text: "感謝您的提問！我正在學習中，目前提供的是模擬回應。實際的 AI 功能將會整合完整的獎學金資料庫，為您提供更精確的建議。"
            }
          ]
        }
      ]
    },
    referenced_announcements: [],
    source_type: sourceType,
    confidence_level: "low",
    follow_up_suggestions: [
      "查詢獎學金申請條件",
      "了解申請流程",
      "查看最新公告"
    ]
  };
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
      const rejectionData = generateMockStructuredResponse('拒絕回應', 'none', null, null);
      const rejectionMessage = generateMarkdownFromStructure(rejectionData);

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
${contextText}

請根據以上資料，用結構化的方式回答用戶問題。`

      const aiResponseData = await generateStructuredAIResponse(fullPrompt, 'internal', null, relevantData.announcements)
      aiResponse = generateMarkdownFromStructure(aiResponseData)
      
      // 添加公告卡片標籤
      if (aiResponseData.referenced_announcements && aiResponseData.referenced_announcements.length > 0) {
        aiResponse += `\n\n[ANNOUNCEMENT_CARD:${aiResponseData.referenced_announcements.join(',')}]`
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

        const aiResponseData = await generateStructuredAIResponse(fullPrompt, 'external', searchResults, null)
        aiResponse = generateMarkdownFromStructure(aiResponseData)
      } else {
        const aiResponseData = await generateStructuredAIResponse(message, 'none', null, null)
        aiResponse = generateMarkdownFromStructure(aiResponseData) || '抱歉，關於您提出的問題，我目前找不到相關的資訊。'
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
