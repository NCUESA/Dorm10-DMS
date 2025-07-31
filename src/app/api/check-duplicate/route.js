import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { email, student_id } = await request.json();
    const result = { emailExists: false, studentIdExists: false };

    if (email) {
      const { data: existingEmail, error: emailError } = await supabaseServer
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (emailError) throw emailError;
      result.emailExists = !!existingEmail;
    }

    if (student_id) {
      const { data: existingProfile, error: idError } = await supabaseServer
        .from('profiles')
        .select('id')
        .eq('student_id', student_id)
        .maybeSingle();
      if (idError) throw idError;
      result.studentIdExists = !!existingProfile;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('檢查重複失敗:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
