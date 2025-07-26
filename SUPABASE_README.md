# Supabase 整合指南

本專案已成功整合 Supabase 作為後端服務，提供認證、數據庫和實時功能。

## 🚀 快速開始

### 1. 環境設置

確保 `.env.local` 文件包含以下環境變數：

```bash
NEXT_PUBLIC_SUPABASE_URL=你的_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
```

### 2. 安裝依賴

```bash
npm install @supabase/supabase-js
```

### 3. 測試連線

訪問以下頁面來測試 Supabase 功能：

- **基本連線測試**: http://localhost:3000/test-supabase
- **API 連線測試**: http://localhost:3000/api/test-supabase  
- **用戶認證測試**: http://localhost:3000/test-auth

## 📁 檔案結構

```
src/app/
├── lib/
│   └── supabase.js          # Supabase 客戶端配置
├── services/
│   └── supabaseService.js   # 封裝的服務函數
├── api/
│   └── test-supabase/
│       └── route.js         # API 路由測試
├── test-supabase/
│   └── page.jsx            # 連線測試頁面
└── test-auth/
    └── page.jsx            # 認證測試頁面
```

## 🔧 核心功能

### 認證服務 (authService)

```javascript
import { authService } from './services/supabaseService';

// 用戶註冊
const result = await authService.signUp(email, password, userData);

// 用戶登入
const result = await authService.signIn(email, password);

// 用戶登出
const result = await authService.signOut();

// 獲取當前用戶
const result = await authService.getCurrentUser();

// 重設密碼
const result = await authService.resetPassword(email);

// 監聽認證狀態變化
const subscription = authService.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

### 數據庫服務 (dbService)

```javascript
import { dbService } from './services/supabaseService';

// 測試數據庫連線
const result = await dbService.testConnection();

// 獲取用戶資料
const result = await dbService.getUserProfile(userId);

// 更新用戶資料
const result = await dbService.updateUserProfile(userId, profileData);
```

### 實時訂閱 (realtimeService)

```javascript
import { realtimeService } from './services/supabaseService';

// 訂閱表格變化
const subscription = realtimeService.subscribeToTable('users', (payload) => {
  console.log('Table change:', payload);
});

// 取消訂閱
realtimeService.unsubscribe(subscription);
```

## 🛠️ Middleware 整合

專案已整合 Supabase 認證到 Next.js middleware 中：

```javascript
// middleware.js 會自動：
// 1. 檢查用戶認證狀態
// 2. 保護需要登入的路由
// 3. 重定向未認證用戶到登入頁面
```

受保護的路由：
- `/manage` - 管理後台
- `/profile` - 個人資料
- `/my-scholarships` - 我的申請

## 📋 測試清單

### ✅ 連線測試
- [x] Supabase 基本連線
- [x] 環境變數檢查
- [x] API 路由測試
- [x] 客戶端/服務器端測試

### ✅ 認證測試
- [x] 用戶註冊
- [x] 用戶登入
- [x] 用戶登出
- [x] 密碼重設
- [x] 認證狀態監聽

### 🔄 進階功能 (待實現)
- [ ] 用戶資料管理
- [ ] 角色權限系統
- [ ] 數據表結構設計
- [ ] 實時數據同步
- [ ] 檔案存儲功能

## 🚨 注意事項

1. **安全性**: Service Role Key 只能在服務器端使用
2. **RLS**: 建議啟用 Row Level Security 保護數據
3. **速率限制**: 注意 Supabase 的 API 調用限制
4. **錯誤處理**: 所有 API 調用都包含錯誤處理機制

## 📞 支援

如有問題，請檢查：
1. 環境變數是否正確設置
2. Supabase 專案是否正常運行
3. 網路連線是否正常
4. 查看瀏覽器開發者工具的錯誤訊息

## 🎯 下一步

1. 設計用戶資料表結構
2. 實現完整的用戶管理系統
3. 整合到現有的 Header 認證流程
4. 添加用戶權限管理
5. 實現獎學金申請相關功能
