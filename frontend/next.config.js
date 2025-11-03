/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  },
  webpack: (config) => {
    // 解析 shared 目錄的路徑（用於 Vercel 構建）
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/shared': path.resolve(__dirname, '../shared')
    }
    return config
  }
}

module.exports = nextConfig
