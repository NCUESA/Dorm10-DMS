import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';
import { verifyUserAuth, checkRateLimit, handleApiError, logSuccessAction } from '@/lib/apiMiddleware';

export async function POST(request) {
    try {
        // 1. Rate limiting 檢查（文件上傳限制）
        const rateLimitCheck = checkRateLimit(request, 'upload-files', 10, 60000); // 每分鐘10次
        if (!rateLimitCheck.success) {
            return rateLimitCheck.error;
        }

        // 2. 用戶身份驗證（上傳文件需要登入）
        const authCheck = await verifyUserAuth(request, {
            requireAuth: true,
            requireAdmin: false,
            endpoint: '/api/upload-files'
        });
        
        if (!authCheck.success) {
            return authCheck.error;
        }

        const formData = await request.formData();
        const files = formData.getAll('files');
        const announcementId = formData.get('announcementId');
        
        // 3. 基本驗證
        if (!files || files.length === 0) {
            return NextResponse.json({ error: '沒有檔案被上傳' }, { status: 400 });
        }

        if (files.length > 10) {
            return NextResponse.json({ error: '一次最多只能上傳10個檔案' }, { status: 400 });
        }

        const uploadedFiles = [];
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        
        for (const file of files) {
            if (!file || !file.name) continue;
            
            // 4. 檔案安全檢查
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json({ 
                    error: `不支援的檔案格式: ${file.type}` 
                }, { status: 400 });
            }

            if (file.size > maxFileSize) {
                return NextResponse.json({ 
                    error: `檔案 ${file.name} 太大，最大允許 10MB` 
                }, { status: 400 });
            }

            // 5. 檔案名稱安全檢查
            const originalName = file.name || 'unnamed_file';
            const sanitizedName = originalName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '_');
            
            // 確保檔案名稱不為空且有適當的長度
            if (sanitizedName.length === 0) {
                return NextResponse.json({ 
                    error: `檔案名稱無效: ${originalName}` 
                }, { status: 400 });
            }
            
            // 檢查檔案名稱長度
            if (sanitizedName.length > 255) {
                return NextResponse.json({ 
                    error: `檔案名稱過長: ${sanitizedName}` 
                }, { status: 400 });
            }
            
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            // 生成唯一檔案名稱
            const timestamp = Date.now();
            const hash = createHash('md5').update(buffer).digest('hex').substring(0, 8);
            const extension = sanitizedName.split('.').pop() || 'bin';
            const uniqueFileName = `${timestamp}_${hash}.${extension}`;
            
            // 創建儲存路徑 - 確保路徑安全
            const safeAnnouncementId = (announcementId || 'temp').toString().replace(/[^a-zA-Z0-9_-]/g, '_');
            const relativePath = `attachments/${safeAnnouncementId}/${uniqueFileName}`;
            const absolutePath = join(process.cwd(), 'public', 'storage', relativePath);
            
            // 確保目錄存在
            const { mkdirSync } = require('fs');
            const dirPath = join(process.cwd(), 'public', 'storage', 'attachments', safeAnnouncementId);
            mkdirSync(dirPath, { recursive: true });
            
            // 寫入檔案
            await writeFile(absolutePath, buffer);
            
            uploadedFiles.push({
                originalName: originalName,
                fileName: uniqueFileName,
                relativePath: `/storage/${relativePath}`,
                size: file.size,
                mimeType: file.type
            });
        }

        // 6. 記錄成功的文件上傳
        logSuccessAction('FILES_UPLOADED', '/api/upload-files', {
            userId: authCheck.user.id,
            fileCount: uploadedFiles.length,
            totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0),
            announcementId: announcementId || 'temp'
        });

        return NextResponse.json({
            success: true,
            files: uploadedFiles
        });
        
    } catch (error) {
        return handleApiError(error, '/api/upload-files');
    }
}
