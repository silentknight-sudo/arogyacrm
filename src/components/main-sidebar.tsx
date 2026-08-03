'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
    Megaphone, Ticket, LayoutDashboard,
    Shield, Sparkles, BarChart3, UserCog,
    MonitorSmartphone, UploadCloud, ListChecks, WalletCards, Settings, Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';
import { LEAD_STATUS_ORDER, getLeadStatusLabel } from '@/lib/status-labels';

type SidebarItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

export function MainSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser } = useApp();

  const isAdmin = currentUser?.role === 'admin';
  const isTL = currentUser?.role === 'sales_team_lead';
  const isTelecaller = currentUser?.role === 'sales_executive';

  const crmItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/leads', label: 'Leads', icon: Users },
        !isTelecaller ? { href: isAdmin ? '/admin/users?view=telecallers' : '/admin/users', label: 'Telecaller List', icon: UserCog } : null,
        !isTelecaller ? { href: '/analytics/reports', label: 'Reports Management', icon: BarChart3 } : null,
        !isTelecaller ? { href: '/device-manager', label: 'Device Manager', icon: MonitorSmartphone } : null,
        isAdmin ? { href: '/campaigns', label: 'Product Campaigns', icon: Megaphone } : null,
        isAdmin ? { href: '/add-on', label: 'Add Product Leads', icon: UploadCloud } : null,
        { href: '/follow-up', label: 'Follow Up', icon: ListChecks },
        isAdmin ? { href: '/support/tickets', label: 'Support Tickets', icon: Ticket } : null,
        !isTelecaller ? { href: '/transactions', label: 'Transactions', icon: WalletCards } : null,
        { href: '/settings', label: 'Settings', icon: Settings },
    ].filter((item): item is SidebarItem => Boolean(item));

  const menu = [
    { title: "CRM", items: crmItems },
  ];

  return (
    <aside className={cn("flex flex-col glass-sidebar h-screen sticky top-0", className)}>
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
                <p className="px-5 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Governance</p>
                <div className="space-y-1.5">
                    {isAdmin && (
                        <Link href="/admin" className={cn('sidebar-link', pathname === '/admin' && 'sidebar-link-active')}>
                            <Shield className="h-4 w-4" /> <span>Console</span>
                        </Link>
                    )}
                    {isAdmin ? (
                      <Link href="/admin/users?view=team-leads" className={cn('sidebar-link', pathname === '/admin/users' && searchParams.get('view') !== 'telecallers' && 'sidebar-link-active')}>
                          <UserCog className="h-4 w-4" /> <span>Team Leaders</span>
                      </Link>
                    ) : (
                      <Link href="/admin/users" className={cn('sidebar-link', pathname.startsWith('/admin/users') && 'sidebar-link-active')}>
                          <UserCog className="h-4 w-4" /> <span>My Team</span>
                      </Link>
                    )}
                </div>
            </div>
        )}

        {menu.map((section) => (
            <div key={section.title} className="space-y-3">
                <p className="px-5 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">{section.title}</p>
                <div className="space-y-1.5">
                    {section.items.map((item) => {
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
                                        {LEAD_STATUS_ORDER.map((status) => {
                                            const statusActive = pathname === '/leads' && searchParams.get('status') === status;
                                            return (
                                                <Link
                                                    key={status}
                                                    href={`/leads?status=${encodeURIComponent(status)}`}
                                                    className={cn(
                                                      'block rounded-lg px-3 py-2 text-sm font-extrabold text-[#e4dcc2] transition-colors hover:bg-white/10 hover:text-white',
                                                      statusActive && 'bg-[#d3b66b]/20 text-[#f8f2dd]'
                                                    )}
                                                >
                                                    {getLeadStatusLabel(status)}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                                {item.href === '/follow-up' && (
                                    <div className="ml-8 space-y-1">
                                        <Link href="/follow-up/hot" className={cn('block rounded-lg px-3 py-2 text-sm font-extrabold text-[#e4dcc2] transition-colors hover:bg-white/10 hover:text-white', pathname === '/follow-up/hot' && 'bg-[#d3b66b]/20 text-[#f8f2dd]')}>Hot Leads Incoming</Link>
                                        <Link href="/follow-up/overdue" className={cn('block rounded-lg px-3 py-2 text-sm font-extrabold text-[#e4dcc2] transition-colors hover:bg-white/10 hover:text-white', pathname === '/follow-up/overdue' && 'bg-[#d3b66b]/20 text-[#f8f2dd]')}>Overdue Leads</Link>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
      </div>
    </aside>
  );
}
