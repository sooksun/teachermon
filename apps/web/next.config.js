/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@teachermon/shared'],
  compress: true, // Enable gzip compression for responses
  poweredByHeader: false, // Remove X-Powered-By header
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['recharts', 'react-toastify', '@tanstack/react-query'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  // เพิ่มการตั้งค่าเพื่อป้องกัน chunk loading errors
  onDemandEntries: {
    // ระยะเวลาที่หน้าเว็บจะอยู่ใน memory (ms)
    maxInactiveAge: 25 * 1000,
    // จำนวนหน้าสูงสุดที่เก็บไว้ใน memory
    pagesBufferLength: 2,
  },
  async redirects() {
    return [
      { source: '/teachers/new', destination: '/teachers/create', permanent: true },
    ];
  },
};

module.exports = nextConfig;
