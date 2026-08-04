'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  MonitorSmartphone,
  Settings,
  Shield,
  Sparkles,
  Ticket,
  UploadCloud,
  UserCog,
  Users,
  WalletCards,
} from 'lucide-react';
import { collection, documentId, query, where } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';
import { LEAD_STATUS_ORDER, getLeadStatusLabel } from '@/lib/status-labels';
import type { Lead, LeadStatus, UserProfile } from '@/types';
import { getRoleAwareLeadStage } from '@/lib/role-lead-stage';

type SidebarItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const LEAD_FILTERS: Array<'fresh_uploads' | 'pending' | Exclude<LeadStatus, 'new'>> = ['fresh_uploads', 'pending', 'done', 'not intrested', 'intrested', 'CNP'];

export function MainSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { currentUser, currentTeamspace } = useApp();

  const isAdmin = currentUser?.role === 'admin';
  const isTL = currentUser?.role === 'sales_team_lead';
  const isTelecaller = currentUser?.role === 'sales_executive';

  const leadsQuery = useMemoFirebase(() => {
    if (!currentTeamspace?.id) return null;
    return query(collection(firestore, 'teamspaces', currentTeamspace.id, 'leads'));
  }, [firestore, currentTeamspace?.id]);
  const { data: leads } = useCollection<Lead>(leadsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!currentUser || !currentTeamspace?.id) return null;
    if (isAdmin) {
      return query(collection(firestore, 'users'), where('teamspaceIds', 'array-contains', currentTeamspace.id));
    }
    if (isTL) {
      return query(
        collection(firestore, 'users'),
        where('createdBy', '==', currentUser.id),
        where('role', '==', 'sales_executive')
      );
    }
    return query(collection(firestore, 'users'), where(documentId(), '==', currentUser.id));
  }, [currentUser, currentTeamspace?.id, firestore, isAdmin, isTL]);
  const { data: sidebarUsers } = useCollection<UserProfile>(usersQuery);
  const stageUsers = useMemo(
    () => (currentUser ? [currentUser, ...(sidebarUsers || []).filter((user) => user.id !== currentUser.id)] : sidebarUsers || []),
    [currentUser, sidebarUsers]
  );

  const visibleLeads = (leads || []).filter((lead) => {
    if (!currentUser) return false;
    if (isAdmin) {
      return !lead.assignedToIds || lead.assignedToIds.length === 0 || lead.assignedToIds.includes(currentUser.id);
    }
    return (lead.assignedToIds || []).includes(currentUser.id);
  });

  const stageCounts = useMemo(() => ({
    fresh_uploads: visibleLeads.filter((lead) => getRoleAwareLeadStage(lead, currentUser, stageUsers, currentTeamspace) === 'fresh_uploads').length,
    pending: visibleLeads.filter((lead) => getRoleAwareLeadStage(lead, currentUser, stageUsers, currentTeamspace) === 'pending').length,
    done: visibleLeads.filter((lead) => lead.status === 'done').length,
    'not intrested': visibleLeads.filter((lead) => lead.status === 'not intrested').length,
    intrested: visibleLeads.filter((lead) => lead.status === 'intrested').length,
    CNP: visibleLeads.filter((lead) => lead.status === 'CNP').length,
  }), [visibleLeads, currentUser, stageUsers, currentTeamspace]);

  const crmItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/leads', label: 'Leads', icon: Users },
    !isTelecaller ? { href: '/analytics/reports', label: 'Reports Management', icon: BarChart3 } : null,
    !isTelecaller ? { href: '/device-manager', label: 'Device Manager', icon: MonitorSmartphone } : null,
    isAdmin ? { href: '/campaigns', label: 'Product Campaigns', icon: Megaphone } : null,
    isAdmin ? { href: '/add-on', label: 'Add Product Leads', icon: UploadCloud } : null,
    { href: '/follow-up', label: 'Follow Up', icon: ListChecks },
    isAdmin ? { href: '/support/tickets', label: 'Support Tickets', icon: Ticket } : null,
    !isTelecaller ? { href: '/transactions', label: 'Transactions', icon: WalletCards } : null,
    { href: '/settings', label: 'Settings', icon: Settings },
  ].filter((item): item is SidebarItem => Boolean(item));

  const teamItems = [
    isAdmin ? { href: '/admin/users?view=team-leads', label: 'Team Leaders', icon: Shield } : null,
    !isTelecaller
      ? { href: isAdmin ? '/admin/users?view=telecallers' : '/admin/users', label: isAdmin ? 'Telecaller List' : 'My Telecallers', icon: UserCog }
      : null,
    !isTelecaller ? { href: '/device-manager', label: 'Device Manager', icon: MonitorSmartphone } : null,
  ].filter((item): item is SidebarItem => Boolean(item));

  return (
    <aside className={cn('flex flex-col glass-sidebar h-screen sticky top-0', className)}>
      <div className="h-32 flex items-center px-10">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="p-4 zen-gradient rounded-2xl shadow-2xl shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <Sparkles className="h-7 w-7 text-accent" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl text-primary tracking-tighter leading-none">AROGYA</span>
            <span className="text-[10px] font-black text-accent tracking-[0.4em] uppercase opacity-80">Elite Hub</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-12 space-y-10 scrollbar-hide pt-4">
        {(isAdmin || isTL) && (
          <div className="space-y-3">
            <p className="px-5 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Team</p>
            <div className="space-y-1.5">
              {isAdmin && (
                <Link href="/admin" className={cn('sidebar-link', pathname === '/admin' && 'sidebar-link-active')}>
                  <Shield className="h-4 w-4" /> <span>Console</span>
                </Link>
              )}
              {teamItems.map((item) => {
                const Icon = item.icon;
                const [itemPath, itemQuery] = item.href.split('?');
                const active = pathname === itemPath && (!itemQuery || searchParams.toString() === itemQuery);

                return (
                  <Link key={item.href} href={item.href} className={cn('sidebar-link ml-2 text-sm font-extrabold', active && 'sidebar-link-active')}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="px-5 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">CRM</p>
          <div className="space-y-1.5">
            {crmItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <div key={item.href} className="space-y-1.5">
                  <Link href={item.href} className={cn('sidebar-link', active && 'sidebar-link-active')}>
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>

                  {item.href === '/leads' && (
                    <div className="ml-8 space-y-1">
                      {LEAD_FILTERS.map((status) => {
                        const statusActive = pathname === '/leads' && searchParams.get('status') === status;
                        const count = stageCounts[status];

                        return (
                          <Link
                            key={status}
                            href={`/leads?status=${encodeURIComponent(status)}`}
                            className={cn(
                              'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-extrabold text-[#e4dcc2] transition-colors hover:bg-white/10 hover:text-white',
                              statusActive && 'bg-[#d3b66b]/20 text-[#f8f2dd]'
                            )}
                          >
                            <span>{status === 'fresh_uploads' ? 'New Leads' : status === 'pending' ? 'Pending' : getLeadStatusLabel(status)}</span>
                            <span className="rounded-full bg-[#d3b66b]/20 px-2 py-0.5 text-xs font-black text-[#f8f2dd]">{count}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {item.href === '/follow-up' && (
                    <div className="ml-8 space-y-1">
                      <Link
                        href="/follow-up/hot"
                        className={cn(
                          'block rounded-xl px-3 py-2.5 text-sm font-extrabold text-[#e4dcc2] transition-colors hover:bg-white/10 hover:text-white',
                          pathname === '/follow-up/hot' && 'bg-[#d3b66b]/20 text-[#f8f2dd]'
                        )}
                      >
                        Hot Leads Incoming
                      </Link>
                      <Link
                        href="/follow-up/overdue"
                        className={cn(
                          'block rounded-xl px-3 py-2.5 text-sm font-extrabold text-[#e4dcc2] transition-colors hover:bg-white/10 hover:text-white',
                          pathname === '/follow-up/overdue' && 'bg-[#d3b66b]/20 text-[#f8f2dd]'
                        )}
                      >
                        Overdue Leads
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
