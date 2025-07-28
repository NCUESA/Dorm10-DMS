# NCUE 獎助學金資訊整合平台

> 一個結合 AI 智能分析的獎學金資訊管理系統，專為國立彰化師範大學設計。

![平台預覽](assets/images/logo.png)

## 📋 專案概述

本專案是一個全功能的獎學金資訊整合平台，提供學生查詢獎學金資訊、管理員發布公告，以及 AI 智能客服等功能。系統採用 PHP + MySQL 架構，結合多個第三方服務實現智能化的資訊處理。

## 🎯 核心功能

### ✅ 已完成功能

#### 🔐 使用者認證系統
- **使用者註冊/登入**：支援學號格式驗證 (1英文+7數字)
- **電子信箱驗證**：註冊時需電子信箱驗證碼確認
- **密碼重設**：忘記密碼功能，透過電子信箱重設
- **Session 管理**：安全的使用者 Session 處理
- **權限控制**：管理員與一般使用者權限區分

#### 📢 公告管理系統
- **智能公告發布**：AI 輔助分析 PDF、網址、文字內容生成摘要
- **多元資料來源**：支援 PDF 文件、外部網址、純文字內容
- **結構化資料提取**：自動提取申請截止日、適用對象、兼領限制等
- **分類管理**：A/B/C/D/E 獎學金分類系統
- **附件管理**：支援多檔案上傳與管理
- **狀態管理**：上架/下架狀態控制

#### 🔍 前台查詢功能
- **智能搜尋**：支援標題、摘要、適用對象搜尋
- **多重篩選**：開放申請中/全部/已截止篩選
- **排序功能**：依截止日期、標題等多欄位排序
- **分頁顯示**：支援每頁顯示數量調整
- **響應式設計**：手機、平板、桌面裝置適配

#### 🤖 AI 智能客服
- **對話機器人**：整合 Google Gemini API
- **RAG 檢索增強**：結合平台公告資料回答問題
- **外部搜尋**：整合 SerpAPI 搜尋相關獎學金資訊
- **對話記錄**：使用者對話歷史保存
- **人工支援**：請求人工協助功能
- **摘要生成**：對話紀錄摘要與郵件發送

#### 👥 後台管理功能
- **使用者管理**：管理員可查看、編輯、刪除使用者
- **權限設定**：設定使用者為管理員或一般使用者
- **郵件通知**：管理員可直接寄信給使用者
- **公告管理**：完整的 CRUD 操作
- **搜尋功能**：使用者搜尋與分頁

#### 📧 郵件系統
- **SMTP 整合**：使用 PHPMailer 發送郵件
- **HTML 郵件**：支援 HTML 格式郵件內容
- **郵件範本**：標準化的郵件頭尾設計
- **驗證碼發送**：註冊與密碼重設驗證碼
- **系統通知**：各種系統狀態通知郵件

#### 🔧 技術特色
- **PDF 解析**：使用 smalot/pdfparser 解析 PDF 內容
- **Markdown 支援**：使用 erusev/parsedown 處理 Markdown
- **API 整合**：Google Gemini AI、SerpAPI 搜尋
- **安全性**：SQL Injection 防護、XSS 防護
- **錯誤處理**：完整的錯誤日誌與使用者友善錯誤訊息

## 🛠️ 技術架構

### 後端技術
- **PHP 7.4+**：主要開發語言
- **MySQL**：資料庫系統
- **PDO**：資料庫存取層
- **Composer**：套件管理

### 前端技術
- **HTML5/CSS3**：基礎結構與樣式
- **JavaScript (jQuery)**：互動功能
- **TinyMCE**：富文本編輯器
- **SweetAlert2**：美化的對話框
- **FontAwesome**：圖示系統

### 第三方服務
- **Google Gemini API**：AI 語言模型
- **SerpAPI**：搜尋引擎 API
- **PHPMailer**：郵件發送
- **Gmail SMTP**：郵件伺服器

### 資料庫結構
```sql
-- 使用者表
users (id, student_id, username, email, password_hash, role, created_at)

-- 公告表  
announcements (id, created_by, title, summary, full_content, category, 
              application_deadline, announcement_end_date, target_audience,
              application_limitations, submission_method, external_urls,
              source_type, is_active, created_at, updated_at)

-- 附件表
attachments (id, announcement_id, file_name, stored_file_path)

-- 聊天記錄表
chat_history (id, user_id, role, message_content, timestamp)
```

## 📁 專案結構

```
/var/www/html/
├── admin/                  # 管理後台
│   └── announcements.php  # 公告與使用者管理
├── api/                    # API 端點
│   ├── chatbot_handler.php # AI 客服處理
│   ├── generate_summary.php # AI 摘要生成
│   ├── get_announcements.php # 公告查詢
│   ├── login.php          # 登入驗證
│   ├── register.php       # 使用者註冊
│   ├── manage_announcement.php # 公告管理
│   ├── manage_users.php   # 使用者管理
│   ├── reset_password.php # 密碼重設
│   └── send_verification.php # 驗證碼發送
├── assets/                 # 靜態資源
│   ├── css/style.css      # 主要樣式表
│   ├── js/                # JavaScript 檔案
│   └── images/            # 圖片資源
├── includes/              # 共用元件
│   ├── db_connect.php     # 資料庫連線
│   ├── header.php         # 頁面標頭
│   └── footer.php         # 頁面頁尾
├── templates/             # 模板檔案
├── uploads/               # 檔案上傳目錄
├── vendor/                # Composer 套件
├── config.php             # 系統設定
├── index.php              # 首頁
├── chatbot.php            # AI 客服頁面
└── auth_check.php         # 權限檢查
```

## 🚀 部署說明

### 系統需求
- **PHP 7.4+** (建議 8.0+)
- **MySQL 5.7+** 或 **MariaDB 10.3+**
- **Apache/Nginx** Web 伺服器
- **Composer** 套件管理器
- **SSL 憑證** (HTTPS 支援)

### 安裝步驟

1. **克隆專案**
```bash
git clone [repository-url]
cd html
```

2. **安裝 PHP 依賴**
```bash
composer install
```

3. **設定資料庫**
- 建立 MySQL 資料庫 `scholarship`
- 建立使用者 `scholarship_user`
- 執行資料庫 schema 建立 (需要提供 SQL 檔案)

4. **設定環境變數**
```php
// config.php
define('DB_HOST', 'localhost');
define('DB_NAME', 'scholarship');
define('DB_USER', 'scholarship_user');
define('DB_PASS', 'your_password');

// API Keys (請使用環境變數)
define('GEMINI_API_KEY', 'your_gemini_key');
define('SERP_API_KEY', 'your_serp_key');

// SMTP 設定
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_USERNAME', 'your_email@gmail.com');
define('SMTP_PASSWORD', 'your_app_password');
```

5. **設定檔案權限**
```bash
chmod 755 uploads/
chmod 755 uploads/attachments/
```

## 🔧 改進建議與後續開發

### 🏗️ 資料庫遷移至 Supabase

#### 優勢分析
- **雲端託管**：無需維護資料庫伺服器
- **即時功能**：支援即時資料同步
- **內建認證**：完整的使用者認證系統
- **API 自動生成**：REST 和 GraphQL API
- **檔案儲存**：整合檔案上傳與 CDN
- **郵件服務**：內建郵件發送功能

#### 遷移步驟
1. **建立 Supabase 專案**
   - 註冊 Supabase 帳號
   - 建立新專案
   - 取得 API URL 和 API Key

2. **資料庫 Schema 遷移**
```sql
-- 使用者表 (可使用 Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  student_id TEXT UNIQUE,
  username TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 公告表
CREATE TABLE announcements (
  id BIGSERIAL PRIMARY KEY,
  created_by UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  summary TEXT,
  full_content TEXT,
  category TEXT,
  application_deadline DATE,
  announcement_end_date DATE,
  target_audience TEXT,
  application_limitations TEXT,
  submission_method TEXT,
  external_urls TEXT,
  source_type JSONB,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 附件表
CREATE TABLE attachments (
  id BIGSERIAL PRIMARY KEY,
  announcement_id BIGINT REFERENCES announcements(id) ON DELETE CASCADE,
  file_name TEXT,
  file_path TEXT, -- Supabase Storage path
  created_at TIMESTAMP DEFAULT NOW()
);

-- 聊天記錄表
CREATE TABLE chat_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  role TEXT,
  message_content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

3. **Row Level Security (RLS) 設定**
```sql
-- 啟用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- 使用者只能查看自己的資料
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT 
USING (auth.uid() = id);

-- 管理員可以管理所有公告
CREATE POLICY "Admins can manage announcements" ON announcements 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
```

4. **檔案儲存遷移**
   - 建立 Supabase Storage Bucket
   - 上傳現有附件到 Supabase Storage
   - 更新檔案路徑為 Supabase URL

5. **認證系統整合**
   - 使用 Supabase Auth 取代自建認證
   - 設定電子信箱驗證
   - 整合社群登入 (Google, GitHub 等)

6. **API 重構**
   - 使用 Supabase JavaScript Client
   - 重寫 CRUD 操作
   - 整合即時功能

### 🎯 功能改進建議

#### 1. 系統架構優化
- **API 標準化**：實作 RESTful API 標準
- **快取機制**：Redis 快取熱門查詢
- **CDN 整合**：靜態資源 CDN 加速
- **微服務架構**：拆分 AI 服務為獨立微服務
- **容器化部署**：Docker 容器化部署

#### 2. AI 功能增強
- **多語言支援**：支援英文獎學金資訊
- **語音助手**：語音輸入與回應
- **個人化推薦**：基於使用者背景推薦獎學金
- **智能分類**：自動分類獎學金類型
- **趨勢分析**：獎學金申請趨勢分析

#### 3. 使用者體驗改善
- **PWA 支援**：Progressive Web App 功能
- **推播通知**：重要公告推播提醒
- **個人儀表板**：個人化的資訊面板
- **收藏功能**：收藏感興趣的獎學金
- **申請追蹤**：追蹤獎學金申請狀態

#### 4. 管理功能擴展
- **批量操作**：批量匯入/匯出功能
- **統計分析**：使用者行為分析
- **A/B 測試**：介面優化測試
- **備份機制**：自動備份與還原
- **監控系統**：系統健康狀況監控

#### 5. 安全性強化
- **多因子認證**：2FA 雙因子認證
- **OAuth 整合**：Google/Microsoft 單一登入
- **API 限流**：防止 API 濫用
- **資料加密**：敏感資料加密儲存
- **安全稽核**：操作日誌與稽核

#### 6. 效能優化
- **資料庫優化**：索引優化與查詢優化
- **圖片最佳化**：自動壓縮與 WebP 格式
- **懶載入**：圖片與內容懶載入
- **Service Worker**：離線功能支援
- **壓縮與縮小化**：CSS/JS 壓縮

### 📊 具體實作計畫

#### Phase 1: 資料庫遷移 (4-6 週)
1. **Week 1-2**: Supabase 環境設定與 Schema 建立
2. **Week 3-4**: 資料遷移與 API 重構
3. **Week 5-6**: 測試與除錯

#### Phase 2: 認證系統升級 (2-3 週)
1. **Week 1**: Supabase Auth 整合
2. **Week 2**: 社群登入實作
3. **Week 3**: 測試與使用者遷移

#### Phase 3: 功能增強 (6-8 週)
1. **Week 1-2**: PWA 與推播通知
2. **Week 3-4**: AI 功能增強
3. **Week 5-6**: 個人化功能
4. **Week 7-8**: 管理功能擴展

#### Phase 4: 效能與安全性 (3-4 週)
1. **Week 1-2**: 效能優化
2. **Week 3-4**: 安全性強化

### 🧪 測試策略

#### 單元測試
- **PHPUnit**：後端邏輯測試
- **Jest**：前端 JavaScript 測試
- **Cypress**：端到端測試

#### 效能測試
- **Apache Bench**：負載測試
- **Lighthouse**：效能評分
- **WebPageTest**：詳細效能分析

#### 安全性測試
- **OWASP ZAP**：安全漏洞掃描
- **SQLMap**：SQL Injection 測試
- **Burp Suite**：滲透測試

## 📈 專案指標

### 目前狀況
- **程式碼行數**: ~15,000 行
- **功能完整度**: 85%
- **測試覆蓋率**: 需要建立
- **效能評分**: 需要評估
- **安全評分**: 需要評估

### 目標指標
- **測試覆蓋率**: > 80%
- **效能評分**: > 90 (Lighthouse)
- **可用性**: 99.9%
- **回應時間**: < 200ms
- **使用者滿意度**: > 4.5/5

## 🤝 貢獻指南

### 開發流程
1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 程式碼規範
- **PHP**: PSR-4 自動載入，PSR-12 程式碼風格
- **JavaScript**: ESLint 規範
- **CSS**: BEM 命名規範
- **Git**: Conventional Commits

## 📄 授權資訊

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 📞 聯絡資訊

- **開發者**: Ming874
- **Email**: 3526ming@gmail.com
- **專案網址**: [待補充]

## 🙏 致謝

感謝以下開源專案與服務：
- [PHPMailer](https://github.com/PHPMailer/PHPMailer)
- [smalot/pdfparser](https://github.com/smalot/pdfparser)
- [erusev/parsedown](https://github.com/erusev/parsedown)
- [Google Gemini API](https://ai.google.dev/)
- [SerpAPI](https://serpapi.com/)
- [Supabase](https://supabase.com/)

---

**最後更新**: 2025年1月28日  
**版本**: v1.0.0  
**維護狀態**: 積極維護中 🟢
