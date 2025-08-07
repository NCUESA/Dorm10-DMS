import React from 'react';

// --- Main Preview Component ---
const LinePreview = ({ announcement }) => {
    if (!announcement) {
        return (
            <div className="flex justify-center items-center h-full w-full p-4 font-sans">
                <div className="text-gray-500">无法加载公告内容</div>
            </div>
        );
    }

    // --- Data Preparation ---
    const startDate = announcement.application_start_date ? new Date(announcement.application_start_date).toLocaleDateString('en-CA') : null;
    const endDate = announcement.application_end_date ? new Date(announcement.application_end_date).toLocaleDateString('en-CA') : '無期限';
    const dateString = startDate ? `${startDate} ~ ${endDate}` : endDate;
    const categoryText = `分類 ${announcement.category || '未分類'}`;

    const cleanedTargetAudience = announcement.target_audience ? announcement.target_audience.replace(/\\n/g, '') : '所有學生';

    return (
        <div className="flex justify-center items-center h-full w-full p-4 font-sans">
            {/* The main bubble container */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl w-full max-w-sm overflow-hidden shadow-lg border border-gray-200/30">

                {/* Header */}
                <div className="p-5" style={{ backgroundColor: '#A78BFA' }}>
                    <p className="text-sm" style={{ color: '#EDE9FE' }}>{categoryText}</p>
                    <h2 className="text-lg font-bold text-white mt-2">{announcement.title || '無標題'}</h2>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Summary Section */}
                    <div>
                        <h3 className="text-sm font-bold mb-2" style={{ color: '#6D28D9' }}>公告摘要</h3>
                        <div
                            className="text-sm text-gray-700 leading-relaxed rich-text-preview"
                            dangerouslySetInnerHTML={{ __html: announcement.summary || '<p>无摘要内容</p>' }}
                        />
                    </div>

                    <div className="border-t border-gray-200/80 my-4"></div>

                    {/* Details Section */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                            <p className="text-sm font-bold text-gray-400 flex-shrink-0">申請期間</p>
                            <p className="text-sm text-gray-800 text-right ml-4">{dateString}</p>
                        </div>
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-gray-400 flex-shrink-0">適用對象</p>
                            <div
                                className="text-sm text-gray-800 text-left ml-4 rich-text-preview"
                                dangerouslySetInnerHTML={{ __html: cleanedTargetAudience }}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5" style={{ backgroundColor: '#f8fafc' }}>
                    <div className="w-full rounded-lg text-center py-3 px-3 font-bold text-white cursor-pointer" style={{ backgroundColor: '#8B5CF6' }}>
                        查看更多資訊
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .rich-text-preview ul, .rich-text-preview ol {
                    list-style: revert; /* Use browser's default list style */
                    padding-left: 20px; /* Indent the list */
                    margin: 0.5em 0;
                }
                .rich-text-preview li {
                    margin-bottom: 0.5em;
                    padding-left: 0.5em; /* Space between bullet and text */
                }
                .rich-text-preview p {
                    margin: 0;
                    padding: 0;
                }
                .rich-text-preview h4 {
                    font-size: 1.1em;
                    font-weight: bold;
                    margin: 1em 0 0.5em;
                }
                /* **MODIFIED**: Remove borders from tables to simulate Flex Message layout */
                .rich-text-preview table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1em 0;
                    border: none; 
                }
                .rich-text-preview td, .rich-text-preview th {
                    border: none; /* Remove cell borders */
                    padding: 4px 0; /* Adjust padding for a cleaner look */
                    text-align: left;
                }
            `}</style>
        </div>
    );
};

export default LinePreview;