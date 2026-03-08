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
    // REDIRECT PROTECTION: Only permit admins to view this layout.
    // We wait for hydration and user state to be settled.
    if (mounted && !isUserLoading) {
      if (!currentUser || currentUser.role !== 'admin') {
        router.replace('/dashboard'); 
      }
    }
  }, [currentUser, isUserLoading, router, mounted]);

  // Prevent rendering server-side or during initial hydration to avoid context mismatch
  if (!mounted || isUserLoading) return null;

  // Final check before rendering protected content
  if (currentUser?.role !== 'admin') return null;

  return <>{children}</>;
}