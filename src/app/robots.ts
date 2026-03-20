import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/dashboard/', '/admin/', '/leads/', '/deals/', '/inventory/'],
    },
    sitemap: 'https://studio--studio-3238704164-621f1.us-central1.hosted.app/sitemap.xml',
  };
}
