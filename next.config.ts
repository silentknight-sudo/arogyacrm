import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: [
      'firebase-admin', 
      '@google-cloud/firestore',
      'google-auth-library',
      'protobufjs',
      'google-gax',
      '@genkit-ai/google-genai'
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
