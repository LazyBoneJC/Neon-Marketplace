import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/rindexer-proxy/:path*", // 當前端請求這個路徑...
                destination: "https://marketplace-indexer.zeabur.app/:path*", // Next.js 會幫你轉發到這裡
            },
        ]
    },
}

export default nextConfig
