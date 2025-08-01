"use client";

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};

// --- 子元件 ---

// 目錄元件
const TableOfContents = ({ sections, activeId, onLinkClick }) => {
    const handleParentClick = (e, section) => {
        e.preventDefault();
        // 如果父節點有子項目，則點擊時跳轉到第一個子項目，否則跳轉到父節點自身
        const targetId = section.articles.length > 0 ? section.articles[0].id : section.id;
        onLinkClick(targetId);
    };

    const handleArticleClick = (e, articleId) => {
        e.preventDefault();
        onLinkClick(articleId);
    };

    return (
        <nav className="sticky top-24 hidden lg:block">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">條款目錄</h3>
            <ul className="mt-4 space-y-2">
                {sections.map(section => (
                    <li key={section.id}>
                        <a
                            href={`#${section.id}`}
                            onClick={(e) => handleParentClick(e, section)}
                            className={`block text-sm font-medium transition-colors ${activeId.startsWith(section.id)
                                ? 'text-indigo-600 font-semibold'
                                : 'text-slate-600 hover:text-indigo-600'
                                }`}
                        >
                            {section.title}
                        </a>
                        {section.articles.length > 0 && (
                            <ul className="mt-2 space-y-2 pl-4 border-l border-slate-200">
                                {section.articles.map(article => (
                                    <li key={article.id}>
                                        <a
                                            href={`#${article.id}`}
                                            onClick={(e) => handleArticleClick(e, article.id)}
                                            className={`block text-xs font-medium transition-colors ${activeId === article.id
                                                ? 'text-indigo-600 font-semibold'
                                                : 'text-slate-500 hover:text-indigo-600'
                                                }`}
                                        >
                                            {article.title}
                                        </a>
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

// --- 帶有滾動動畫和高亮功能的標題 ---
const MotionTitle = ({ as: Component = 'h2', id, children, className, activeId }) => {
    // 判斷當前標題是否應該高亮
    // 1. 如果是主章節標題 (id='tos'), 當 activeId 為 'tos_1', 'tos_2'... 等時, 'tos_1'.startsWith('tos') 為 true -> 高亮
    // 2. 如果是子章節標題 (id='tos_1'), 當 activeId 為 'tos_1' 時, 'tos_1'.startsWith('tos_1') 為 true -> 高亮
    const isActive = activeId.startsWith(id);

    // 根據 isActive 狀態決定文字顏色
    const titleColorClass = isActive ? 'text-indigo-600' :
        (Component === 'h2' ? 'text-slate-800' : 'text-slate-700');

    return (
        <Component id={id} className={`scroll-mt-24 transition-colors duration-300 ${titleColorClass} ${className}`}>
            <motion.span
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={itemVariants}
                className="inline-block"
            >
                {children}
            </motion.span>
        </Component>
    );
};

// --- 主頁面元件---
export default function TermsAndPrivacyPage() {
    const [activeId, setActiveId] = useState('tos_1');
    const isClickScrolling = useRef(false);
    const scrollTimeout = useRef(null);

    const sections = [
        {
            id: 'tos', title: '第一部分：服務條款', articles: [
                { id: 'tos_1', title: '第一條、認知與接受條款' }, { id: 'tos_2', title: '第二條、服務說明' },
                { id: 'tos_3', title: '第三條、使用者註冊與帳戶安全' }, { id: 'tos_4', title: '第四條、使用者行為與義務' },
                { id: 'tos_5', title: '第五條、智慧財產權' }, { id: 'tos_6', title: '第六條、服務之中斷或變更' },
                { id: 'tos_7', title: '第七條、責任限制與免責聲明' },
            ]
        },
        {
            id: 'privacy', title: '第二部分：隱私權政策', articles: [
                { id: 'privacy_8', title: '第八條、個人資料之蒐集目的與類別' }, { id: 'privacy_9', title: '第九條、個人資料處理與利用之期間、地區、對象及方式' },
                { id: 'privacy_10', title: '第十條、您對個人資料可行使之權利' }, { id: 'privacy_11', title: '第十一條、資料安全' },
                { id: 'privacy_12', title: '第十二條、Cookie之使用' }, { id: 'privacy_13', title: '第十三條、隱私權政策之修正' },
            ]
        },
        {
            id: 'general', title: '第三部分：一般條款', articles: [
                { id: 'general_14', title: '第十四條、準據法與管轄法院' }, { id: 'general_15', title: '第十五條、聯絡我們' },
            ]
        },
    ];

    const handleLinkClick = (id) => {
        // 設定旗標，告訴 IntersectionObserver 接下來的滾動是我們手動觸發的，請它暫停工作
        isClickScrolling.current = true;

        // 立即更新高亮狀態，確保 UI 即時反應
        setActiveId(id);

        // 平滑滾動至目標
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `#${id}`);

        // 設定計時器，在滾動結束後，將旗標重設，讓 IntersectionObserver 恢復工作
        // 清除上一個計時器，防止使用者連續快速點擊時出錯
        if (scrollTimeout.current) {
            clearTimeout(scrollTimeout.current);
        }
        scrollTimeout.current = setTimeout(() => {
            isClickScrolling.current = false;
        }, 1000);
    };

    // 滾動監聽邏輯
    useEffect(() => {
        const allElements = sections.flatMap(s => s.articles.map(a => document.getElementById(a.id))).filter(Boolean);

        const observer = new IntersectionObserver(
            (entries) => {
                if (isClickScrolling.current) {
                    return;
                }

                const intersectingEntries = entries.filter(entry => entry.isIntersecting);

                if (intersectingEntries.length > 0) {
                    const topEntry = intersectingEntries[0];
                    setActiveId(topEntry.target.id);
                }
            },
            {
                // 當一個標題元素的頂部進入到距離視窗頂部 25% 的位置時，我們就視為它 "isIntersecting"
                rootMargin: `-25% 0px -70% 0px`,
            }
        );

        allElements.forEach(el => observer.observe(el));

        // 元件卸載時的清理函式
        return () => {
            allElements.forEach(el => observer.unobserve(el));
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current);
            }
        };
    }, [sections]);

    const closeWindow = () => window.close();

    return (
        <div className="bg-slate-50 text-slate-800">
            <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row justify-center gap-x-16">
                    <div className="w-full lg:w-64 lg:flex-shrink-0">
                        <TableOfContents sections={sections} activeId={activeId} onLinkClick={handleLinkClick} />
                    </div>
                    <main className="w-full max-w-4xl min-w-0">
                        <motion.article
                            className="text-slate-700 leading-relaxed bg-white p-8 sm:p-12 rounded-lg shadow-sm"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >

                            <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                                生輔組 校外獎學金平台 服務條款暨隱私權政策
                            </motion.h1>

                            <motion.p variants={itemVariants} className="mt-8"><strong>最後更新日期：2025年7月31日</strong></motion.p>
                            <motion.p variants={itemVariants} className="mt-4">歡迎您使用由<strong>彰化師範大學學生事務處生活輔導組</strong>（以下簡稱「本組」）委託 <strong>Tai Ming Chen</strong>（以下簡稱「開發者」）開發與維護之「校外獎學金平台」（以下簡稱「本平台」）。</motion.p>
                            <motion.p variants={itemVariants} className="mt-4">為保障您的權益，請於註冊及使用本平台所有服務前，詳細閱讀以下條款。當您完成註冊程序或開始使用本平台服務時，即視為您已閱讀、理解並同意接受本服務條款暨隱私權政策（以下合稱「本條款」）之所有內容。</motion.p>
                            <hr className="my-8" />

                            {/* --- 服務條款 --- */}
                            <MotionTitle as="h2" id="tos" activeId={activeId} className="text-2xl sm:text-3xl font-bold border-b border-slate-200 pb-3 mt-12 mb-6">第一部分：服務條款 (Terms of Service)</MotionTitle>

                            <MotionTitle as="h3" id="tos_1" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第一條、認知與接受條款</MotionTitle>
                            <motion.ol variants={containerVariants} className="list-decimal list-outside space-y-3 pl-5">
                                <motion.li variants={itemVariants}>您同意本條款之內容，包括我們可能隨時修改的任何條款。所有修改將於本平台公告後生效，我們將不另行個別通知。若您在修改後繼續使用本平台，即視為您已接受該等修改。</motion.li>
                                <motion.li variants={itemVariants}>若您為未滿十八歲之未成年人，應於您的法定代理人（或監護人）閱讀、理解並同意本條款之所有內容後，方得註冊為使用者及使用本平台。當您完成註冊時，即推定您的法定代理人已同意。</motion.li>
                            </motion.ol>

                            <MotionTitle as="h3" id="tos_2" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第二條、服務說明</MotionTitle>
                            <motion.ol variants={containerVariants} className="list-decimal list-outside space-y-3 pl-5">
                                <motion.li variants={itemVariants}>本平台提供一站式獎學金資訊服務，主要功能包括：
                                    <ul className="list-disc list-outside space-y-2 mt-3 pl-5 text-slate-600">
                                        <li>彙整並展示校外公開之獎學金公告。</li>
                                        <li>利用人工智慧（AI）技術，對本組管理員提供之資料（包括但不限於 PDF檔案、外部網址、純文字）進行自動化分析、生成內容摘要及提取結構化資訊。</li>
                                        <li>提供註冊使用者AI聊天機器人問答服務。</li>
                                    </ul>
                                </motion.li>
                                <motion.li variants={itemVariants} className="mt-4">
                                    <strong>【AI生成內容免責聲明】</strong>
                                    <p className='mt-2'>您認知並同意，本平台使用之 AI 模型（包括但不限於 Google Gemini 系列模型）所生成之摘要、提取之結構化資料及聊天機器人回覆，其內容可能存在錯誤、不完整或過時之情況。<strong>AI生成之內容僅供參考，不構成任何形式的建議、保證或法律意見。</strong> 您有最終責任詳閱原始公告內容，並自行向獎學金提供單位核實所有申請資訊的準確性與有效性。本組及開發者不對因信賴 AI 生成內容而導致的任何損失（包括但不限於錯過申請期限、申請資格不符等）承擔任何責任。</p>
                                </motion.li>
                            </motion.ol>

                            <MotionTitle as="h3" id="tos_3" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第三條、使用者註冊與帳戶安全</MotionTitle>
                            <motion.ol variants={containerVariants} className="list-decimal list-outside space-y-3 pl-5">
                                <motion.li variants={itemVariants}>您承諾以真實、正確、最新及完整的資料註冊帳號，並隨時維持資料的準確性。若您提供任何錯誤或不實的資料，本組有權暫停或終止您的帳號。</motion.li>
                                <motion.li variants={itemVariants}>您有義務妥善保管您的帳戶與密碼，並為此組帳戶與密碼登入系統後所進行之一切活動負責。為維護您自身權益，請勿將帳戶與密碼洩漏或提供予第三人知悉。</motion.li>
                            </motion.ol>

                            <MotionTitle as="h3" id="tos_4" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第四條、使用者行為與義務</MotionTitle>
                            <motion.p variants={itemVariants}>您承諾絕不為任何非法目的或以任何非法方式使用本平台，並承諾遵守中華民國相關法規及一切使用網際網路之國際慣例。您同意並保證不得利用本平台服務從事侵害他人權益或違法之行為，包括但不限於：</motion.p>
                            <motion.ol variants={containerVariants} className="list-decimal list-outside space-y-3 pl-5 mt-4">
                                <motion.li variants={itemVariants}>上傳、張貼、公布或傳送任何誹謗、侮辱、具威脅性、攻擊性、不雅、猥褻、不實、違反公共秩序或善良風俗或其他不法之文字、圖片或任何形式的檔案。</motion.li>
                                <motion.li variants={itemVariants}>未經授權，擅自重製、散布、改作、編輯、公開傳輸、進行還原工程、解編或反向組譯本平台之任何資料、程式或功能。</motion.li>
                                <motion.li variants={itemVariants}>利用自動化工具（如網路爬蟲、機器人）大量抓取、複製本平台之資訊，對本平台伺服器造成不當負擔。</motion.li>
                                <motion.li variants={itemVariants}>上傳、傳輸任何含有電腦病毒或任何對電腦軟、硬體產生中斷、破壞或限制功能之程式碼的資料。</motion.li>
                            </motion.ol>

                            <MotionTitle as="h3" id="tos_5" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第五條、智慧財產權</MotionTitle>
                            <motion.ol variants={containerVariants} className="list-decimal list-outside space-y-3 pl-5">
                                <motion.li variants={itemVariants}>本平台上所有內容，包括但不限於程式碼、介面設計、文字、圖片、檔案、資訊、資料、網站架構、網站畫面的安排、網頁設計，均由本組或其他權利人依法擁有其智慧財產權。</motion.li>
                                <motion.li variants={itemVariants}>若您為管理員，您因使用本平台上傳或提供之資料（如PDF檔案、純文字內容），您保證該資料絕無侵害他人智慧財產權之情事。您並同意授權本平台在本服務範圍內，為提供 AI 分析、摘要及儲存等功能，進行必要之重製、改作、編輯、公開傳輸等利用。此授權為非專屬、全球性、免權利金，並於您刪除該等內容時終止。</motion.li>
                            </motion.ol>

                            <MotionTitle as="h3" id="tos_6" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第六條、服務之中斷或變更</MotionTitle>
                            <motion.ol variants={containerVariants} className="list-decimal list-outside space-y-3 pl-5">
                                <motion.li variants={itemVariants}>本組保留隨時修改、暫時或永久停止提供本平台服務之權利，您同意本組對於任何服務之修改、暫停或終止，對您或任何第三方均不負任何責任。</motion.li>
                                <motion.li variants={itemVariants}>在下列情形，本組將暫停或中斷本平台全部或部分服務，且對使用者任何直接或間接之損害，均不負任何賠償責任：
                                    <ul className="list-disc list-outside space-y-2 mt-3 pl-5 text-slate-600">
                                        <li>對本平台相關軟硬體設備進行搬遷、更換、升級、保養或維修時。</li>
                                        <li>發生突發性之電子通信設備故障時。</li>
                                        <li>天災或其他不可抗力之因素致使本平台無法提供服務時。</li>
                                    </ul>
                                </motion.li>
                            </motion.ol>

                            <MotionTitle as="h3" id="tos_7" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第七條、責任限制與免責聲明</MotionTitle>
                            <motion.ol variants={containerVariants} className="list-decimal list-outside space-y-3 pl-5">
                                <motion.li variants={itemVariants}>本平台僅依「現況」及「現有」基礎提供服務，本組及開發者不提供任何明示或默示的擔保，包含但不限於權利完整、商業適售性、特定目的之適用性及未侵害他人權利。</motion.li>
                                <motion.li variants={itemVariants}>本平台不保證服務之穩定、安全、無誤、及不中斷。您應自行承擔使用本服務之所有風險及可能致生之任何損害。</motion.li>
                                <motion.li variants={itemVariants}>對於您透過本平台連結至其他網站而下載的軟體或資料，本組及開發者不負任何擔保責任。您應自行考量風險。</motion.li>
                            </motion.ol>

                            <hr className="my-8" />
                            {/* --- 隱私權政策 --- */}
                            <MotionTitle as="h2" id="privacy" activeId={activeId} className="text-2xl sm:text-3xl font-bold border-b border-slate-200 pb-3 mt-12 mb-6">第二部分：隱私權政策 (Privacy Policy)</MotionTitle>
                            <motion.p variants={itemVariants} className="mt-6">本組及開發者非常重視您的隱私權，並致力於保護您的個人資料。本隱私權政策旨在說明我們如何蒐集、處理、利用及保護您的個人資料，並遵循中華民國《個人資料保護法》之規定。</motion.p>

                            <MotionTitle as="h3" id="privacy_8" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第八條、個人資料之蒐集目的與類別</MotionTitle>
                            <motion.p variants={itemVariants}>為提供您完善的服務，我們將於下列目的範圍內，蒐集您的個人資料：</motion.p>
                            <motion.ol variants={containerVariants} className="list-decimal list-outside space-y-3 pl-5 mt-4">
                                <motion.li variants={itemVariants}><strong>使用者註冊與管理</strong>：當您註冊本平台帳號時，我們會蒐集您的：
                                    <ul className="list-disc list-outside space-y-2 mt-3 pl-5 text-slate-600">
                                        <li><strong>C001 辨識個人者</strong>：使用者名稱、電子郵件地址。</li>
                                        <li><strong>C002 辨識財務者</strong>：密碼（我們將以加密方式儲存）。</li>
                                    </ul>
                                </motion.li>
                                <motion.li variants={itemVariants}><strong>AI 問答機器人服務</strong>：我們會蒐集您的<strong>對話記錄</strong>，以提供問答服務並優化 AI 模型。</motion.li>
                            </motion.ol>

                            <MotionTitle as="h3" id="privacy_9" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第九條、個人資料處理與利用之期間、地區、對象及方式</MotionTitle>
                            <motion.ol variants={containerVariants} className="list-decimal list-outside space-y-3 pl-5">
                                <motion.li variants={itemVariants}><strong>期間</strong>：自您同意本條款之日起，至您終止使用本平台服務或本平台停止提供服務之日止。法令另有規定者，依其規定。</motion.li>
                                <motion.li variants={itemVariants}><strong>地區</strong>：您的個人資料將儲存於<strong>彰化師範大學學生會伺服器</strong>。</motion.li>
                                <motion.li variants={itemVariants}><strong>對象及方式</strong>：
                                    <ul className="list-disc list-outside space-y-2 mt-3 pl-5 text-slate-600">
                                        <li>您的個人資料將僅供本組及開發者，於蒐集目的範圍內處理及利用。</li>
                                        <li><strong>【與第三方服務提供者共享】</strong> 為提供AI分析與摘要服務（僅限管理員功能），管理員上傳或提供的<strong>非個人資料</strong>內容（如PDF、URL內容、純文字）將會被傳送至第三方 AI 服務提供商（包括但不限於透過 <strong>Google Gemini API</strong>）進行處理。我們僅傳輸必要的資料以完成分析任務，且該等資料的傳輸與處理將受該第三方服務提供商之隱私權政策與安全措施所規範。</li>
                                        <li>除依法律規定、主管機關要求或為履行法定義務外，我們絕不會將您的個人資料提供、交換、出租或出售給任何其他個人、團體、私人企業或公務機關。</li>
                                    </ul>
                                </motion.li>
                            </motion.ol>

                            <MotionTitle as="h3" id="privacy_10" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第十條、您對個人資料可行使之權利</MotionTitle>
                            <motion.p variants={itemVariants}>依據中華民國《個人資料保護法》第三條之規定，您就我們保有之您的個人資料，得行使下列權利：</motion.p>
                            <motion.ol variants={containerVariants} className="list-decimal list-outside space-y-3 pl-5 mt-4">
                                <motion.li variants={itemVariants}>查詢或請求閱覽。</motion.li>
                                <motion.li variants={itemVariants}>請求製給複製本。</motion.li>
                                <motion.li variants={itemVariants}>請求補充或更正。</motion.li>
                                <motion.li variants={itemVariants}>請求停止蒐集、處理或利用。</motion.li>
                                <motion.li variants={itemVariants}>請求刪除。</motion.li>
                            </motion.ol>
                            <motion.p variants={itemVariants} className="mt-4">如欲行使上述權利，您可透過 <a href="mailto:3526ming@gmail.com" className="text-indigo-600 hover:underline">3526ming@gmail.com</a> 與我們聯繫。我們將於收到您的請求後，依法儘速處理。</motion.p>

                            <MotionTitle as="h3" id="privacy_11" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第十一條、資料安全</MotionTitle>
                            <motion.p variants={itemVariants}>我們致力於以合理的技術與程序，保護所有個人資料之安全。您的密碼將以<strong>單向加密</strong>方式儲存，確保即使是內部人員也無法得知您的密碼原文。我們亦採取適當的存取控制，防止未經授權的資料存取。</motion.p>

                            <MotionTitle as="h3" id="privacy_12" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第十二條、Cookie之使用</MotionTitle>
                            <motion.p variants={itemVariants}>為提供您最佳的服務，本平台會在您的電腦中放置並取用我們的Cookie。Cookie是網站伺服器用來和使用者瀏覽器進行溝通的一種技術，它可能在您的電腦中儲存某些資訊，但使用者可以經由瀏覽器的設定，取消、或限制此項功能。若您關閉Cookie，可能會導致登入異常等部分網站功能無法正常執行。</motion.p>

                            <MotionTitle as="h3" id="privacy_13" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第十三條、隱私權政策之修正</MotionTitle>
                            <motion.p variants={itemVariants}>本隱私權政策將因應需求隨時進行修正，修正後的條款將刊登於網站上，不另行個別通知。建議您隨時留意本政策之最新版本。</motion.p>

                            <hr className="my-8" />
                            {/* --- 一般條款 --- */}
                            <MotionTitle as="h2" id="general" activeId={activeId} className="text-2xl sm:text-3xl font-bold border-b border-slate-200 pb-3 mt-12 mb-6">第三部分：一般條款</MotionTitle>

                            <MotionTitle as="h3" id="general_14" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第十四條、準據法與管轄法院</MotionTitle>
                            <motion.p variants={itemVariants}>本條款之解釋與適用，以及與本條款有關的爭議，均應依照中華民國法律予以處理，並以<strong>台灣彰化地方法院</strong>為第一審管轄法院。</motion.p>

                            <MotionTitle as="h3" id="general_15" activeId={activeId} className="text-xl sm:text-2xl font-semibold mt-8 mb-4">第十五條、聯絡我們</MotionTitle>
                            <motion.p variants={itemVariants}>若您對本條款有任何問題，歡迎隨時透過 <a href="mailto:3526ming@gmail.com" className="text-indigo-600 hover:underline">3526ming@gmail.com</a> 與我們聯繫。</motion.p>

                            <motion.div variants={itemVariants} className="border-t border-slate-200 mt-10 pt-4">
                                <p className="text-right italic text-slate-500 text-sm">Developed & Maintained by Tai Ming Chen & Grason Yang.</p>
                            </motion.div>
                        </motion.article>
                    </main>
                </div>
            </div>

            <footer className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20 max-w-4xl mx-auto lg:pl-80">
                        <p className="text-sm text-slate-500">最新修訂：2025年7月31日</p>
                        <button
                            onClick={closeWindow}
                            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                        >
                            我已了解，關閉頁面
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}