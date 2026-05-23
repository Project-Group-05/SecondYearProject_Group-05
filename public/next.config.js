/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: ['127.0.0.1:3000', 'localhost:3000']
  }
};

module.exports = nextConfig;