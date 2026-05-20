import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  serverExternalPackages: [
    'firebase-admin', 
    '@google-cloud/firestore',
    '@google-cloud/storage',
    'google-auth-library',
    'protobufjs',
    'google-gax',
    '@genkit-ai/google-genai'
  ],
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: path.join(__dirname, 'tsconfig.json'),
  },
  eslint: {
    ignoreDuringBuilds: false,
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
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;
