import type { NextConfig } from "next";
import { ENV } from "./config/env";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/firewall/:path*",
                destination: `${ENV!.SERVER_BASE_URL}/api/firewall/:path*`
            },
        ];
    },
};

export default nextConfig;