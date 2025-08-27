// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/firewall/:path*",
                destination: `http://backend:4000/api/firewall/:path*`
            },
        ];
    },
};

export default nextConfig;