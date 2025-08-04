'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, Cpu, Send, AlertTriangle, HelpCircle, ChevronDown } from 'lucide-react';
import Link from 'next/link';

const UsageStepCard = ({ icon: Icon, title, children, isActive }) => {
	return (
		<div className="relative flex-1 p-6 bg-white rounded-xl border border-gray-200/80 shadow-lg transition-all duration-300 group hover:shadow-xl hover:-translate-y-1">
			<div className={`absolute inset-0 bg-indigo-50 rounded-xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${isActive ? 'md:opacity-0 opacity-100' : 'opacity-0'}`}></div>
			<div className="relative z-10">
				<div className={`mx-auto w-fit p-3 rounded-full shadow-md border-4 border-white transition-colors duration-300 
                    bg-indigo-100 text-indigo-600 
                    group-hover:bg-indigo-600 group-hover:text-white
                    ${isActive ? 'md:bg-indigo-100 md:text-indigo-600 bg-indigo-600 text-white' : ''}`}>
					<Icon className="h-6 w-6" />
				</div>
				<div className="mt-4 text-center">
					<h3 className="text-lg font-bold text-gray-900">{title}</h3>
					<p className="mt-2 text-sm text-gray-500">{children}</p>
				</div>
			</div>
		</div>
	);
};

const AdviceCard = ({ title, children, icon: Icon, color }) => (
	<div className={`rounded-xl bg-white shadow-lg border border-gray-200/80 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
		<div className="flex items-center gap-3">
			<div className={`p-2 rounded-lg bg-${color}-100`}><Icon className={`h-6 w-6 text-${color}-600`} /></div>
			<h3 className="text-xl font-bold text-gray-900">{title}</h3>
		</div>
		<div className="mt-4 border-t border-gray-200 pt-4">
			<ul className="space-y-4 text-sm text-gray-600 list-none pl-1">
				{children}
			</ul>
		</div>
	</div>
);

const FaqItem = ({ question, children, isOpen, onToggle }) => (
	<div className="border-b border-gray-200/80 last:border-b-0">
		<button className="w-full flex justify-between items-center py-4 text-left" onClick={onToggle}>
			<span className="font-semibold text-gray-800">{question}</span>
			<ChevronDown className={`h-5 w-5 text-gray-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
		</button>
		<AnimatePresence>
			{isOpen && (
				<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
					<div className="pb-4 text-sm text-gray-600 prose-sm max-w-none">{children}</div>
				</motion.div>
			)}
		</AnimatePresence>
	</div>
);

// --- Main Component ---
export default function UsageTab() {
	const [openFaq, setOpenFaq] = useState(null);
	const [activeCardIndex, setActiveCardIndex] = useState(0); // State to track the active card
	const stepRefs = useRef([]); // Refs for each step card

	useEffect(() => {
		const handleScroll = () => {
			const viewportCenter = window.innerHeight / 2;
			let closestCardIndex = -1;
			let minDistance = Infinity;

			stepRefs.current.forEach((card, index) => {
				if (card) {
					const rect = card.getBoundingClientRect();
					const cardCenter = rect.top + rect.height / 2;
					const distance = Math.abs(viewportCenter - cardCenter);

					if (distance < minDistance) {
						minDistance = distance;
						closestCardIndex = index;
					}
				}
			});

			if (closestCardIndex !== -1) {
				setActiveCardIndex(closestCardIndex);
			}
		};

		let throttleTimeout;
		const throttledScrollHandler = () => {
			if (!throttleTimeout) {
				throttleTimeout = setTimeout(() => {
					handleScroll();
					throttleTimeout = null;
				}, 100); // Check every 100ms
			}
		};

		window.addEventListener('scroll', throttledScrollHandler);
		handleScroll();

		return () => window.removeEventListener('scroll', throttledScrollHandler);
	}, []);

	const handleFaqToggle = (index) => {
		setOpenFaq(openFaq === index ? null : index);
	};

	const steps = [
		{ icon: FileUp, title: "1. 提供 AI 參考資料", content: "點擊「新增公告」，提供PDF、網址或文字內容。資料越完整，AI 摘要效果越好。" },
		{ icon: Cpu, title: "2. AI 自動分析", content: "AI 將自動讀取所有來源、生成摘要並填寫欄位，為您節省寶貴時間。" },
		{ icon: Send, title: "3. 審閱與發布", content: "在 AI 生成的基礎上進行最終審閱、修改，即可儲存並發布公告。" }
	];

	return (
		<div className="space-y-12 max-w-5xl mx-auto">
			<div className="relative flex flex-col md:flex-row items-stretch justify-center gap-12">
				<div className="hidden md:block absolute top-1/2 left-0 w-full h-px -translate-y-1/2">
					<svg width="100%" height="2"><line x1="0" y1="1" x2="100%" y2="1" strokeWidth="2" strokeDasharray="8 8" className="stroke-gray-300" /></svg>
				</div>
				{steps.map((step, index) => (
					<div key={index} ref={el => stepRefs.current[index] = el} className="w-full">
						<UsageStepCard icon={step.icon} title={step.title} isActive={index === activeCardIndex}>
							{step.content}
						</UsageStepCard>
					</div>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
				<AdviceCard title="使用提醒" icon={AlertTriangle} color="yellow">
					<li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400"></span><div><span className="font-semibold text-gray-800 block">參考資料完整性</span>請盡可能上傳獎學金 PDF，越多的參考資料，AI 摘要的效果會越好。</div></li>
					<li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400"></span><div><span className="font-semibold text-gray-800 block">避免掃描檔</span>掃描的圖片檔 PDF 雖然可以讀取，但修改公告時將無法被 AI 作為參考資料，請盡可能避免。</div></li>
					<li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400"></span><div><span className="font-semibold text-gray-800 block">公告發布原則</span>修改公告時，建議創建新公告，而非直接修改舊公告，以確保 AI 資料來源的正確性。</div></li>
					<li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400"></span><div><span className="font-semibold text-gray-800 block">錯誤回報</span>若發現 AI 摘要有邏輯錯誤，請務必回報，以利開發者快速修正。</div></li>
				</AdviceCard>

				<div className="rounded-xl bg-white shadow-lg border border-gray-200/80 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
					<div className="flex items-center gap-3 mb-4"><div className="p-2 rounded-lg bg-sky-100"><HelpCircle className="h-6 w-6 text-sky-600" /></div><h3 className="text-xl font-bold text-gray-900">常見問題</h3></div>
					<div className="border-t border-gray-200">
						<FaqItem question="什麼是快速發布？" isOpen={openFaq === 0} onToggle={() => handleFaqToggle(0)}><p>如果您想完全手動輸入，可以略過步驟一、二。直接在步驟三的表單中填寫「公告標題」和「公告摘要」，即可按下儲存，進行快速發布。</p></FaqItem>
						<FaqItem question="為什麼我的 PDF 上傳後分析不完整？" isOpen={openFaq === 1} onToggle={() => handleFaqToggle(1)}><p>這很可能是因為您上傳的是掃描檔或圖片檔製成的 PDF。請盡量使用由文字檔直接轉出的 PDF，以獲得最佳的分析效果。</p></FaqItem>
						<FaqItem question="AI 摘要會出錯嗎？" isOpen={openFaq === 2} onToggle={() => handleFaqToggle(2)}><p>是的，儘管 AI 摘要已經優化，但在處理複雜或格式不佳的資料時，仍可能出現邏輯錯誤。因此，在發布前務必進行人工審閱，以確保所有資訊的準確性。詳見<Link href="/terms-and-privacy" className="text-indigo-600 font-semibold hover:underline">服務條款</Link>。</p></FaqItem>
					</div>
				</div>
			</div>
		</div>
	);
}