
import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/context/app-context';
import { FirebaseClientProvider } from '@/firebase';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Arogya CRM',
  description: 'Ayurvedic Wellness Supplement CRM',
  icons: {
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="20" fill="%234A7C44" /%3E%3Cpath d="M50 20 C30 40 30 70 50 80 C70 70 70 40 50 20" fill="%23FFD700" /%3E%3C/svg%3E',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
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
