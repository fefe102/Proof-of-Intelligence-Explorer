import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@poi/sdk", "@poi/agent-runtime", "@poi/ui"]
};

export default nextConfig;
