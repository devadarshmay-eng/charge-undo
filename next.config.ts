import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost:3000", "192.168.1.41", "127.0.0.1:3000"]
};

export default nextConfig;
