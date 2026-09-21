import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  outputFileTracingIncludes: {
    "/*": ["./prisma/banktruth.db"],
    "/**/*": ["./prisma/banktruth.db"],
  },
};

export default nextConfig;
