"use client";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import AnnouncementList from "@/components/AnnouncementList";


export default function Home() {
        const { isAuthenticated } = useAuth();

        return (
                // 參考管理頁樣式，使用白色背景與全寬設定
                <div className="w-full bg-white font-sans min-h-screen">
                        {/* Banner 圖片高度自動，寬度 100% */}
                        <div className="w-full">
                                <Image
                                        src="/banner.jpg"
                                        alt="NCUE Banner"
                                        width={4000}
                                        height={862}
                                        priority
                                        className="w-full h-auto object-cover"
                                />
                        </div>
                        <main className="flex flex-col gap-8 items-center sm:items-start max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                                <div className="text-center sm:text-left">
                                        <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
                                                歡迎來到 彰師校外獎學金資訊平台
                                        </h2>
                                        <p className="text-lg mb-8" style={{ color: 'var(--text-muted)' }}>
                                                您可以在這裡獲取所有校外獎學金的資訊，並且使用 AI 問答助理解答您的問題。
                                        </p>
                                </div>
                                <AnnouncementList />
                        </main>
                </div>
        );
}
