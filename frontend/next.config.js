/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3-alpha-sig.figma.com',
        port: '', // или '443'
        pathname: '/img/**', // в зависимости от структуры URL
      },
    ],
    // либо (если вам не важны подпути)
    // domains: ['s3-alpha-sig.figma.com'],
  },
};

module.exports = nextConfig;
