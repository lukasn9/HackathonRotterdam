/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['qrcode'],
  },
};

module.exports = nextConfig;
