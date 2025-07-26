export default function ManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            管理後台
          </h1>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-green-900 mb-3">
              ✅ 成功訪問受保護的頁面
            </h2>
            <p className="text-green-800">
              您已經成功登入並訪問了這個受保護的管理後台頁面。
              如果您沒有登入就嘗試訪問這個頁面，middleware 會自動將您重定向到登入頁面。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
