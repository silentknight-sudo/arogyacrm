import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Arogya CRM',
    short_name: 'Arogya',
    description: 'Enterprise management for Ayurvedic wellness supplements.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F9F4',
    theme_color: '#2D5A27',
    icons: [
      {
        src: 'favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
