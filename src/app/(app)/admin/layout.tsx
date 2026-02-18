'use client';

import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isUserLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    // This effect handles redirecting non-admin users away from this section.
    if (!isUserLoading && currentUser?.role !== 'admin') {
      router.replace('/dashboard'); 
    }
  }, [currentUser, isUserLoading, router]);

  // To prevent the "Rendered more hooks" error, we must maintain a consistent
  // component structure. The children are always rendered.
  // If the user is not an admin, the `useEffect` will redirect them away.
  // While loading, the admin pages inside `children` will get the loading state
  // from the `useApp` context and show their own loading indicators.
  return <>{children}</>;
}
