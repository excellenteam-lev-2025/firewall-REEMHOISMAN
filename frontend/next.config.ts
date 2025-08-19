import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/firewall/:path*",
                destination: "http://localhost:3001/api/firewall/:path*"
            },
        ];
    },
};

export default nextConfig;
