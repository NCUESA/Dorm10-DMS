import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Import dotenv to load environment variables

// 為了 seed 腳本的兼容性，支援兩種 URL 格式
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Missing Supabase environment variables.');
    console.error('Please make sure SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.');
    console.error('Current config:', { supabaseUrl, hasAnonKey: !!supabaseAnonKey });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedDatabase() {
    try {
        console.log('Seeding database...');

        // --- Seed Profiles ---
        console.log('Seeding profiles...');
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .insert([
                {
                    student_id: 'A1234567',
                    username: 'Test User 1',
                    email: 'test1@example.com',
                    role: 'user',
                },
                {
                    student_id: 'B8765432',
                    username: 'Test User 2 (Admin)',
                    email: 'test2@example.com',
                    role: 'admin',
                },
            ])
            .select(); // Use .select() to get the inserted data with generated IDs

        if (profilesError) {
            console.error('Error seeding profiles:', profilesError);
            return;
        }
        console.log('Profiles seeded successfully:', profiles);

        // --- Seed Announcements ---
        console.log('Seeding announcements...');
        // Assuming the first seeded user is the creator for these announcements
        const creator1Id = profiles[0]?.id;
        const creator2Id = profiles[1]?.id;


        if (!creator1Id || !creator2Id) {
            console.error('Could not retrieve creator IDs for seeding announcements.');
            return;
        }


        const { data: announcements, error: announcementsError } = await supabase
            .from('announcements')
            .insert([
                {
                    created_by: creator1Id,
                    title: '慈光山佛光基金會『慈光山人文獎』獎助學金',
                    summary: '就讀國內公私立大專院校及研究所肄業學生 (不含大一新生、在職專班、進修部、空中大學、社區大學學生)，上學年學業成績平均80分以上，操行80分以上或無違規記過紀錄，並依規定提出文章一篇。清寒學生學業成績得降低5分，需檢具低收入戶證明。',
                    full_content: '詳細申請辦法及應備文件請參閱附件或官方網站。',
                    category: 'C',
                    application_deadline: '2025-09-30',
                    announcement_end_date: '2025-10-15',
                    target_audience: '大專院校及研究所學生',
                    application_limitations: 'N',
                    submission_method: '郵寄申請',
                    is_active: true,
                    external_urls: 'http://example.com/ciguangshan',
                    source_type: ['url', 'manual'],
                    tags: ['人文獎', '慈光山', '清寒'],
                    views_count: 120,
                    likes_count: 15,
                },
                {
                    created_by: creator2Id,
                    title: '斐陶斐榮譽學會『榮譽獎』工讀計畫',
                    summary: '大專院校大學部大一至大四在學學生，符合工讀計畫申請資格者。',
                    full_content: '詳細辦法請洽課外活動組。',
                    category: 'D',
                    application_deadline: '2025-08-15',
                    announcement_end_date: '2025-08-20',
                    target_audience: '大學部學生',
                    application_limitations: 'N',
                    submission_method: '線上系統申請',
                    is_active: true,
                    tags: ['工讀', '斐陶斐'],
                    views_count: 85,
                    likes_count: 10,
                },
                {
                    created_by: creator1Id,
                    title: '國立臺灣藝術大學『勵志獎學金』',
                    summary: '各大專院校在學學生 (含大學部及碩士班，不含延修生)；其中，清寒類別限國立臺灣藝術大學在學學生。申請者須符合急難救助條件、藝術表現優異 (曾獲國際/全國競賽獎項)、或參與國際/兩岸交流者。',
                    full_content: '申請表及相關證明文件請於截止日前送至系辦公室。',
                    category: 'C',
                    application_deadline: '2025-07-31',
                    announcement_end_date: '2025-08-10',
                    target_audience: '大專院校在學學生 (含大學部及碩士班)',
                    application_limitations: 'Y',
                    submission_method: '紙本郵寄至國立臺灣藝術大學有章藝術博物館',
                    is_active: true,
                    tags: ['藝術大學', '清寒', '急難', '競賽'],
                    views_count: 95,
                    likes_count: 12,
                },
            ])
            .select();


        if (announcementsError) {
            console.error('Error seeding announcements:', announcementsError);
            return;
        }
        console.log('Announcements seeded successfully:', announcements);

        // --- Seed Attachments (optional, link to seeded announcements) ---
        console.log('Seeding attachments...');
        const announcement1Id = announcements[0]?.id;

        if (announcement1Id) {
            const { data: attachments, error: attachmentsError } = await supabase
                .from('attachments')
                .insert([
                    {
                        announcement_id: announcement1Id,
                        file_name: 'ciguangshan_details.pdf',
                        stored_file_path: 'uploads/attachments/example_ciguangshan.pdf', // This is a placeholder path
                        file_size: 102400, // example size in bytes
                        mime_type: 'application/pdf'
                    },
                ])
                .select();

            if (attachmentsError) {
                console.error('Error seeding attachments:', attachmentsError);
                return;
            }
            console.log('Attachments seeded successfully:', attachments);
        } else {
            console.log('Skipping attachment seeding as no announcements were seeded.');
        }


        console.log('Database seeding complete.');

    } catch (error) {
        console.error('An unexpected error occurred during seeding:', error);
    }
}

seedDatabase();
