"use client";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import AnnouncementList from "@/components/AnnouncementList";


export default function Home() {
	const { isAuthenticated } = useAuth();

	return (
		<div className="font-sans min-h-screen">
			<div className="relative w-full h-48 md:h-64 xl:h-80 overflow-hidden">
				<Image
					src="/banner.jpg"
					alt="NCUE Banner"
					fill
					priority
					className="object-cover xl:object-contain object-center transition-all duration-300"
				/>
			</div>
			<main className="flex flex-col gap-8 items-center sm:items-start max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="text-center sm:text-left">
					<h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
						歡迎來到 NCUE 獎助學金資訊平台
					</h2>
					<p className="text-lg mb-8" style={{ color: 'var(--text-muted)' }}>
						這裡是您獲取獎助學金資訊的最佳平台，我們提供完整的獎學金查詢和申請服務。
					</p>
				</div>
				<AnnouncementList />
			</main>
		</div>
	);
}
