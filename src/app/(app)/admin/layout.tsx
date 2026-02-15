'use client';

import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isUserLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && currentUser?.role !== 'admin') {
      router.replace('/dashboard'); 
    }
  }, [currentUser, isUserLoading, router]);

  if (isUserLoading || currentUser?.role !== 'admin') {
    return (
        <div className="flex flex-col h-full space-y-4">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-32 w-full" />
        </div>
    );
  }

  return <>{children}</>;
}
