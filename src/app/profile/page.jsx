export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            個人資料
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              用戶個人資料頁面
            </h2>
            <p className="text-blue-800">
              這是一個受保護的個人資料頁面。只有已登入的用戶才能訪問此頁面。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
