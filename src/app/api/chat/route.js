import { NextResponse } from 'next/server'
import { verifyUserAuth, checkRateLimit, validateRequestData, handleApiError, logSuccessAction } from '@/lib/apiMiddleware'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from '@supabase/supabase-js'

// Use service role key for backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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

// 儲存訊息到對話歷史 (修正後版本)
async function saveMessageToHistory(userId, sessionId, role, messageContent) {
  try {
    const { error } = await supabase
      .from('chat_history')
      .insert({
        user_id: userId,
        session_id: sessionId,
        role: role, // 'user' or 'model'
        message_content: messageContent,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving message to history:', error);
    }
  } catch (error) {
    console.error('Error in saveMessageToHistory:', error);
  }
}

// 非串流方式調用 Gemini API (用於意圖檢測等)
async function callGeminiAPI(prompt, temperature = 0.0, isJsonResponse = false) {
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  const generationConfig = {
    temperature: temperature,
    maxOutputTokens: 8192
  };
  if (isJsonResponse) {
    generationConfig.responseMimeType = "application/json";
  }
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig
  });
  const result = await model.generateContent(prompt);
  return (await result.response).text().trim();
}


// 調用 SERP API 進行網路搜尋
async function callSerpAPI(query) {
  try {
    if (!process.env.SERP_API_KEY || 
        process.env.SERP_API_KEY === 'YOUR_SERP_API_KEY_HERE' ||
        !process.env.SERP_API_KEY.trim()) {
      console.log('SERP API key not configured or invalid');
      return [];
    }
    const searchQuery = `${query} 獎學金 (site:.edu.tw OR site:.gov.tw)`;
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `https://serpapi.com/search.json?q=${encodedQuery}&api_key=${process.env.SERP_API_KEY}&gl=tw&hl=zh-tw`;
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`SERP API request failed: ${response.status} - ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    return data.organic_results || [];
  } catch (error) {
    console.error('SERP API 錯誤:', error.message);
    return [];
  }
}

export async function POST(request) {
  try {
    // 1. Middleware checks
    const rateLimitCheck = checkRateLimit(request, 'chat', 30, 60000);
    if (!rateLimitCheck.success) return rateLimitCheck.error;

    const authCheck = await verifyUserAuth(request, { requireAuth: true, requireAdmin: false, endpoint: '/api/chat' });
    if (!authCheck.success) return authCheck.error;
    
    // 3. 驗證請求資料 (增加 sessionId)
    const body = await request.json();
    const dataValidation = validateRequestData(body, ['message'], ['history', 'sessionId']);
    if (!dataValidation.success) return dataValidation.error;

    const { message: userMessage, history = [], sessionId } = dataValidation.data;
    const userId = authCheck.user.id;
    const finalSessionId = sessionId || crypto.randomUUID();

    // 4. 額外的訊息驗證
    if (!userMessage || !userMessage.trim() || userMessage.length > 1000 || history.length > 50) {
      return NextResponse.json({ error: '無效的訊息內容' }, { status: 400 });
    }

    // 5. 立即儲存使用者訊息
    await saveMessageToHistory(userId, finalSessionId, 'user', userMessage);

    // --- RAG 流程 ---
    const historyForPrompt = history.map(msg => `${msg.role}: ${msg.message_content || msg.content}`).join('\n');
    
    // Step 1: 意圖檢測
    const intentCheckPrompt = `你是一個意圖分類器。請判斷以下使用者問題是否與「獎學金」或「校內財務補助」相關。請只回傳 "RELATED" 或 "UNRELATED"。\n\n使用者問題: '${userMessage}'`;
    const intentResult = await callGeminiAPI(intentCheckPrompt);
    
    if (intentResult.toUpperCase().trim() === 'UNRELATED') {
      const rejectionMessage = `🌋呃呃呃……我腦袋冒煙了！\n我只懂「獎學金申請」的事，其他的話……就像數學考卷一樣讓我大當機 🫠\n\n這個問題我可能無法幫上忙，但你可以試試找真人幫手唷👇\n\n🔵【AI 無法解決？尋求真人支援】\n\n![憤怒的 Brachio](/ai-rejection.png)`;
      await saveMessageToHistory(userId, finalSessionId, 'model', rejectionMessage);
      return NextResponse.json({ response: rejectionMessage, timestamp: new Date().toISOString(), sourceType: 'rejection', sessionId: finalSessionId });
    }

    // Step 2: RAG 檢索流程
    let fullTextContext = '';
    let sourceType = 'none';
    let retrievedIds = [];

    const { data: allAnnouncements, error: announcementsError } = await supabase.from('announcements').select('id, title, summary, full_content').eq('is_active', true);
    if (announcementsError) console.error('Error fetching announcements:', announcementsError);

    if (allAnnouncements && allAnnouncements.length > 0) {
      const documentsForRetrieval = allAnnouncements.map(ann => ({ id: ann.id, content: `標題: ${ann.title}\n摘要: ${ann.summary}` }));
      const retrievalPrompt = `# 任務\n對於下方「可用文件列表」中的**每一份**文件，根據使用者問題的**真實意圖**，給出一個 0 到 10 的相關性分數。\n\n# 輸入資料\n## 對話歷史:\n${historyForPrompt}\n## 使用者最新問題:\n'${userMessage}'\n## 可用文件列表:\n${JSON.stringify(documentsForRetrieval, null, 2)}\n\n# 輸出格式\n請只回傳一個 JSON 陣列，其中每個物件包含 \`id\` 和 \`score\`。例如：\`[{"id": 21, "score": 8}, {"id": 22, "score": 3}]\``;

      try {
        const scoresJson = await callGeminiAPI(retrievalPrompt, 0.0, true);
        const confidenceScores = JSON.parse(scoresJson);
        const highConfidenceItems = confidenceScores.filter(item => item.score !== undefined && item.score >= 8);
        if (highConfidenceItems.length > 0) {
          retrievedIds = highConfidenceItems.map(item => item.id);
          sourceType = 'internal';
        }
      } catch (error) { console.error('Error in document retrieval:', error); }
    }

    // Step 3 & 4: 根據來源類型構建上下文
    if (sourceType === 'none' && process.env.SERP_API_KEY && process.env.SERP_API_KEY !== 'YOUR_SERP_API_KEY_HERE' && process.env.SERP_API_KEY.trim()) {
      try {
        const searchQueryPrompt = `你是一個搜尋查詢優化工具。請將以下對話，整合成一個單一、清晰、適合在 Google 上搜尋的查詢語句。\n\n# 對話:\n${historyForPrompt}\nuser:${userMessage}\n\n# 輸出\n請只回傳一句查詢語句。`;
        const searchQuery = await callGeminiAPI(searchQueryPrompt, 0.0);
        if (searchQuery && searchQuery.trim()) {
          const webResults = await callSerpAPI(searchQuery.trim());
          if (webResults.length > 0) {
            fullTextContext = '\n\n# 參考資料 (外部網頁搜尋結果)：';
            let count = 0;
            for (const result of webResults) {
              if (count >= 3) break;
              if (result.snippet && result.link && result.title) {
                fullTextContext += `\n\n## 網頁標題: ${result.title}\n## 網頁連結: ${result.link}\n## 內容摘要: ${result.snippet}\n---`;
                count++;
              }
            }
            sourceType = 'external';
          }
        }
      } catch (error) { console.error('Error in external search:', error); }
    } else if (sourceType === 'internal') {
      const validIds = retrievedIds.filter(id => typeof id === 'number' || !isNaN(parseInt(id)));
      if (validIds.length > 0) {
        const retrievedFullTexts = allAnnouncements.filter(ann => validIds.includes(ann.id));
        if (retrievedFullTexts.length > 0) {
          fullTextContext = '\n\n# 參考資料 (內部獎學金公告)：';
          for (const doc of retrievedFullTexts) {
            const fullContent = doc.full_content || doc.summary;
            fullTextContext += `\n\n## 公告標題：《${doc.title}》\n**摘要:** ${doc.summary}\n**內文:**\n${fullContent}\n---`;
          }
        }
      }
    }
    
    // Step 5: 串流生成最終回應
    const finalPrompt = `${SYSTEM_PROMPT}\n\n# 對話歷史:\n${historyForPrompt}\nuser: ${userMessage}\n${fullTextContext}`;

    const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.4, maxOutputTokens: 8192 } });
    const streamResult = await model.generateContentStream(finalPrompt);

    let fullAiResponse = '';
    const stream = new TransformStream({
      transform(chunk, controller) {
        const text = chunk.text();
        fullAiResponse += text;
        controller.enqueue(new TextEncoder().encode(text));
      },
      async flush(controller) {
        // 在串流結束時執行
        let finalContentForHistory = fullAiResponse;
        let finalContentForStream = '';

        if (sourceType === 'internal') {
          const disclaimer = '\n\n<div class="ai-disclaimer">此為 AI 依據校內公告生成的摘要內容，如有異同請以平台公告原文為準。</div>';
          finalContentForHistory += disclaimer;
          finalContentForStream += disclaimer;
          if (retrievedIds.length > 0) {
            const cardTag = `\n[ANNOUNCEMENT_CARD:${retrievedIds.join(',')}]`;
            finalContentForHistory += cardTag;
            finalContentForStream += cardTag;
          }
        } else if (sourceType === 'external') {
          const disclaimer = '\n\n<div class="ai-disclaimer">此為 AI 依據網路搜尋結果生成的摘要內容，請點擊來源連結查證資訊。</div>';
          finalContentForHistory += disclaimer;
          finalContentForStream += disclaimer;
        }

        // 儲存完整的 AI 回應
        await saveMessageToHistory(userId, finalSessionId, 'model', finalContentForHistory);

        // 將結尾部分推入串流
        if (finalContentForStream) {
            controller.enqueue(new TextEncoder().encode(finalContentForStream));
        }

        logSuccessAction('CHAT_RESPONSE_STREAMED', '/api/chat', { userId, sourceType, responseLength: finalContentForHistory.length });
      }
    });

    // 將 Gemini stream pipe 到我們的 transform stream
    streamResult.stream.pipeTo(stream.writable);

    return new NextResponse(stream.readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Session-Id': finalSessionId,
        'X-Source-Type': sourceType,
        'X-Retrieved-Ids': retrievedIds.join(','),
      }
    });

  } catch (error) {
    return handleApiError(error, '/api/chat');
  }
}
