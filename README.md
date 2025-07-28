# NCUE Scholarship 專案

此專案為國立彰化師範大學的獎學金管理與申請平台，以 **Next.js 15** 與 **React 19** 建製，並整合 **Supabase** 做為後端服務。同時也提供 AI 助理功能，協助學生尋找適合的獎學金。

## 安裝步驟
1. 將 `.env.template` 複製成 `.env.local` 並填入 Supabase 相關參數。
2. 安裝依賴：
   ```bash
   npm install
   ```
3. 啟動開發伺服器：
   ```bash
   npm run dev
   ```
   伺服器預設埠號為 `http://localhost:3000`。

## 建置與部署
- 產生產業環境檔案：
  ```bash
  npm run build
  ```
- 啟動 Production 伺服器：
  ```bash
  npm start
  ```

## 專案結構
- `src/app`：應用頁面與路由，包含 `(auth)`、`(user)`、`manage` 等資料夾。
- `src/components`：共用 React 元件。
- `src/contexts`：React Context，如使用者認證狀態。
- `src/hooks`：自訂 hooks。
- `src/lib`：Supabase 初始化及相關服務。
- `src/utils`：常用工具函式。
- `src/sql`：SQL 範例或腳本。
- `public`：靜態資源。

測試頁面位於 `src/app/__tests__` 目錄，可用來驗證登入與功能流程。

## 相關技術
- **Next.js 15**
- **React 19**
- **Tailwind CSS 4**
- **Supabase**

此 README 重新整理專案重點，方便進行後續分析與維護。
