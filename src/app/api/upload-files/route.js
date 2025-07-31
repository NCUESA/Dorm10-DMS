import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files');
        const announcementId = formData.get('announcementId');
        
        if (!files || files.length === 0) {
            return NextResponse.json({ error: '沒有檔案被上傳' }, { status: 400 });
        }

        const uploadedFiles = [];
        
        for (const file of files) {
            if (!file || !file.name) continue;
            
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            // 生成唯一檔案名稱
            const timestamp = Date.now();
            const hash = createHash('md5').update(buffer).digest('hex').substring(0, 8);
            const extension = file.name.split('.').pop();
            const uniqueFileName = `${timestamp}_${hash}.${extension}`;
            
            // 創建儲存路徑
            const relativePath = `attachments/${announcementId || 'temp'}/${uniqueFileName}`;
            const absolutePath = join(process.cwd(), 'public', 'storage', relativePath);
            
            // 確保目錄存在
            const { mkdirSync } = require('fs');
            const dirPath = join(process.cwd(), 'public', 'storage', 'attachments', announcementId || 'temp');
            mkdirSync(dirPath, { recursive: true });
            
            // 寫入檔案
            await writeFile(absolutePath, buffer);
            
            uploadedFiles.push({
                originalName: file.name,
                fileName: uniqueFileName,
                relativePath: `/storage/${relativePath}`,
                size: file.size,
                mimeType: file.type
            });
        }

        return NextResponse.json({
            success: true,
            files: uploadedFiles
        });
        
    } catch (error) {
        console.error('檔案上傳錯誤:', error);
        return NextResponse.json({ error: '檔案上傳失敗' }, { status: 500 });
    }
}
