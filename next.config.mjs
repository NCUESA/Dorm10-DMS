/** @type {import('next').NextConfig} */
const nextConfig = {
    // 允許開發時外部網域存取
    allowedDevOrigins: [
        '10.21.44.243',
        'localhost',
        '127.0.0.1',
        'dorm10dms.ncuesa.org.tw',
        'www.dorm10dms.ncuesa.org.tw'
    ],

    // 設置 CORS headers
    async headers() {
        return [
            {
                // 為所有 API 路由設置 CORS
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization, X-Requested-With, apikey, prefer, x-client-info, x-supabase-api-version',
                    },
                    {
                        key: 'Access-Control-Expose-Headers',
                        value: 'content-range, x-supabase-api-version',
                    },
                    {
                        key: 'Access-Control-Max-Age',
                        value: '86400',
                    },
                ],
            },
            {
                // 為其他路由設置基本 CORS
                source: '/((?!api).*)',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization, X-Requested-With',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
