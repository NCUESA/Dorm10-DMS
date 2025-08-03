import { NextResponse } from 'next/server'
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware'
import { GoogleGenAI } from "@google/genai"

// AI 助理的系統 prompt
const SYSTEM_PROMPT = `# 角色 (Persona)
你是一位專為「NCUE 獎學金資訊整合平台」設計的**頂尖AI助理**。你的個性是專業、精確且樂於助人。

# 你的核心任務
你的核心任務是根據我提供給你的「# 參考資料」（來自內部公告資料庫），用**自然、流暢的繁體中文**總結並回答使用者關於獎學金的問題。

# 表達與格式化規則
1. **直接回答:** 請直接以對話的方式回答問題，不要說「根據我找到的資料...」。
2. **結構化輸出:** 當資訊包含多個項目時，請**務必使用 Markdown 的列表或表格**來呈現。
3. **引用來源:** 如果參考資料來源是「內部公告」，你【絕對不能】生成任何外部連結。
4. **最終回應:** 在你的主要回答內容之後，如果本次回答參考了內部公告，請務必在訊息的【最後】加上 \`[ANNOUNCEMENT_CARD:id1,id2,...]\` 這樣的標籤，其中 id 是你參考的公告 ID。
5. **服務範圍:** 你的知識範圍【嚴格限定】在「獎學金申請」相關事務。若問題無關，請禮貌地說明你的服務範圍並拒絕回答。

# 回應風格
- 專業但親切
- 簡潔明瞭
- 實用性導向
- 使用繁體中文`

// 使用 Supabase 檢索相關公告
async function retrieveRelevantAnnouncements(message, history) {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    
    // 檢索相關公告 - 使用全文搜索
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('id, title, summary, full_content, category, target_audience, application_limitations')
      .or(`title.ilike.%${message}%,summary.ilike.%${message}%,target_audience.ilike.%${message}%`)
      .limit(3);
    
    if (error) {
      console.error('Error fetching announcements:', error);
      return null;
    }
    
    if (announcements && announcements.length > 0) {
      return {
        announcements,
        confidence: 9 // 來自內部資料庫，可信度高
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error in retrieveRelevantAnnouncements:', error);
    return null;
  }
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

import { NextResponse } from 'next/server'
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware'
import { GoogleGenAI } from "@google/genai"

// AI 助理的系統 prompt
const SYSTEM_PROMPT = `# 角色 (Persona)
你是一位專為「NCUE 獎學金資訊整合平台」設計的**頂尖AI助理**。你的個性是專業、精確且樂於助人。

# 你的核心任務
你的核心任務是根據我提供給你的「# 參考資料」（來自內部公告資料庫），用**自然、流暢的繁體中文**總結並回答使用者關於獎學金的問題。

# 表達與格式化規則
1. **直接回答:** 請直接以對話的方式回答問題，不要說「根據我找到的資料...」。
2. **結構化輸出:** 當資訊包含多個項目時，請**務必使用 Markdown 的列表或表格**來呈現。
3. **引用來源:** 如果參考資料來源是「內部公告」，你【絕對不能】生成任何外部連結。
4. **最終回應:** 在你的主要回答內容之後，如果本次回答參考了內部公告，請務必在訊息的【最後】加上 `[ANNOUNCEMENT_CARD:id1,id2,...]` 這樣的標籤，其中 id 是你參考的公告 ID。
5. **服務範圍:** 你的知識範圍【嚴格限定】在「獎學金申請」相關事務。若問題無關，請禮貌地說明你的服務範圍並拒絕回答。

# 回應風格
- 專業但親切
- 簡潔明瞭
- 實用性導向
- 使用繁體中文`

// 使用 Supabase 檢索相關公告
async function retrieveRelevantAnnouncements(message, history) {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    
    // 檢索相關公告 - 使用全文搜索
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('id, title, summary, full_content, category, target_audience, application_limitations')
      .or(`title.ilike.%${message}%,summary.ilike.%${message}%,target_audience.ilike.%${message}%`)
      .limit(3);
    
    if (error) {
      console.error('Error fetching announcements:', error);
      return null;
    }
    
    if (announcements && announcements.length > 0) {
      return {
        announcements,
        confidence: 9 // 來自內部資料庫，可信度高
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error in retrieveRelevantAnnouncements:', error);
    return null;
  }
}

// 使用 Gemini API 生成回應
async function generateAIResponse(prompt, sourceType = 'none', relevantAnnouncements = null) {
  try {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
    
  } catch (error) {
    console.error('Gemini API 錯誤:', error);
    
    // 備用回應
    if (sourceType === 'internal' && relevantAnnouncements?.length > 0) {
      return `根據相關公告資料，我找到了以下資訊：\n\n${relevantAnnouncements.map(ann => 
        `**${ann.title}**\n${ann.summary}\n`
      ).join('\n')}\n\n如需更詳細資訊，請查看完整公告內容。`;
    }
    
    return "抱歉，AI 服務暫時不可用。請稍後再試，或直接查看相關公告。";
  }
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

    // 簡化的處理流程
    
    // 1. 檢索相關公告
    const relevantData = await retrieveRelevantAnnouncements(message, history);
    let aiResponse;
    let sourceType = 'none';
    
    // 2. 構建 prompt
    let fullPrompt = `${SYSTEM_PROMPT}

# 對話歷史
${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
user: ${message}
`;

    if (relevantData && relevantData.confidence >= 8) {
      // 有相關公告資料
      sourceType = 'internal';
      const contextText = relevantData.announcements
        .map(ann => `## 公告標題：《${ann.title}》
**摘要:** ${ann.summary}
**詳細內容:** ${ann.full_content || ann.summary}
**適用對象:** ${ann.target_audience || '未指定'}
**申請限制:** ${ann.application_limitations || '請查看詳細公告'}
---`)
        .join('\n\n');
      
      fullPrompt += `
# 參考資料 (內部獎學金公告)：
${contextText}

請根據以上公告資料，用自然、親切的方式回答用戶問題。如果有多個相關公告，請整理後提供清楚的資訊。`;
      
    } else {
      // 沒有相關公告，讓 AI 提供一般性回應
      fullPrompt += `
請根據你對獎學金申請的一般知識來回答用戶問題。如果問題超出獎學金範圍，請禮貌地說明你的服務範圍。`;
    }

    // 3. 調用 Gemini API
    aiResponse = await generateAIResponse(fullPrompt, sourceType, relevantData?.announcements);
    
    // 4. 添加公告卡片標籤（如果有相關公告）
    if (sourceType === 'internal' && relevantData?.announcements?.length > 0) {
      const announcementIds = relevantData.announcements.map(ann => ann.id).join(',');
      aiResponse += `\n\n[ANNOUNCEMENT_CARD:${announcementIds}]`;
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
      timestamp: new Date().toISOString(),
      sourceType
    })

  } catch (error) {
    return handleApiError(error, '/api/chat');
  }
}
