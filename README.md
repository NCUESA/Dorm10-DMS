# 🎓 NCUE 獎學金資訊平台

> 國立彰化師範大學生輔組校外獎學金資訊管理平台  
> An intelligent scholarship platform powered by Multimodal LLM for automated parsing, data extraction, and summarization.

[![Next.js](https://img.shields.io/badge/Next.js-15.4.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.53.0-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)

## ✨ 功能特色

- 🤖 **AI 獎學金助理**：由 Gemini 2.5 Flash 驅動的智能問答系統
- 📄 **多格式文件解析**：自動解析 PDF、URL 等多種來源
- 🔍 **智能搜尋與篩選**：快速找到適合的獎學金機會
- 📱 **響應式設計**：支援桌面與行動裝置
- 🔐 **安全認證系統**：整合 Supabase Auth 的完整使用者管理
- 📊 **管理後台**：獎學金資訊管理與統計分析
- 🔔 **通知系統**：LINE Bot 與 Email 通知整合

## 🚀 快速開始

### 環境需求

- Node.js 18.0 或更高版本
- npm 或 yarn
- Supabase 帳戶（用於資料庫和認證）

### 安裝步驟

1. **複製專案**
   ```bash
   git clone https://github.com/NCUESA/NCUE-Scholarship.git
   cd NCUE-Scholarship
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **環境變數設定**
   ```bash
   cp .env.template .env.local
   ```
   
   編輯 `.env.local` 並填入以下必要參數：
   ```env
   # Supabase 設定
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # AI 服務
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   
   # Email 服務
   SMTP_HOST=your_smtp_host
   SMTP_PORT=your_smtp_port
   SMTP_USERNAME=your_smtp_username
   SMTP_PASSWORD=your_smtp_password
   
   # LINE Bot (選填)
   LINE_CHANNEL_ACCESS_TOKEN=your_line_token
   ```

4. **啟動開發伺服器**
   ```bash
   npm run dev
   ```
   
   開啟瀏覽器訪問 `http://localhost:3000`

## 🏗️ 專案架構

```
NCUE-Scholarship/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 認證相關頁面
│   │   ├── (user)/            # 使用者頁面
│   │   ├── api/               # API 路由
│   │   ├── ai-assistant/      # AI 助理頁面
│   │   └── manage/            # 管理後台
│   ├── components/            # React 元件
│   │   ├── ui/               # 基礎 UI 元件
│   │   ├── auth/             # 認證元件
│   │   └── admin/            # 管理員元件
│   ├── contexts/             # React Context
│   ├── hooks/                # 自訂 Hooks
│   ├── lib/                  # 核心服務
│   │   ├── supabase/        # Supabase 客戶端
│   │   ├── apiBase.js       # API 基礎設定
│   │   └── security.js      # 安全性工具
│   └── utils/               # 工具函式
├── public/                   # 靜態資源
├── supabase/                # 資料庫 Schema
└── scripts/                 # 建置腳本
```

## 🔧 開發指令

```bash
# 開發模式
npm run dev

# 建置專案
npm run build

# 生產環境啟動
npm start

# 程式碼檢查
npm run lint

# 型別檢查
npm run type-check
```

## 🌐 部署

### Vercel 部署（推薦）

1. 連接 GitHub 倉庫到 Vercel
2. 設定環境變數
3. 自動部署

### 手動部署

```bash
# 建置專案
npm run build

# 啟動生產伺服器
npm start
```

## 🛠️ 技術棧

### 前端技術
- **Next.js 15** - React 全端框架
- **React 19** - 使用者介面函式庫
- **Tailwind CSS 4** - CSS 框架
- **Framer Motion** - 動畫函式庫
- **Lucide React** - 圖標庫

### 後端服務
- **Supabase** - 資料庫與認證
- **Next.js API Routes** - 伺服器端 API
- **Gemini AI** - 人工智慧服務

### 開發工具
- **TypeScript** - 型別安全（部分檔案）
- **ESLint** - 程式碼檢查
- **Prettier** - 程式碼格式化

## 🗄️ 資料庫結構

主要資料表：
- `users` - 使用者資訊
- `announcements` - 獎學金公告
- `applications` - 申請記錄
- `chat_history` - AI 對話記錄

完整 Schema 請參考 `supabase/supabase_schema.sql`

## 🔐 安全性

- **CORS 保護**：設定適當的跨域請求政策
- **API 代理**：隱藏真實 Supabase 端點
- **認證中介**：保護敏感路由
- **輸入驗證**：防止 SQL 注入和 XSS 攻擊

## 🚨 故障排除

### 常見問題

1. **CORS 錯誤**
   - 檢查 `next.config.mjs` 中的 CORS 設定
   - 確認 Supabase URL 設定正確

2. **Supabase 連接失敗**
   - 驗證環境變數設定
   - 檢查 Supabase 服務狀態

3. **AI 助理無回應**
   - 確認 Gemini API Key 有效
   - 檢查 API 配額限制

### 除錯模式

```bash
# 啟用詳細日誌
DEBUG=* npm run dev

# 檢查環境變數
npm run env-check
```

## 🤝 貢獻指南

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 建立 Pull Request

## 📄 授權條款

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 👥 開發團隊

- **Tai Ming Chen** - 主要開發者
- **Grason Yang** - 協作開發者
- **NCUE 生輔組** - 專案指導

## 📞 聯絡資訊

- 📧 技術支援：[3526ming@gmail.com](mailto:3526ming@gmail.com)
- 🐛 問題回報：[GitHub Issues](https://github.com/NCUESA/NCUE-Scholarship/issues)
- 💬 意見回饋：[Google Form](https://forms.gle/GmPVHsdV7mLeGyhx7)

## 🙏 致謝

感謝所有為此專案貢獻的開發者和使用者，以及提供支援的彰化師範大學生輔組。

---

<div align="center">
  <sub>由 ❤️ 和 ☕ 打造，為 NCUE 學生服務</sub>
</div>
