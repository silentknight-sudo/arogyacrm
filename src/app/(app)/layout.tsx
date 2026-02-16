'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainSidebar } from '@/components/main-sidebar';
import { MainHeader } from '@/components/main-header';
import { useUser } from '@/firebase';


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    // Show a full-page loading skeleton while we determine auth state
    // or before the redirect to /login happens.
    // This avoids rendering the main layout and its children, which prevents
    // the "rendered more hooks" error and avoids a flash of the UI.
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
         <div className="space-y-4 text-center">
            {/* You can add a spinner or a more elaborate skeleton here */}
            <p className="text-muted-foreground">Loading Application...</p>
         </div>
      </div>
    );
  }


  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[256px_1fr]">
      <MainSidebar className="hidden w-64 lg:flex" />
      <div className="flex flex-col">
        <MainHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}
