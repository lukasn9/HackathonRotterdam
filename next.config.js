/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['qrcode', '@supabase/supabase-js', '@supabase/realtime-js'],
  },
};

module.exports = nextConfig;
