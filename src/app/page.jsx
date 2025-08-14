"use client";
import Image from "next/image";
import React, { useState, useEffect, useRef } from 'react';
import AnnouncementList from "@/components/AnnouncementList";
import { School, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const media = window.matchMedia(query);
            if (media.matches !== matches) {
                setMatches(media.matches);
            }
            const listener = () => setMatches(media.matches);
            window.addEventListener('resize', listener);
            return () => window.removeEventListener('resize', listener);
        }
    }, [matches, query]);
    return matches;
};

const LineIcon = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 50 50" 
        className={className}
        fill="currentColor" 
    >
        <path d="M12.5,42h23c3.59,0,6.5-2.91,6.5-6.5v-23C42,8.91,39.09,6,35.5,6h-23C8.91,6,6,8.91,6,12.5v23C6,39.09,8.91,42,12.5,42z" style={{ fill: '#00c300' }}></path>
        <path d="M37.113,22.417c0-5.865-5.88-10.637-13.107-10.637s-13.108,4.772-13.108,10.637c0,5.258,4.663,9.662,10.962,10.495c0.427,0.092,1.008,0.282,1.155,0.646c0.132,0.331,0.086,0.85,0.042,1.185c0,0-0.153,0.925-0.187,1.122c-0.057,0.331-0.263,1.296,1.135,0.707c1.399-0.589,7.548-4.445,10.298-7.611h-0.001C36.203,26.879,37.113,24.764,37.113,22.417z M18.875,25.907h-2.604c-0.379,0-0.687-0.308-0.687-0.688V20.01c0-0.379,0.308-0.687,0.687-0.687c0.379,0,0.687,0.308,0.687,0.687v4.521h1.917c0.379,0,0.687,0.308,0.687,0.687C19.562,25.598,19.254,25.907,18.875,25.907z M21.568,25.219c0,0.379-0.308,0.688-0.687,0.688s-0.687-0.308-0.687-0.688V20.01c0-0.379,0.308-0.687,0.687-0.687s0.687,0.308,0.687,0.687V25.219z M27.838,25.219c0,0.297-0.188,0.559-0.47,0.652c-0.071,0.024-0.145,0.036-0.218,0.036c-0.215,0-0.42-0.103-0.549-0.275l-2.669-3.635v3.222c0,0.379-0.308,0.688-0.688,0.688c-0.379,0-0.688-0.308-0.688-0.688V20.01c0-0.296,0.189-0.558,0.47-0.652c0.071-0.024,0.144-0.035,0.218-0.035c0.214,0,0.42,0.103,0.549,0.275l2.67,3.635V20.01c0-0.379,0.309-0.687,0.688-0.687c0.379,0,0.687,0.308,0.687,0.687V25.219z M32.052,21.927c0.379,0,0.688,0.308,0.688,0.688c0,0.379-0.308,0.687-0.688,0.687h-1.917v1.23h1.917c0.379,0,0.688,0.308,0.688,0.687c0,0.379-0.309,0.688-0.688,0.688h-2.604c-0.378,0-0.687-0.308-0.687-0.688v-2.603c0-0.001,0-0.001,0-0.001c0,0,0-0.001,0-0.001v-2.601c0-0.001,0-0.001,0-0.002c0-0.379,0.308-0.687,0.687-0.687h2.604c0.379,0,0.688,0.308,0.688,0.687s-0.308,0.687-0.688,0.687h-1.917v1.23H32.052z" style={{ fill: '#fff' }}></path>
    </svg>
);

const ResourceCard = React.forwardRef(({ index, icon, title, description, href, linkText, isActive, isMobile }, ref) => {
    const cardVariants = {
        initial: { y: 0, scale: 1 },
        hover: { 
            y: -12,
            scale: 1.03,
            transition: { type: "tween", duration: 0.25, ease: "easeOut" }
        }
    };

    const isDynamicallyActive = isMobile && isActive;

    return (
        <motion.a 
            ref={ref}
            data-index={index}
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            // 動態設置背景和邊框顏色
            className={`
                group block p-6 backdrop-blur-md rounded-2xl shadow-lg flex flex-col h-full 
                transition-all duration-300 ease-in-out
                ${isDynamicallyActive 
                    ? 'bg-indigo-50/80 border-indigo-300/60' 
                    : 'bg-slate-100/70 border-slate-200/80'}
                hover:bg-indigo-50/80 hover:border-indigo-300/60
            `}
            variants={cardVariants}
            initial="initial"
            whileHover={!isMobile ? "hover" : undefined}
            animate={isDynamicallyActive ? "hover" : "initial"}
        >
            <div className="flex-grow">
                <div className="flex items-center gap-4 mb-4">
                    <div 
                        // 動態設置圖標背景
                        className={`
                            flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full shadow-inner 
                            transition-colors duration-300
                            ${isDynamicallyActive ? 'bg-indigo-100/80' : 'bg-white/80'}
                            group-hover:bg-indigo-100/80
                        `}
                    >
                        {icon}
                    </div>
                    <h3 
                        // 動態設置標題顏色
                        className={`
                            text-xl font-bold transition-colors duration-300
                            ${isDynamicallyActive ? 'text-indigo-900' : 'text-slate-800'}
                            group-hover:text-indigo-900
                        `}
                    >
                        {title}
                    </h3>
                </div>
                <p 
                    // 動態設置描述文字顏色
                    className={`
                        text-base leading-relaxed transition-colors duration-300
                        ${isDynamicallyActive ? 'text-indigo-800' : 'text-slate-700'}
                        group-hover:text-indigo-800
                    `}
                >
                    {description}
                </p>
            </div>
            <div className="text-right mt-6">
                <span 
                    // 動態設置連結文字顏色
                    className={`
                        text-sm font-bold transition-colors
                        ${isDynamicallyActive ? 'text-indigo-700' : 'text-indigo-600'}
                        group-hover:text-indigo-700
                    `}
                >
                    {linkText} 
                    <span 
                        // 動態設置箭頭位移
                        className={`
                            inline-block transition-transform duration-300 ease-in-out
                            ${isDynamicallyActive ? 'translate-x-1.5' : ''}
                            group-hover:translate-x-1.5
                        `}
                    >
                        &rarr;
                    </span>
                </span>
            </div>
        </motion.a>
    );
});
ResourceCard.displayName = "ResourceCard";


export default function Home() {
    const isMobileOrTablet = useMediaQuery('(max-width: 1023px)');
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const cardRefs = useRef([]);
    const observerRef = useRef(null);

    const cardData = [
        { icon: <School className="h-6 w-6 text-indigo-600" />, title: "彰師大獎助學金專區", description: "提供全校各單位之校內外獎助學金、揚鷹獎勵金之公告訊息，並有校園餐券及校內外急難扶助金等申請資訊！", href: "https://www.ncue.edu.tw/p/412-1000-1513.php?Lang=zh-tw", linkText: "前往瞭解" },
        { icon: <LineIcon className="h-6 w-6" />, title: "加入 LINE 官方社群", description: "歡迎加入生輔組 LINE「彰師多元關懷社群」，及時掌握獎助學金、獎勵金及學雜費減免等訊息！", href: "https://reurl.cc/L7jGQe", linkText: "立即加入" },
        { icon: <Globe className="h-6 w-6 text-indigo-600" />, title: "教育部圓夢助學網", description: "教育部提供的全國性獎學金資源查詢平台。", href: "https://www.edu.tw/helpdreams/Default.aspx", linkText: "探索更多" }
    ];

    useEffect(() => {
        if (isMobileOrTablet) {
            setActiveCardIndex(0);
        } else {
            setActiveCardIndex(-1);
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
            return;
        }

        const handleScroll = () => {
            // 如果滾動到最頂部，強制高亮第一個
            if (window.scrollY < 50) {
                setActiveCardIndex(0);
                return;
            }
            
            // 找出在觸發區內最頂部的卡片
            const intersectingEntries = [];
            cardRefs.current.forEach(ref => {
                if (ref) {
                    const rect = ref.getBoundingClientRect();
                    const triggerTop = window.innerHeight * 0.35;
                    const triggerBottom = window.innerHeight * 0.65;
                    // 檢查卡片是否與觸發區有交集
                    if (rect.top < triggerBottom && rect.bottom > triggerTop) {
                        intersectingEntries.push(ref);
                    }
                }
            });

            if (intersectingEntries.length > 0) {
                intersectingEntries.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
                const topEntry = intersectingEntries[0];
                const index = parseInt(topEntry.dataset.index, 10);
                setActiveCardIndex(index);
            }
        };

        // 立即執行一次以設定初始狀態
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isMobileOrTablet]);


    return (
        <div className="w-full bg-slate-50 font-sans min-h-screen">
            
            <div className="relative w-full">
                <Image
                    src="/banner.jpg"
                    alt="NCUE Banner"
                    width={4000}
                    height={862}
                    priority
                    className="w-full h-auto"
                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/4000x862/e2e8f0/475569?text=Banner+Image'; }}
                />
                <div className={`absolute inset-0 bg-gradient-to-t from-slate-50 to-transparent ${isMobileOrTablet ? 'hidden' : 'block'}`} />
            </div>

            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md lg:max-w-6xl mx-auto
                                mt-8 lg:-mt-8">
                    <motion.div 
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                        initial="hidden"
                        animate="visible"
                        transition={{ staggerChildren: 0.1 }}
                    >
                        {cardData.map((card, index) => (
                            <ResourceCard 
                                ref={el => cardRefs.current[index] = el}
                                key={index}
                                index={index}
                                icon={card.icon}
                                title={card.title}
                                description={card.description}
                                href={card.href}
                                linkText={card.linkText}
                                isActive={activeCardIndex === index}
                                isMobile={isMobileOrTablet}
                            />
                        ))}
                    </motion.div>
                </div>

                <div className="w-full mt-16 mb-16">
                    <motion.h2 
                        className="text-3xl font-bold mb-8 text-center text-slate-800"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5 }}
                    >
                        最新獎學金公告
                    </motion.h2>
                    <AnnouncementList />
                </div>
            </main>
        </div>
    );
}
