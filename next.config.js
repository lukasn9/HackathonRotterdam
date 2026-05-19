/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['qrcode', '@supabase/supabase-js', '@supabase/realtime-js'],
    // Disable client-side router cache
    staleTimes: { dynamic: 0, static: 0 },
  },

  // Disable HTTP ETags so browsers never serve cached API responses
  generateEtags: false,

  // Disable all webpack filesystem caching in dev
  webpack: (config, { dev }) => {
    if (dev) config.cache = false
    return config
  },
};

module.exports = nextConfig;
