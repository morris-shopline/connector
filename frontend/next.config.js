/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    // 生產環境必須設定 NEXT_PUBLIC_BACKEND_URL
    // 開發環境可以使用 NEXT_PUBLIC_NGROK_URL（ngrok）或 NEXT_PUBLIC_API_URL
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_NGROK_URL: process.env.NEXT_PUBLIC_NGROK_URL
  },
}

module.exports = nextConfig
