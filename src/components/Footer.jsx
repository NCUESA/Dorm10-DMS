"use client";

import { Send, MessageSquare } from 'lucide-react';

// --- 自訂 Icon 元件 ---
const InstagramIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
    </svg>
);
const FacebookIcon = (props) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" {...props}>
        <title>Facebook</title>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

// --- 輔助元件 ---
const FooterTitle = ({ children }) => (
    <div className="inline-block mb-6">
        <h3 className="text-lg font-bold text-white">
            {children}
        </h3>
        <div className="w-1/2 h-0.5 bg-amber-400 mt-2 mx-auto"></div>
    </div>
);
const FooterLink = ({ href, icon: Icon, text, isExternal = true }) => (
    <a href={href} className="group inline-flex items-center justify-center gap-3 text-gray-300 hover:text-white transition-all duration-300 hover:-translate-y-0.5" target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="footer-link-underline">{text}</span>
    </a>
);

export default function Footer() {
    return (
        <>
            <style jsx global>{`
                .g-char-1 { color: #4285F4; } .g-char-2 { color: #DB4437; } .g-char-3 { color: #F4B400; }
                .g-char-4 { color: #4285F4; } .g-char-5 { color: #0F9D58; } .g-char-6 { color: #DB4437; }
                .footer-link-underline { position: relative; display: inline-block; }
                .footer-link-underline::after {
                    content: ''; position: absolute; width: 0; height: 1px; display: block;
                    margin-top: 2px; right: 0; background: #f59e0b;
                    transition: width .3s ease; -webkit-transition: width .3s ease;
                }
                .group:hover .footer-link-underline::after { width: 100%; left: 0; }
            `}</style>

            <footer className={`bg-[#1E2129] text-white py-16`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row gap-y-12 gap-x-8 text-center">

                        {/* --- 關於平台 --- */}
                        <div className="flex-1">
                            <FooterTitle>About the Platform</FooterTitle>
                            <p className="text-gray-300 leading-relaxed">
                                An intelligent information platform cored by a Large Language Model, dynamically analyzing sources to achieve automated parsing, data extraction, and summarization.
                            </p>
                            <p className="text-gray-400 text-sm mt-4">
                                LLM powered by <span className="font-medium text-white">Gemini 2.5 Flash</span>
                            </p>
                        </div>

                        {/* --- 社群連結 --- */}
                        <div className="flex-1">
                            <FooterTitle>Social Links</FooterTitle>
                            <div className="flex flex-col items-center space-y-4">
                                <FooterLink href="https://www.instagram.com/ncue_dorm10/" icon={InstagramIcon} text="十舍 IG 官方帳號" />
                                <FooterLink href="https://www.facebook.com/groups/113ncuedorm10/" icon={FacebookIcon} text="十舍 FB 社團" />
                                <FooterLink href="mailto:dorm10@gm.ncue.edu.tw" icon={Send} text="以 Mail 聯絡我們" isExternal={false} />
                            </div>
                        </div>

                        {/* --- 平台開發 --- */}
                        <div className="flex-1">
                            <FooterTitle>Platform Development</FooterTitle>
                            <div className="flex flex-col items-center space-y-4 w-full">
                                <p className="text-gray-300">
                                    Developed & Maintained by
                                </p>
                                <a href="https://gdg.community.dev/gdg-on-campus-national-changhua-university-of-education-changhua-city-taiwan/" className="group inline-flex items-center justify-center gap-3 text-gray-300 hover:text-white transition-all duration-300 hover:-translate-y-0.5" target="_blank" rel="noopener noreferrer">
                                    <img src="/GDG.gif" alt="GDG On Campus NCUE Logo" className="h-8 w-auto flex-shrink-0" />
                                    <span className="font-semibold text-white text-left">
                                        <span className="google-word-container">
                                            <span className="g-char g-char-1">G</span>
                                            <span className="g-char g-char-2">o</span>
                                            <span className="g-char g-char-3">o</span>
                                            <span className="g-char g-char-4">g</span>
                                            <span className="g-char g-char-5">l</span>
                                            <span className="g-char g-char-6">e</span>
                                        </span> Developer Group<br />On Campus NCUE
                                    </span>
                                </a>
                                <FooterLink href="https://forms.gle/GmPVHsdV7mLeGyhx7" icon={MessageSquare} text="平台問題回報" />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 mt-16 pt-8 text-center text-sm">
                        <p className="text-gray-400">
                            © {new Date().getFullYear()} 彰師十宿資訊平台. All Rights Reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
}