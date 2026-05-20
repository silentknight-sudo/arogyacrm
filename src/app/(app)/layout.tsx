
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainSidebar } from '@/components/main-sidebar';
import { MainHeader } from '@/components/main-header';
import { useUser } from '@/firebase';
import { LeadAlertListener } from '@/components/lead-alert-listener';
import { LeadReminderListener } from '@/components/lead-reminder-listener';


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router, mounted]);

  // Prevent context violations during SSR and initial hydration
  if (!mounted) return null;

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[256px_1fr]">
      <LeadAlertListener />
      <LeadReminderListener />
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
