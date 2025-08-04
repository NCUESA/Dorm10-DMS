# 按鈕組件使用指南

## 概述
這個專案已經更新了統一的按鈕設計系統，包含三個主要組件：
- `Button` - 通用按鈕組件
- `IconButton` - 圖示按鈕組件
- `ButtonGroup` - 按鈕群組組件

## 導入方式

```jsx
import Button from '@/components/ui/Button'
import IconButton from '@/components/ui/IconButton'
import ButtonGroup from '@/components/ui/ButtonGroup'

// 或者統一導入
import { Button, IconButton, ButtonGroup } from '@/components/ui'
```

## Button 組件

### 基本用法
```jsx
<Button>基本按鈕</Button>
```

### 變體 (variant)
- `primary` - 主要按鈕（預設）
- `secondary` - 次要按鈕
- `success` - 成功按鈕
- `danger` - 危險按鈕
- `warning` - 警告按鈕
- `ghost` - 幽靈按鈕（透明背景）
- `link` - 連結樣式按鈕

```jsx
<Button variant="primary">主要按鈕</Button>
<Button variant="secondary">次要按鈕</Button>
<Button variant="danger">刪除</Button>
```

### 尺寸 (size)
- `sm` - 小按鈕
- `default` - 預設尺寸
- `lg` - 大按鈕
- `xl` - 超大按鈕

```jsx
<Button size="sm">小按鈕</Button>
<Button size="lg">大按鈕</Button>
```

### 帶圖示
```jsx
<Button 
  leftIcon={<PlusIcon />}
  variant="primary"
>
  新增項目
</Button>

<Button 
  rightIcon={<ArrowIcon />}
  variant="secondary"
>
  繼續
</Button>
```

### 載入狀態
```jsx
<Button loading>載入中...</Button>
<Button loading disabled>處理中</Button>
```

### 禁用狀態
```jsx
<Button disabled>無法點擊</Button>
```

## IconButton 組件

### 基本用法
```jsx
<IconButton>
  <EditIcon />
</IconButton>
```

### 帶提示工具
```jsx
<IconButton tooltip="編輯">
  <EditIcon />
</IconButton>
```

### 不同變體
```jsx
<IconButton variant="danger" tooltip="刪除">
  <DeleteIcon />
</IconButton>
```

## ButtonGroup 組件

### 水平按鈕組
```jsx
<ButtonGroup>
  <Button variant="secondary">選項1</Button>
  <Button variant="secondary">選項2</Button>
  <Button variant="secondary">選項3</Button>
</ButtonGroup>
```

### 垂直按鈕組
```jsx
<ButtonGroup orientation="vertical">
  <Button>選項1</Button>
  <Button>選項2</Button>
  <Button>選項3</Button>
</ButtonGroup>
```

### 分離的按鈕組
```jsx
<ButtonGroup connected={false}>
  <Button>全部</Button>
  <Button variant="ghost">已開放</Button>
  <Button variant="ghost">已關閉</Button>
</ButtonGroup>
```

## 實際使用範例

### 表單按鈕
```jsx
<div className="flex justify-end gap-2">
  <Button variant="ghost" onClick={handleCancel}>
    取消
  </Button>
  <Button onClick={handleSave} loading={isSaving}>
    儲存
  </Button>
</div>
```

### 動作按鈕
```jsx
<div className="flex gap-2">
  <IconButton tooltip="編輯">
    <EditIcon />
  </IconButton>
  <IconButton variant="danger" tooltip="刪除">
    <DeleteIcon />
  </IconButton>
</div>
```

### 篩選按鈕
```jsx
<ButtonGroup connected={false}>
  <Button variant={filter === 'all' ? 'primary' : 'ghost'}>
    全部
  </Button>
  <Button variant={filter === 'open' ? 'primary' : 'ghost'}>
    開放中
  </Button>
  <Button variant={filter === 'closed' ? 'primary' : 'ghost'}>
    已關閉
  </Button>
</ButtonGroup>
```

## 樣式特色

### 視覺效果
- ✅ 統一的圓角和陰影
- ✅ 平滑的 hover 動畫效果
- ✅ focus 狀態的無障礙支援
- ✅ 載入和禁用狀態的視覺反饋

### 互動效果
- ✅ hover 時輕微放大 (scale)
- ✅ active 時縮小效果
- ✅ 載入時的旋轉動畫
- ✅ 色彩過渡動畫

### 響應式設計
- ✅ 自動適應不同螢幕尺寸
- ✅ 觸控友好的大小
- ✅ 高對比度支援

## 更新後的檔案

已更新使用新按鈕組件的檔案：
1. `src/components/AnnouncementList.jsx` - 篩選按鈕
2. `src/components/admin/AnnouncementsTab.jsx` - 新增和動作按鈕
3. `src/components/admin/UsersTab.jsx` - 使用者管理按鈕
4. `src/components/Header.jsx` - 登出和選單按鈕
5. `src/components/CreateAnnouncementModal.jsx` - 模態框按鈕
6. `src/app/ai-assistant/page.jsx` - AI 分析按鈕

## 展示頁面

訪問 `/button-showcase` 頁面查看所有按鈕變體的展示。

## 注意事項

1. 舊的 CSS 類別（如 `btn-modern`）已經被新組件取代
2. 新組件自動處理 focus、hover 和 active 狀態
3. 所有按鈕都支援鍵盤導航和螢幕閱讀器
4. 載入狀態會自動禁用按鈕點擊
