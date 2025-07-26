import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans min-h-screen">
      <main className="flex flex-col gap-8 items-center sm:items-start max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center sm:text-left">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
            歡迎來到 NCUE 獎助學金資訊平台
          </h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-muted)' }}>
            這裡是您獲取獎助學金資訊的最佳平台，我們提供完整的獎學金查詢和申請服務。
          </p>
        </div>

        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left" style={{ color: 'var(--text-muted)' }}>
          <li className="mb-2 tracking-[-.01em]">
            開始使用我們的{" "}
            <code className="bg-gray-100 font-mono font-semibold px-2 py-1 rounded" style={{ color: 'var(--primary)' }}>
              AI 獎學金助理
            </code>
            來尋找適合的獎學金
          </li>
          <li className="tracking-[-.01em]">
            註冊帳號以獲得個人化的獎學金推薦
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            href="/ai-assistant"
            className="btn-primary"
          >
            開始使用 AI 助理
          </Link>
          <Link
            href="/register"
            className="btn-secondary"
          >
            立即註冊
          </Link>
        </div>
      </main>
    </div>
  );
}
