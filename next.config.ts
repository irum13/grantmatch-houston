import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_DEPLOYMENT_MODE: isGitHubPages ? "static-judge" : "server",
  },
  ...(isGitHubPages
    ? {
        output: "export" as const,
        basePath: "/grantmatch-houston",
        assetPrefix: "/grantmatch-houston/",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
