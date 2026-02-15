'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainSidebar } from '@/components/main-sidebar';
import { MainHeader } from '@/components/main-header';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';


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
    return (
       <div className="flex h-screen w-full items-center justify-center">
         <div className="space-y-4">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
         </div>
      </div>
    );
  }


  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[256px_1fr]">
      <MainSidebar />
      <div className="flex flex-col">
        <MainHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
}
