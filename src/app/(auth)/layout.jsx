// src/app/(auth)/layout.jsx

// 在一個模組 (檔案) 中，只能有一個 `export default`。
// 這個 AuthLayout 的唯一職責，就是為所有 (auth) 群組下的頁面
// 提供一個共享的、居中的佈局容器。

export default function AuthLayout({ children }) {
  return (
    // 這個容器會將註冊頁、登入頁等內容都置於畫面中央
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl"> {/* 稍微加寬以容納註冊頁的雙欄設計 */}
        {children} {/* children 指的就是您群組下的 page.jsx */}
      </div>
    </div>
  );
}