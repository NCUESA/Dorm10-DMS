# AI 分析方法保存文檔

## Gemini 2.5 Flash responseSchema 方法

當 Google Gemini 2.5 Flash 正式支援 JSON output 和 responseSchema 時，可以使用以下實現方式：

### 1. 完整的 responseSchema 定義

```javascript
// 用於結構化輸出的 schema 定義
const responseSchema = {
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
                },
                description: {
                    type: Type.STRING,
                    description: "金額說明"
                }
            }
        }
    },
    required: [
        "title",
        "summary", 
        "category",
        "targetAudience",
        "applicationLimitations",
        "submissionMethod",
        "requiredDocuments",
        "contactInfo"
    ]
};
```

### 2. AI 分析函數 (responseSchema 版本)

```javascript
const analyzeContentWithSchema = async (content, urlContext = null) => {
    try {
        const genAI = new GoogleGenAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY);
        
        // 使用 Gemini 2.5 Flash 模型
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: urlContext ? [urlContext] : undefined,
            generationConfig: {
                temperature: 0.1,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
                responseSchema: responseSchema,
                responseMimeType: "application/json"
            }
        });

        const prompt = `請分析以下公告內容，提取關鍵資訊並以結構化格式回傳：

${content}

請特別注意：
1. 準確提取日期資訊（申請截止日期、公告結束日期）
2. 識別目標對象和申請條件
3. 列出所有必要文件
4. 提取聯絡資訊
5. 如果提到金額，請準確提取數字
6. 根據內容選擇最適合的類別

請以 JSON 格式回傳結構化資料。`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // 直接解析 JSON，因為 responseSchema 保證了格式
        return JSON.parse(text);
        
    } catch (error) {
        console.error('AI 分析錯誤:', error);
        throw new Error('AI 分析失敗，請檢查內容格式');
    }
};
```

### 3. HTML 生成函數 (根據結構化資料)

```javascript
const generateHtmlFromStructuredData = (data) => {
    const formatAmount = (amount) => {
        if (amount.fixed) {
            return `${amount.currency} ${amount.fixed.toLocaleString()}`;
        } else if (amount.min && amount.max) {
            return `${amount.currency} ${amount.min.toLocaleString()} - ${amount.max.toLocaleString()}`;
        } else if (amount.min) {
            return `${amount.currency} ${amount.min.toLocaleString()} 以上`;
        } else if (amount.max) {
            return `${amount.currency} ${amount.max.toLocaleString()} 以下`;
        }
        return amount.description || '詳見公告';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            return new Date(dateStr).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    // 自動高亮重要資訊
    const highlightImportantInfo = (text) => {
        if (!text) return text;
        
        // 高亮數字（紅色）
        text = text.replace(/(\d{1,3}(?:,\d{3})*|\d+)/g, '<span class="text-red-600 font-semibold">$1</span>');
        
        // 高亮條件詞（橙色）
        const conditionWords = ['必須', '需要', '應', '限', '僅限', '不得', '禁止'];
        conditionWords.forEach(word => {
            const regex = new RegExp(`(${word}[^，。]*?)`, 'g');
            text = text.replace(regex, '<span class="text-orange-600 font-medium">$1</span>');
        });
        
        return text;
    };

    let html = `
    <div class="space-y-6">
        <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <h3 class="text-blue-800 font-bold text-lg mb-2">${data.title}</h3>
            <p class="text-blue-700">${highlightImportantInfo(data.summary)}</p>
        </div>
    `;

    // 基本資訊區塊
    html += `
        <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    基本資訊
                </h4>
                <dl class="space-y-2">
                    <div>
                        <dt class="text-sm font-medium text-gray-600">類別</dt>
                        <dd class="text-sm text-gray-900">
                            <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                ${data.category}
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm font-medium text-gray-600">適用對象</dt>
                        <dd class="text-sm text-gray-900">${highlightImportantInfo(data.targetAudience)}</dd>
                    </div>
    `;

    if (data.amount) {
        html += `
                    <div>
                        <dt class="text-sm font-medium text-gray-600">獎助金額</dt>
                        <dd class="text-sm text-gray-900 font-semibold text-green-600">${formatAmount(data.amount)}</dd>
                    </div>
        `;
    }

    html += `
                </dl>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                    <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    重要日期
                </h4>
                <dl class="space-y-2">
    `;

    if (data.applicationDeadline) {
        html += `
                    <div>
                        <dt class="text-sm font-medium text-gray-600">申請截止</dt>
                        <dd class="text-sm text-red-600 font-semibold">${formatDate(data.applicationDeadline)}</dd>
                    </div>
        `;
    }

    if (data.announcementEndDate) {
        html += `
                    <div>
                        <dt class="text-sm font-medium text-gray-600">公告截止</dt>
                        <dd class="text-sm text-gray-600">${formatDate(data.announcementEndDate)}</dd>
                    </div>
        `;
    }

    html += `
                </dl>
            </div>
        </div>
    `;

    // 申請條件
    html += `
        <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 class="font-semibold text-yellow-800 mb-3 flex items-center">
                <span class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                申請條件
            </h4>
            <p class="text-sm text-yellow-700">${highlightImportantInfo(data.applicationLimitations)}</p>
        </div>
    `;

    // 所需文件
    if (data.requiredDocuments && data.requiredDocuments.length > 0) {
        html += `
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                    <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    所需文件
                </h4>
                <ul class="space-y-1">
        `;
        
        data.requiredDocuments.forEach(doc => {
            html += `<li class="text-sm text-gray-700 flex items-start">
                <span class="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                ${highlightImportantInfo(doc)}
            </li>`;
        });
        
        html += `
                </ul>
            </div>
        `;
    }

    // 申請方式
    html += `
        <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 class="font-semibold text-blue-800 mb-3 flex items-center">
                <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                申請方式
            </h4>
            <p class="text-sm text-blue-700">${highlightImportantInfo(data.submissionMethod)}</p>
        </div>
    `;

    // 聯絡資訊
    if (data.contactInfo) {
        html += `
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    聯絡資訊
                </h4>
                <dl class="space-y-2">
        `;

        if (data.contactInfo.department) {
            html += `
                    <div>
                        <dt class="text-sm font-medium text-gray-600">承辦單位</dt>
                        <dd class="text-sm text-gray-900">${data.contactInfo.department}</dd>
                    </div>
            `;
        }

        if (data.contactInfo.phone) {
            html += `
                    <div>
                        <dt class="text-sm font-medium text-gray-600">聯絡電話</dt>
                        <dd class="text-sm text-gray-900">${data.contactInfo.phone}</dd>
                    </div>
            `;
        }

        if (data.contactInfo.email) {
            html += `
                    <div>
                        <dt class="text-sm font-medium text-gray-600">聯絡信箱</dt>
                        <dd class="text-sm text-gray-900">${data.contactInfo.email}</dd>
                    </div>
            `;
        }

        if (data.contactInfo.office) {
            html += `
                    <div>
                        <dt class="text-sm font-medium text-gray-600">辦公室</dt>
                        <dd class="text-sm text-gray-900">${data.contactInfo.office}</dd>
                    </div>
            `;
        }

        html += `
                </dl>
            </div>
        `;
    }

    html += `</div>`;
    return html;
};
```

### 4. 使用方式

```javascript
// 在 CreateAnnouncementModal 中的使用
const handleAIAnalysis = async () => {
    try {
        setAiAnalysing(true);
        
        // 使用 responseSchema 方法
        const structuredData = await analyzeContentWithSchema(uploadedFiles[0].content, urlContext);
        
        // 生成 HTML
        const htmlSummary = generateHtmlFromStructuredData(structuredData);
        
        // 更新表單資料
        setFormData(prevData => ({
            ...prevData,
            title: structuredData.title,
            summary: structuredData.summary,
            category: structuredData.category,
            applicationDeadline: structuredData.applicationDeadline || '',
            announcementEndDate: structuredData.announcementEndDate || '',
            targetAudience: structuredData.targetAudience,
            applicationLimitations: structuredData.applicationLimitations,
            submissionMethod: structuredData.submissionMethod,
            externalUrls: urls.join('\n'),
            sourceType: JSON.stringify({
                type: 'mixed',
                files: uploadedFiles.map(f => ({ name: f.name, type: f.type })),
                urls: urls,
                aiModel: 'gemini-2.5-flash',
                timestamp: new Date().toISOString()
            })
        }));
        
        setAiSummary(htmlSummary);
        setCurrentStep(1);
        showToast('AI 分析完成！', 'success');
        
    } catch (error) {
        console.error('AI 分析錯誤:', error);
        showToast('AI 分析失敗: ' + error.message, 'error');
    } finally {
        setAiAnalysing(false);
    }
};
```

## 優勢比較

### responseSchema 方法優勢：
1. **結構化保證**：確保輸出格式一致
2. **類型安全**：自動驗證資料類型
3. **易於處理**：前端直接使用 JSON 資料
4. **可擴展性**：容易添加新欄位
5. **錯誤處理**：模型層面的格式驗證

### 直接 HTML 生成方法優勢：
1. **模型兼容性**：適用於所有模型
2. **靈活性高**：可以生成複雜的 HTML 結構
3. **即時可用**：不需要等待 API 支援
4. **自然語言處理**：更好的文本理解和格式化

## 建議

當 Gemini 2.5 Flash 正式支援 responseSchema 時，建議採用以下策略：

1. **優先使用 responseSchema 方法**進行資料提取
2. **保留 HTML 生成功能**作為顯示層
3. **實施漸進式升級**，確保向後兼容
4. **建立 A/B 測試**比較兩種方法的效果

這樣可以充分利用結構化輸出的優勢，同時保持系統的穩定性和可用性。
