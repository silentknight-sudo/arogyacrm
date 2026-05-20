'use client';

import { useApp } from '../../../context/app-context';
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
    // REDIRECT PROTECTION: Permit Admins and Team Leads to view this layout.
    // Executives are restricted.
    if (mounted && !isUserLoading) {
      if (!currentUser || !['admin', 'sales_team_lead'].includes(currentUser.role)) {
        router.replace('/dashboard'); 
      }
    }
  }, [currentUser, isUserLoading, router, mounted]);

  // Prevent rendering server-side or during initial hydration to avoid context mismatch
  if (!mounted || isUserLoading) return null;

  // Final check before rendering protected content
  if (!currentUser || !['admin', 'sales_team_lead'].includes(currentUser.role)) return null;

  return <>{children}</>;
}
