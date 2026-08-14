import type { Metadata, Viewport } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/context/app-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const viewport: Viewport = {
  themeColor: '#2D5A27',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Arogya CRM | Premium Ayurvedic Wellness Management',
    template: '%s | Arogya CRM'
  },
  description: 'The definitive enterprise CRM for Ayurvedic wellness supplement businesses. Optimize leads, sales pipelines, and inventory with our premium herbal-focused management platform.',
  keywords: ['Ayurvedic CRM', 'Wellness Supplement Management', 'Herbal Business Software', 'Lead Tracking', 'Arogya Bio', 'Ayurveda Enterprise'],
  authors: [{ name: 'Arogya Bio Team' }],
  creator: 'Arogya Bio',
  publisher: 'Arogya Bio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://studio--studio-3238704164-621f1.us-central1.hosted.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Arogya CRM | Premium Ayurvedic Wellness Management',
    description: 'Optimize your wellness business with Arogya CRM. The leading platform for Ayurvedic supplement distribution.',
    url: '/',
    siteName: 'Arogya CRM',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arogya CRM | Premium Ayurvedic Wellness Management',
    description: 'The definitive enterprise CRM for Ayurvedic wellness supplement businesses.',
  },
  icons: {
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="20" fill="%234A7C44" /%3E%3Cpath d="M50 20 C30 40 30 70 50 80 C70 70 70 40 50 20" fill="%23FFD700" /%3E%3C/svg%3E',
    apple: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="20" fill="%234A7C44" /%3E%3Cpath d="M50 20 C30 40 30 70 50 80 C70 70 70 40 50 20" fill="%23FFD700" /%3E%3C/svg%3E',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Arogya CRM',
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    description: 'Enterprise CRM for Ayurvedic wellness supplement businesses.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased'
        )}
      >
        <FirebaseClientProvider>
          <AppProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </AppProvider>
        </FirebaseClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}