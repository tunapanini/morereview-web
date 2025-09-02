import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    domains: ['ads-partners.coupang.com', 'coupa.ng', 'static.coupangcdn.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ads-partners.coupang.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'coupa.ng',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.coupangcdn.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ads-partners.coupang.com https://coupa.ng https://va.vercel-scripts.com https://partners.coupangcdn.com",
              "style-src 'self' 'unsafe-inline' https://partners.coupangcdn.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-src 'self' https://ads-partners.coupang.com https://coupa.ng https://link.coupang.com",
              "frame-ancestors 'self'",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'unsafe-url'
          },
          {
            key: 'Permissions-Policy',
            value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self), usb=()'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
