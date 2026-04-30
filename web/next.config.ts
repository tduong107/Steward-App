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
    // Branded short links with UTM tracking.
    //
    // `permanent: true` produces a 308 Permanent Redirect (modern
    // equivalent of 301). This is required for the rel="me" /
    // Organization.sameAs entity-verification loop on social
    // profiles: when Instagram, X, LinkedIn, etc. point at one of
    // these short URLs in their bio, Google has to follow the
    // redirect and trust that it definitively maps to the homepage.
    // 307 (the previous setting via `permanent: false`) is a
    // *temporary* redirect — Google treats it as "this might change"
    // and gives the entity claim less weight.
    //
    // Tradeoff: 308s cache aggressively in browsers, so if you ever
    // change a destination here, returning users may keep hitting
    // the old URL until their cache expires. Acceptable for these
    // since the destinations are tied to brand profiles that
    // shouldn't change.
    return [
      { source: '/ig', destination: '/?utm_source=instagram&utm_medium=bio&utm_campaign=profile', permanent: true },
      { source: '/reddit', destination: '/?utm_source=reddit&utm_medium=post&utm_campaign=launch', permanent: true },
      { source: '/twitter', destination: '/?utm_source=twitter&utm_medium=social&utm_campaign=launch', permanent: true },
      { source: '/x', destination: '/?utm_source=twitter&utm_medium=social&utm_campaign=launch', permanent: true },
      { source: '/ph', destination: '/?utm_source=producthunt&utm_medium=launch&utm_campaign=ph_launch', permanent: true },
      { source: '/tiktok', destination: '/?utm_source=tiktok&utm_medium=bio&utm_campaign=profile', permanent: true },
      { source: '/linkedin', destination: '/?utm_source=linkedin&utm_medium=social&utm_campaign=launch', permanent: true },
      { source: '/email', destination: '/?utm_source=email&utm_medium=outreach&utm_campaign=beta_invite', permanent: true },
      { source: '/yt', destination: '/?utm_source=youtube&utm_medium=video&utm_campaign=launch', permanent: true },
      { source: '/qr', destination: '/?utm_source=qr_code&utm_medium=offline&utm_campaign=flyer', permanent: true },
    ]
  },
};

export default nextConfig;
