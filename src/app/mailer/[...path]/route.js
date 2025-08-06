import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { path: pathSegments } = resolvedParams || {};
    
    console.log(`[MAILER] Request params:`, resolvedParams);
    console.log(`[MAILER] Path segments:`, pathSegments);
    
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Template name required', { status: 400 });
    }
    
    // 取得完整的檔名（包含 .html）
    const templateName = pathSegments.join('/');
    
    console.log(`[MAILER] Requested template: ${templateName}`);
    
    // 確保檔名以 .html 結尾
    const fileName = templateName.endsWith('.html') ? templateName : `${templateName}.html`;
    const filePath = path.join(process.cwd(), 'public', 'mail-template', fileName);
    
    console.log(`[MAILER] Looking for file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`[MAILER] File not found: ${filePath}`);
      return new NextResponse(`Template not found: ${fileName}`, { status: 404 });
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}