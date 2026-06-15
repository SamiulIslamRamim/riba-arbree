
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ["i.ibb.co", "upload.wikimedia.org"],
  },
};

export default nextConfig;
