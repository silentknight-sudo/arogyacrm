
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainSidebar } from '@/components/main-sidebar';
import { MainHeader } from '@/components/main-header';
import { useUser } from '@/firebase';
import { LeadAlertListener } from '@/components/lead-alert-listener';


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

  // To prevent the "Rendered more hooks" error, we must always render the
  // children components to maintain a consistent component structure across renders.
  // The `useEffect` above will handle redirecting unauthenticated users.
  // While the user state is loading, the children components will receive
  // `isUserLoading: true` from the `useApp` context and will correctly
  // render their own loading states (e.g., skeletons), preventing a crash.
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[256px_1fr]">
      <LeadAlertListener />
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
