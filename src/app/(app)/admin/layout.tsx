'use client';

import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isUserLoading } = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // This effect handles redirecting non-admin users away from this section.
    // It only runs on the client after hydration is complete.
    if (mounted && !isUserLoading && currentUser && currentUser.role !== 'admin') {
      router.replace('/dashboard'); 
    }
  }, [currentUser, isUserLoading, router, mounted]);

  // Prevent rendering server-side to avoid context errors before hydration
  if (!mounted) return null;

  return <>{children}</>;
}