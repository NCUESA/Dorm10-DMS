"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation'; // 導入 Next.js 的 usePathname hook
import { School, HelpCircle, Mail, MessageSquare } from 'lucide-react';

export default function Footer() {
    const pathname = usePathname(); // 獲取當前的頁面路徑
    
    const isPrivacyPage = pathname === '/terms-and-privacy';

    return (
        // 動態添加 class：如果不是隱私權政策頁面，就加上 mt-24 (margin-top)
        <footer className={`bg-[#1E2129] text-white py-16 ${!isPrivacyPage ? 'mt-24' : ''}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">

                    {/* 關於平台 */}
                    <div className="text-center sm:text-left">
                        <div className="inline-block mb-6">
                            <h3 className="text-lg font-bold text-white">
                                關於平台
                            </h3>
                            <div className="w-1/2 h-0.5 bg-amber-400 mt-2"></div>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                            An intelligent scholarship platform cored by a Multimodal LLM, dynamically analyzing user-provided sources (PDFs, URLs) to achieve automated parsing, data extraction, and summarization.
                        </p>
                        <p className="text-gray-400 text-sm mt-4">
                            LLM powered by <span className="font-medium text-gray-300">Gemini 2.5 Flash</span>
                        </p>
                    </div>

                    {/* 相關資源 */}
                    <div className="text-center sm:text-left">
                        <div className="inline-block mb-6">
                            <h3 className="text-lg font-bold text-white">
                                相關資源
                            </h3>
                            <div className="w-1/2 h-0.5 bg-amber-400 mt-2"></div>
                        </div>
                        <div className="space-y-4">
                            <Link
                                href="https://stuaffweb.ncue.edu.tw/"
                                className="group flex items-center justify-center sm:justify-start gap-3 text-gray-300 hover:text-white transition-all duration-300 hover:-translate-y-0.5"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <School className="w-5 h-5 flex-shrink-0" />
                                <span className="footer-link-underline">彰師大 生輔組首頁</span>
                            </Link>
                            <Link
                                href="https://www.facebook.com/ncuestuser"
                                className="group flex items-center justify-center sm:justify-start gap-3 text-gray-300 hover:text-white transition-all duration-300 hover:-translate-y-0.5"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <svg
                                    className="w-5 h-5 flex-shrink-0"
                                    role="img"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="currentColor"
                                >
                                    <title>Facebook</title>
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                                <span className="footer-link-underline">彰師大 生輔組 FB</span>
                            </Link>
                            <Link
                                href="mailto:act5718@gmail.com"
                                className="group flex items-center justify-center sm:justify-start gap-3 text-gray-300 hover:text-white transition-all duration-300 hover:-translate-y-0.5"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <HelpCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="footer-link-underline">詢問獎學金相關問題</span>
                            </Link>
                        </div>
                    </div>

                    {/* 平台開發 */}
                    <div className="text-center sm:text-left">
                        <div className="inline-block mb-6">
                            <h3 className="text-lg font-bold text-white">
                                平台開發
                            </h3>
                            <div className="w-1/2 h-0.5 bg-amber-400 mt-2"></div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-gray-300">
                                Developed and Maintained by <br />
                                <span className="font-semibold text-white">Tai Ming Chen & Grason Yang</span>
                            </p>
                            <Link
                                href="mailto:3526ming@gmail.com"
                                className="group flex items-center justify-center sm:justify-start gap-3 text-gray-300 hover:text-white transition-all duration-300 hover:-translate-y-0.5"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Mail className="w-5 h-5 flex-shrink-0" />
                                <span className="footer-link-underline">聯繫開發者</span>
                            </Link>
                            <Link
                                href="https://forms.gle/GmPVHsdV7mLeGyhx7"
                                className="group flex items-center justify-center sm:justify-start gap-3 text-gray-300 hover:text-white transition-all duration-300 hover:-translate-y-0.5"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                                <span className="footer-link-underline">平台問題回報</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 版權資訊 */}
                <div className="border-t border-gray-700 mt-12 pt-8 text-center text-sm">
                    <p className="text-gray-400">
                        © 2025 NCUE 獎助學金資訊平台. All Rights Reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}