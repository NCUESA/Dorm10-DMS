/** @type {import('next').NextConfig} */
const nextConfig = {
    // 解決跨域請求警告
    allowedDevOrigins: ['10.21.44.243'],
    
    // 設置 CORS headers
    async headers() {
        return [
            {
                source: '/(.*)',
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
                        value: 'Content-Type, Authorization, X-Requested-With, apikey',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
