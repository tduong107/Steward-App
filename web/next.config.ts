import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      // Branded short links with UTM tracking
      { source: '/ig', destination: '/?utm_source=instagram&utm_medium=bio&utm_campaign=profile', permanent: false },
      { source: '/reddit', destination: '/?utm_source=reddit&utm_medium=post&utm_campaign=launch', permanent: false },
      { source: '/twitter', destination: '/?utm_source=twitter&utm_medium=social&utm_campaign=launch', permanent: false },
      { source: '/x', destination: '/?utm_source=twitter&utm_medium=social&utm_campaign=launch', permanent: false },
      { source: '/ph', destination: '/?utm_source=producthunt&utm_medium=launch&utm_campaign=ph_launch', permanent: false },
      { source: '/tiktok', destination: '/?utm_source=tiktok&utm_medium=bio&utm_campaign=profile', permanent: false },
      { source: '/linkedin', destination: '/?utm_source=linkedin&utm_medium=social&utm_campaign=launch', permanent: false },
      { source: '/email', destination: '/?utm_source=email&utm_medium=outreach&utm_campaign=beta_invite', permanent: false },
      { source: '/yt', destination: '/?utm_source=youtube&utm_medium=video&utm_campaign=launch', permanent: false },
      { source: '/qr', destination: '/?utm_source=qr_code&utm_medium=offline&utm_campaign=flyer', permanent: false },
    ]
  },
};

export default nextConfig;
