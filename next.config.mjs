/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Accept-Encoding", value: "gzip, br" }
        ],
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    // Minimal webpack configuration to avoid module loading issues
    return config;
  },
}

export default nextConfig
