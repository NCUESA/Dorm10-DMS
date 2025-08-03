import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';
import { existsSync } from 'fs';
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
        const file = formData.get('file'); // 單一檔案上傳
        
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
                error: '不支援的檔案格式。請上傳 PDF、DOCX、DOC 或圖片檔案。' 
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
        
        if (!existsSync(uploadDir)) {
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

// 刪除檔案的 DELETE 方法
export async function DELETE(request) {
    try {
        // 用戶身份驗證
        const authCheck = await verifyUserAuth(request, {
            requireAuth: true,
            requireAdmin: false,
            endpoint: '/api/upload-files'
        });
        
        if (!authCheck.success) {
            return authCheck.error;
        }

        const { filePath } = await request.json();
        
        if (!filePath) {
            return NextResponse.json({ error: '未指定檔案路徑' }, { status: 400 });
        }

        // 安全檢查：確保路徑在 storage/attachments 目錄內
        if (!filePath.startsWith('/storage/attachments/')) {
            return NextResponse.json({ error: '無效的檔案路徑' }, { status: 400 });
        }

        const fullPath = join(process.cwd(), 'public', filePath);
        
        try {
            if (existsSync(fullPath)) {
                await unlink(fullPath);
            }
        } catch (deleteError) {
            console.error('檔案刪除錯誤:', deleteError);
            // 即使檔案刪除失敗，也繼續處理（可能檔案已經不存在）
        }

        // 記錄成功操作
        logSuccessAction('FILE_DELETE', '/api/upload-files', {
            userId: authCheck.user.id,
            deletedPath: filePath
        });

        return NextResponse.json({
            success: true,
            message: '檔案刪除成功'
        });

    } catch (error) {
        return handleApiError(error, '/api/upload-files');
    }
}
