import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // 明确指定 Turbopack 的根目录为当前项目目录
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
