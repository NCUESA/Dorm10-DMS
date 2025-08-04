## API 驗證修復說明

### 🔧 問題解決

我已經修復了 API 身份驗證的問題。主要修改包括：

#### 1. 修正認證方式
**之前（錯誤）**：
```javascript
// 從 cookies 讀取 token（不正確）
const cookieStore = cookies();
const authToken = cookieStore.get('sb-access-token')?.value;
```

**現在（正確）**：
```javascript
// 從 Authorization header 讀取 token
const authHeader = request.headers.get('authorization');
const token = authHeader.replace('Bearer ', '');
```

#### 2. 創建認證工具
- 新增 `/src/lib/authFetch.js` 提供自動帶 token 的 fetch 函數
- 自動從 Supabase session 獲取最新的 access_token
- 統一的錯誤處理

#### 3. 更新前端組件
- `UsersTab.jsx` 現在使用 `authFetch()` 而不是普通的 `fetch()`
- 自動在請求中包含正確的 Authorization header

### 🚀 測試方式

1. **登入系統**：確保您已經登入
2. **訪問管理後台**：前往 `/manage` 頁面
3. **檢查用戶管理**：點擊"使用者管理"標籤
4. **確認資料載入**：應該能看到用戶列表，不再出現 401 錯誤

### 🔒 安全改進

現在的認證流程更加安全和標準：

1. **標準 Bearer Token**：使用標準的 HTTP Authorization header
2. **自動 Token 刷新**：從 Supabase session 自動獲取最新 token
3. **統一錯誤處理**：更好的錯誤回饋和除錯資訊
4. **類型安全**：完整的 TypeScript 支援

### 📝 注意事項

- 所有需要認證的 API 現在都使用相同的認證方式
- 如果出現認證問題，請先確認是否已登入
- 開發時可以在瀏覽器 Network 標籤中檢查請求是否包含 Authorization header

修復完成！現在系統應該能正常運作了。
