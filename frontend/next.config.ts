import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["react-leaflet", "leaflet"],
};

export default nextConfig;
