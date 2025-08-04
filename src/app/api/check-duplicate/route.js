import { NextResponse } from 'next/server';
import { checkRateLimit, handleApiError } from '@/lib/apiMiddleware';
// import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    // 1. Rate limiting 檢查
    const rateLimitCheck = checkRateLimit(request, 'check-duplicate', 20, 60000); // 每分鐘20次
    if (!rateLimitCheck.success) {
      return rateLimitCheck.error;
    }

    // Temporarily disabled until SUPABASE_SERVICE_ROLE_KEY is configured
    return NextResponse.json({
      emailExists: false,
      studentIdExists: false
    });
  } catch (error) {
    return handleApiError(error, '/api/check-duplicate');
  }
}
