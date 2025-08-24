"use client";

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image'; // 建議使用 Next.js 的 Image 組件以優化圖片

// --- Animation Settings ---
const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.05,
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};

// Table of Contents Component
const TableOfContents = ({ sections, activeId, onLinkClick }) => {
    const isSectionActive = (section) => {
        if (!activeId) return false;
        const sectionPrefix = section.id.split('_')[0];
        return activeId.startsWith(sectionPrefix);
    };

    return (
        <nav className="sticky top-24 hidden lg:block">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">條款目錄</h3>
            <ul className="space-y-4">
                {sections.map(section => (
                    <li key={section.id}>
                        <a
                            href={`#${section.id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                const targetId = section.articles.length > 0 ? section.articles[0].id : section.id;
                                onLinkClick(targetId);
                            }}
                            className={`flex items-center text-sm transition-colors duration-200 ${isSectionActive(section)
                                ? 'font-bold text-slate-700'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {section.title}
                        </a>
                        {section.articles.length > 0 && (
                            <ul className="mt-3 space-y-1 pl-2 border-l border-slate-200">
                                {section.articles.map(article => (
                                    <li key={article.id} className="relative">
                                        <a
                                            href={`#${article.id}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onLinkClick(article.id);
                                            }}
                                            className={`block py-1.5 pl-4 pr-2 text-sm transition-colors duration-200 relative ${activeId === article.id
                                                ? 'font-semibold text-violet-500'
                                                : 'text-slate-500 hover:text-violet-500'
                                                }`}
                                        >
                                            {article.title}
                                        </a>
                                        <AnimatePresence>
                                            {activeId === article.id && (
                                                <motion.div
                                                    layoutId="active-toc-indicator"
                                                    className="absolute left-[-1px] top-0 bottom-0 w-0.5 bg-violet-400 rounded-full"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
};

// Content Section with Scroll Highlighting
const ContentSection = ({ id, activeId, title, titleAs: TitleComponent = 'h3', children }) => {
    const isActive = activeId === id;

    return (
        <motion.section
            variants={itemVariants}
            id={id}
            className={`scroll-mt-24 -mx-6 p-6 rounded-2xl transition-all duration-300 ease-in-out border-l-4 ${isActive
                ? 'bg-violet-50/70 border-violet-300'
                : 'border-transparent'
                }`}
        >
            {title && (
                <TitleComponent className={`text-xl sm:text-2xl font-bold transition-colors duration-300 ${isActive ? 'text-violet-700' : 'text-slate-800'}`}>
                    {title}
                </TitleComponent>
            )}
            <article className="prose prose-slate max-w-none mt-4 prose-p:leading-relaxed prose-a:text-violet-500 hover:prose-a:underline">
                {children}
            </article>
        </motion.section>
    );
};


// --- Main Page Component ---
export default function TermsAndPrivacyPage() {
    const [activeId, setActiveId] = useState('tos_1');
    const isClickScrolling = useRef(false);
    const scrollTimeout = useRef(null);
    const observerRef = useRef(null);

    const sections = [
        {
            id: 'tos', title: '第一部分：服務條款', articles: [
                { id: 'tos_1', title: '第一條、認知與接受條款' },
                { id: 'tos_2', title: '第二條、服務說明' },
                { id: 'tos_3', title: '第三條、使用者註冊與帳戶安全' },
                { id: 'tos_4', title: '第四條、使用者行為與義務' },
                { id: 'tos_5', title: '第五條、智慧財產權' },
                { id: 'tos_6', title: '第六條、服務之中斷或變更' },
                { id: 'tos_7', title: '第七條、責任限制與免責聲明' },
            ]
        },
        {
            id: 'privacy', title: '第二部分：隱私權政策', articles: [
                { id: 'privacy_8', title: '第八條、個人資料之蒐集目的與類別' },
                { id: 'privacy_9', title: '第九條、個人資料處理與利用之期間、地區、對象及方式' },
                { id: 'privacy_10', title: '第十條、您對個人資料可行使之權利' },
                { id: 'privacy_11', title: '第十一條、資料安全' },
                { id: 'privacy_12', title: '第十二條、Cookie之使用' },
                { id: 'privacy_13', title: '第十三條、隱私權政策之修正' },
            ]
        },
        {
            id: 'general', title: '第三部分：一般條款', articles: [
                { id: 'general_14', title: '第十四條、準據法與管轄法院' },
                { id: 'general_15', title: '第十五條、聯絡我們' },
            ]
        },
    ];

    // 處理目錄連結點擊事件 (Handle TOC link click)
    const handleLinkClick = (id) => {
        isClickScrolling.current = true;
        setActiveId(id);

        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `#${id}`);

        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

        scrollTimeout.current = setTimeout(() => {
            isClickScrolling.current = false;
        }, 1000);
    };

    // 設定滾動監聽與 Intersection Observer
    useEffect(() => {
        const handleManualScroll = () => {
            if (isClickScrolling.current) {
                isClickScrolling.current = false;
                if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
            }
        };

        window.addEventListener('wheel', handleManualScroll, { passive: true });
        window.addEventListener('touchmove', handleManualScroll, { passive: true });

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (isClickScrolling.current) return;

                const intersectingEntries = entries.filter(entry => entry.isIntersecting);

                if (intersectingEntries.length > 0) {
                    const topEntry = intersectingEntries.sort(
                        (a, b) => Math.abs(a.boundingClientRect.top - window.innerHeight / 2) - Math.abs(b.boundingClientRect.top - window.innerHeight / 2)
                    )[0];
                    setActiveId(topEntry.target.id);
                }
            },
            {
                rootMargin: `-40% 0px -40% 0px`,
            }
        );

        const allArticleElements = sections.flatMap(s => s.articles.map(a => document.getElementById(a.id))).filter(Boolean);
        allArticleElements.forEach(el => {
            if (el) observerRef.current.observe(el);
        });

        return () => {
            window.removeEventListener('wheel', handleManualScroll);
            window.removeEventListener('touchmove', handleManualScroll);
            if (observerRef.current) observerRef.current.disconnect();
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sections]);

    return (
        <div className="bg-slate-50 text-slate-700">
            <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row justify-center gap-x-16">
                    <div className="w-full lg:w-64 lg:flex-shrink-0 mb-12 lg:mb-0">
                        <TableOfContents sections={sections} activeId={activeId} onLinkClick={handleLinkClick} />
                    </div>
                    <main className="w-full max-w-4xl min-w-0">
                        <motion.div
                            className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                                彰師十宿資訊平台 服務條款暨隱私權政策
                            </motion.h1>

                            <motion.p variants={itemVariants} className="mt-8"><strong>最後更新日期：2025年8月24日</strong></motion.p>
                            <motion.p variants={itemVariants} className="mt-4">歡迎您使用由 <strong>Google Developer Group On Campus NCUE</strong>（以下簡稱「我們」）協助<strong>國立彰化師範大學第十宿舍</strong>（以下簡稱「十宿」）所建置與維護之「彰師十宿資訊平台」（以下簡稱「本平台」）。</motion.p>
                            <motion.p variants={itemVariants} className="mt-4">為保障您的權益，請於註冊及使用本平台所有服務前，詳細閱讀以下條款。當您完成註冊程序或開始使用本平台服務時，即視為您已<strong>閱讀、理解並同意接受</strong>本服務條款暨隱私權政策（以下合稱「本條款」）之所有內容。</motion.p>
                            <hr className="my-10" />

                            <motion.h2 variants={itemVariants} className="text-2xl sm:text-3xl font-bold border-b border-slate-200 pb-4 mt-12 mb-2 text-slate-900">第一部分：服務條款</motion.h2>

                            <ContentSection id="tos_1" activeId={activeId} title="第一條、認知與接受條款">
                                <ol className="list-decimal pl-5 space-y-3">
                                    <li>您同意本條款之內容，包括我們可能隨時修改的任何條款。所有修改將於本平台公告後生效，<strong>我們將不另行個別通知</strong>。若您在修改後繼續使用本平台，即視為您已接受該等修改。</li>
                                    <li>若您為<strong>未滿十八歲之未成年人</strong>，應於您的<strong>法定代理人</strong>（或監護人）閱讀、理解並同意本條款之所有內容後，方得註冊為使用者及使用本平台。當您完成註冊時，即<strong>推定您的法定代理人已同意</strong>。</li>
                                </ol>
                            </ContentSection>

                            <ContentSection id="tos_2" activeId={activeId} title="第二條、服務說明">
                                <ol className="list-decimal pl-5 space-y-3">
                                    <li>本平台提供一站式十宿相關資訊服務，主要功能包括：
                                        <ul className="list-disc pl-5 space-y-2 mt-2">
                                            <li>彙整並展示十宿相關公告。</li>
                                            <li>利用人工智慧（AI）技術，對本平台管理員提供之資料（包括但不限於 PDF檔案、外部網址、純文字）進行自動化分析、生成內容摘要及提取結構化資訊。</li>
                                            <li>提供註冊使用者 AI 聊天機器人問答服務。</li>
                                            <li>提供居民查詢違規記點之服務。</li>
                                            <li>提供居民期末退宿申請之相關服務。</li>
                                        </ul>
                                    </li>
                                    <li className="mt-4">
                                        <strong>【AI生成內容免責聲明】</strong>
                                        <p className='mt-2'>您認知並同意，本平台使用之 AI 模型（包括但不限於 Google Gemini 系列模型）所生成之摘要、提取之結構化資料及聊天機器人回覆，其內容<strong>可能存在錯誤、不完整或過時之情況</strong>。<strong>AI生成之內容僅供參考，不構成任何形式的建議、保證或法律意見。</strong> 您有最終責任詳閱原始公告內容，並自行向十宿樓長核實所有資訊的準確性與有效性。我們<strong>不對因信賴 AI 生成內容而導致的任何損失</strong>（包括但不限於錯過申請期限）<strong>承擔任何責任</strong>。</p>
                                    </li>
                                </ol>
                            </ContentSection>

                            <ContentSection id="tos_3" activeId={activeId} title="第三條、使用者註冊與帳戶安全">
                                <ol className="list-decimal pl-5 space-y-3">
                                    <li>您承諾以<strong>真實、正確、最新及完整</strong>的資料註冊帳號。若您提供任何錯誤或不實的資料，我們有權<strong>暫停或終止您的帳號</strong>。</li>
                                    <li>您有義務妥善保管您的帳戶與密碼，並為此組帳戶與密碼登入後所進行之一切活動負責。<strong>請勿將帳戶與密碼洩漏或提供予第三人</strong>。</li>
                                </ol>
                            </ContentSection>

                            <ContentSection id="tos_4" activeId={activeId} title="第四條、使用者行為與義務">
                                <p>您承諾<strong>絕不為任何非法目的或以任何非法方式使用本平台</strong>，並承諾遵守中華民國相關法規及一切使用網際網路之國際慣例。您同意並保證不得利用本平台服務從事侵害他人權益或違法之行為，包括但不限於：</p>
                                <ol className="list-decimal pl-5 space-y-3 mt-4">
                                    <li>上傳、張貼、公布或傳送任何誹謗、侮辱、具威脅性、攻擊性、不雅、猥褻、不實、違反公共秩序或善良風俗之內容。</li>
                                    <li>未經授權，擅自<strong>重製、散布、改作、編輯、公開傳輸、進行還原工程、解編或反向組譯</strong>本平台之任何資料或功能。</li>
                                    <li>利用自動化工具（如網路爬蟲、機器人）大量抓取、複製本平台之資訊，對伺服器造成不當負擔。</li>
                                    <li>上傳、傳輸任何含有<strong>電腦病毒</strong>或有害程式碼的資料。</li>
                                </ol>
                            </ContentSection>

                            <ContentSection id="tos_5" activeId={activeId} title="第五條、智慧財產權">
                                <ol className="list-decimal pl-5 space-y-3">
                                    <li>本平台上所有內容，包括但不限於程式碼、介面設計、文字、圖片、資料等，均由我們、十宿或其他權利人依法擁有其<strong>智慧財產權</strong>。</li>
                                    <li>若您為管理員，您上傳或提供的資料，您保證絕無侵害他人智慧財產權，並同意授權本平台在服務範圍內進行必要之利用。此授權為<strong>非專屬、全球性、免權利金</strong>，並於您刪除該等內容時終止。</li>
                                </ol>
                            </ContentSection>

                            <ContentSection id="tos_6" activeId={activeId} title="第六條、服務之中斷或變更">
                                <ol className="list-decimal pl-5 space-y-3">
                                    <li>我們保留隨時修改、暫時或永久停止提供本平台服務之權利，您同意我們對於任何服務之修改、暫停或終止，對您或任何第三方<strong>均不負任何責任</strong>。</li>
                                    <li>在下列情形，我們將暫停或中斷本平台服務，且對使用者任何直接或間接之損害，<strong>均不負任何賠償責任</strong>：
                                        <ul className="list-disc pl-5 space-y-2 mt-2">
                                            <li>對本平台相關軟硬體設備進行搬遷、更換、升級、保養或維修時。</li>
                                            <li>發生突發性之電子通信設備故障時。</li>
                                            <li>天災或其他<strong>不可抗力</strong>之因素致使本平台無法提供服務時。</li>
                                        </ul>
                                    </li>
                                </ol>
                            </ContentSection>

                            <ContentSection id="tos_7" activeId={activeId} title="第七條、責任限制與免責聲明">
                                <ol className="list-decimal pl-5 space-y-3">
                                    <li>本平台僅依「<strong>現況</strong>」及「<strong>現有</strong>」基礎提供服務，我們<strong>不提供任何明示或默示的擔保</strong>。</li>
                                    <li>本平台<strong>不保證服務之穩定、安全、無誤、及不中斷</strong>。您應自行承擔使用本服務之所有風險及可能致生之任何損害。</li>
                                    <li>對於您透過本平台連結至其他網站而下載的軟體或資料，我們<strong>不負任何擔保責任</strong>。您應自行考量風險。</li>
                                </ol>
                            </ContentSection>

                            <hr className="my-10" />

                            <motion.h2 variants={itemVariants} className="text-2xl sm:text-3xl font-bold border-b border-slate-200 pb-4 mt-12 mb-2 text-slate-900">第二部分：隱私權政策</motion.h2>

                            <ContentSection id="privacy_8" activeId={activeId} title="第八條、個人資料之蒐集目的與類別">
                                <p>為提供您完善的服務，我們將於下列目的範圍內，蒐集您的個人資料：</p>
                                <ol className="list-decimal pl-5 space-y-3 mt-4">
                                    <li><strong>使用者註冊與管理</strong>：當您註冊本平台帳號時，我們會蒐集您的：
                                        <ul className="list-disc pl-5 space-y-2 mt-2">
                                            <li><strong>C001 辨識個人者</strong>：使用者名稱、電子郵件地址。</li>
                                            <li><strong>C002 辨識財務者</strong>：密碼（以<strong>加密</strong>方式儲存）。</li>
                                        </ul>
                                    </li>
                                    <li><strong>AI 問答機器人服務</strong>：我們會蒐集您的<strong>對話記錄</strong>，以提供問答服務並優化 AI 模型。</li>
                                </ol>
                            </ContentSection>

                            <ContentSection id="privacy_9" activeId={activeId} title="第九條、個人資料處理與利用之期間、地區、對象及方式">
                                <ol className="list-decimal pl-5 space-y-3">
                                    <li><strong>期間</strong>：自您同意本條款之日起，至您終止使用本平台服務或本平台停止提供服務之日止。</li>
                                    <li><strong>地區</strong>：您的個人資料將儲存於<strong>彰化師範大學學生會伺服器</strong>。</li>
                                    <li><strong>對象及方式</strong>：
                                        <ul className="list-disc pl-5 space-y-2 mt-2">
                                            <li>您的個人資料將僅供我們，於蒐集目的範圍內處理及利用。</li>
                                            <li>為提供AI服務，管理員上傳的<strong>非個人資料</strong>內容將會傳送至第三方AI服務提供商（如 Google Gemini API）。</li>
                                            <li>除法律規定外，我們<strong>絕不會將您的個人資料提供、交換、出租或出售</strong>給任何其他個人、團體、私人企業或公務機關。</li>
                                        </ul>
                                    </li>
                                </ol>
                            </ContentSection>

                            <ContentSection id="privacy_10" activeId={activeId} title="第十條、您對個人資料可行使之權利">
                                <p>依據中華民國<strong>《個人資料保護法》</strong>第三條之規定，您就我們保有之您的個人資料，得行使下列權利：</p>
                                <ol className="list-decimal pl-5 space-y-3 mt-4">
                                    <li>查詢或請求閱覽。</li>
                                    <li>請求製給複製本。</li>
                                    <li>請求補充或更正。</li>
                                    <li>請求停止蒐集、處理或利用。</li>
                                    <li><strong>請求刪除</strong>。</li>
                                </ol>
                                <p className="mt-4">如欲行使上述權利，您可透過 <a href="mailto:3526ming@gmail.com">3526ming@gmail.com</a> 與我們聯繫。我們將於收到您的請求後，依法儘速處理。</p>
                            </ContentSection>

                            <ContentSection id="privacy_11" activeId={activeId} title="第十一條、資料安全">
                                <p>我們致力於以合理的技術與程序，保護所有個人資料之安全。您的密碼將以<strong>單向加密</strong>方式儲存，確保即使是內部人員也無法得知您的密碼原文。我們亦採取適當的<strong>存取控制</strong>，防止未經授權的資料存取。</p>
                            </ContentSection>

                            <ContentSection id="privacy_12" activeId={activeId} title="第十二條、Cookie之使用">
                                <p>為提供您最佳的服務，本平台會在您的電腦中放置並取用我們的<strong>Cookie</strong>。若您關閉Cookie，可能會導致登入異常等部分網站功能無法正常執行。</p>
                            </ContentSection>

                            <ContentSection id="privacy_13" activeId={activeId} title="第十三條、隱私權政策之修正">
                                <p>本隱私權政策將因應需求隨時進行修正，修正後的條款將刊登於網站上，<strong>不另行個別通知</strong>。建議您隨時留意本政策之最新版本。</p>
                            </ContentSection>

                            <hr className="my-10" />

                            <motion.h2 variants={itemVariants} className="text-2xl sm:text-3xl font-bold border-b border-slate-200 pb-4 mt-12 mb-2 text-slate-900">第三部分：一般條款</motion.h2>

                            <ContentSection id="general_14" activeId={activeId} title="第十四條、準據法與管轄法院">
                                <p>本條款之解釋與適用，以及與本條款有關的爭議，均應依照<strong>中華民國法律</strong>予以處理，並以<strong>台灣彰化地方法院</strong>為第一審管轄法院。</p>
                            </ContentSection>

                            <ContentSection id="general_15" activeId={activeId} title="第十五條、聯絡我們">
                                <p>若您對本條款有任何問題，歡迎隨時透過 <a href="mailto:3526ming@gmail.com">3526ming@gmail.com</a> 與我們聯繫。</p>
                            </ContentSection>

                            <motion.div variants={itemVariants} className="border-t border-slate-200 mt-12 pt-6 flex justify-end items-center gap-x-4">
                                <p className="italic text-slate-500 text-sm">
                                    Developed & Maintained by Google Developer Group On Campus NCUE.
                                </p>
                                <img
                                    src="/GDG.gif"
                                    alt="Google Developer Group On Campus NCUE Logo"
                                    className="h-14 w-auto"
                                />
                            </motion.div>

                        </motion.div>
                    </main>
                </div>
            </div>

            <footer className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20 max-w-4xl mx-auto lg:pl-80">
                        <p className="text-sm text-slate-500">最新修訂：2025年8月24日</p>
                        <a
                            href="/"
                            className="inline-flex items-center gap-2 rounded-md bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 transition-colors"
                        >
                            回到首頁
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}