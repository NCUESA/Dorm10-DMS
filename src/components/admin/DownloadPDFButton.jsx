'use client';

import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import AnnouncementPDF from './AnnouncementPDF';
import { createRoot } from 'react-dom/client';

const DownloadPDFButton = ({ announcement, className }) => {
    
    const openPdfInNewTab = () => {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write('<!DOCTYPE html><html><head><title>正在生成 PDF...</title><style>body { margin: 0; padding: 0; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background-color: #f0f0f0; } .loader { border: 8px solid #f3f3f3; border-top: 8px solid #3498db; border-radius: 50%; width: 60px; height: 60px; animation: spin 2s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style></head><body><div class="loader"></div></body></html>');
            newWindow.document.title = `公告-${announcement.title}`;

            const container = newWindow.document.body;
            container.innerHTML = '';
            container.style.width = '100vw';
            container.style.height = '100vh';
            
            const root = createRoot(container);
            root.render(
                <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
                    <AnnouncementPDF announcement={announcement} />
                </PDFViewer>
            );
        }
    };

    return (
        <button
            onClick={openPdfInNewTab}
            className={`${className} whitespace-nowrap`}
        >
            下載公告
        </button>
    );
};

export default DownloadPDFButton;