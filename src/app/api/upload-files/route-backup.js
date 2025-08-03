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
        const file = formData.get('file'); // 改為單一檔案
        
        // 3. 基本驗證
        if (!file) {
            return NextResponse.json({ error: '沒有檔案被上傳' }, { status: 400 });
        }

        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
        ];
        const maxFileSize = 10 * 1024 * 1024; // 10MB

        // 檔案驗證
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ 
                error: '不支援的檔案格式' 
            }, { status: 400 });
        }

        if (file.size > maxFileSize) {
            return NextResponse.json({ 
                error: '檔案大小超過10MB限制' 
            }, { status: 400 });
        }

        if (file.size === 0) {
            return NextResponse.json({ 
                error: '檔案為空' 
            }, { status: 400 });
        }

        // 生成安全的檔案名稱
        const originalName = file.name;
        const fileExtension = originalName.split('.').pop();
        const hash = createHash('md5').update(Buffer.from(await file.arrayBuffer())).digest('hex');
        const timestamp = Date.now();
        const safeFileName = `${timestamp}-${hash}.${fileExtension}`;

        // 確保目錄結構存在
        const uploadDir = join(process.cwd(), 'public', 'storage', 'attachments');
        
        try {
            await writeFile(join(uploadDir, '.gitkeep'), '');
        } catch (dirError) {
            // 目錄可能不存在，嘗試創建
            const { mkdir } = await import('fs/promises');
            await mkdir(uploadDir, { recursive: true });
        }

        // 保存檔案
        const filePath = join(uploadDir, safeFileName);
        const publicPath = `/storage/attachments/${safeFileName}`;
        
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        await writeFile(filePath, buffer);

        // 記錄成功操作
        logSuccessAction('FILE_UPLOAD', '/api/upload-files', {
            userId: authCheck.user.id,
            fileName: originalName,
            fileSize: file.size,
            storedPath: publicPath
        });

        return NextResponse.json({
            success: true,
            data: {
                originalName,
                path: publicPath,
                size: file.size,
                mimeType: file.type,
                uploadedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        return handleApiError(error, '/api/upload-files');
    }
}
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
