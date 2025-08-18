'use client';

import { ArrowRight, FileText, BookOpen } from 'lucide-react';

const LinkCard = ({ href, icon: Icon, title, children }) => {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
        >
            <div
                className="relative h-full overflow-hidden rounded-xl border border-gray-200/80 bg-white p-6 shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1.5"
            >
                <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(165,180,252,0.4),_transparent_60%)] 
                    opacity-0 transition-all duration-700 ease-in-out 
                    group-hover:top-[-4rem] group-hover:left-[-4rem] group-hover:opacity-100 blur-2xl"
                ></div>
                <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(251,146,180,0.4),_transparent_60%)] 
                    opacity-0 transition-all duration-700 ease-in-out 
                    group-hover:bottom-[-4rem] group-hover:right-[-4rem] group-hover:opacity-100 blur-2xl"
                ></div>
                
                <div className="relative z-10 flex h-full flex-col">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 rounded-lg bg-indigo-100 p-3">
                            <Icon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    </div>

                    <p className="mt-4 flex-grow text-sm text-gray-500">
                        {children}
                    </p>

                    <div className="mt-6 flex items-center justify-end text-sm font-semibold text-indigo-600">
                        <span>前往連結</span>
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
                    </div>
                </div>
            </div>
        </a>
    );
};

export default function ImportantLinksPage() {
    return (
        <div className="min-h-[40vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-4xl">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <LinkCard
                        href="https://docs.google.com/spreadsheets/d/1XMRRNO1e_fSk-LU84K68EGiOAidaRDVp8yBlmL0G_D8/edit?resourcekey=&gid=204496218#gid=204496218"
                        icon={FileText}
                        title="校外獎助學金送件紀錄 資料表"
                    >
                        承辦人員、工讀生可透過此連結進入<strong>已連結回應表單之 Google Sheet</strong>。
                    </LinkCard>

                    <LinkCard
                        href="https://docs.google.com/document/d/1ZI_vUtdQ2ushBS0C9viS1yZWzSkFEgvZ79NEJCmvptU/edit?usp=sharing"
                        icon={BookOpen}
                        title="平台使用說明"
                    >
                        關於本平台的相關注意事項，內容包含<strong>開發人員</strong>、<strong>管理員</strong>、<strong>一般使用者</strong> 三種身分的使用說明。
                    </LinkCard>
                </div>
            </div>
        </div>
    );
}