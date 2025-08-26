// next.config.ts
import type { NextConfig } from "next";

// ברירת מחדל בטוחה בזמן build
const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://backend:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/firewall/:path*",
        destination: `${INTERNAL_API_URL}/api/firewall/:path*`,
      },
    ];
  },
};

export default nextConfig;
