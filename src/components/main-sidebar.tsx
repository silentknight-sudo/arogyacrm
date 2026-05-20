'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Users, Handshake, Megaphone, Package,
    ShoppingCart, Receipt, Ticket, Undo2, ShieldAlert, LayoutDashboard,
    Shield, CalendarCheck2, PhoneCall, Sparkles, BriefcaseBusiness, BarChart3, UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';

export function MainSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { currentUser } = useApp();

  const isAdmin = currentUser?.role === 'admin';
  const isTL = currentUser?.role === 'sales_team_lead';

  const menu = [
    { title: "INSIGHTS", items: [{ href: '/dashboard', label: 'Overview', icon: BarChart3 }] },
    { title: 'PIPELINE', items: [
        { href: '/leads', label: 'Prospects', icon: Users },
        ...(currentUser?.role !== 'sales_executive' ? [{ href: '/deals', label: 'Revenue', icon: Handshake }] : []),
    ]},
  ];

  if (isAdmin || isTL) {
    menu.push({ title: 'OPERATIONS', items: [
        { href: '/tasks', label: 'Workflows', icon: BriefcaseBusiness },
        { href: '/meetings', label: 'Sessions', icon: CalendarCheck2 },
        { href: '/calls', label: 'Activities', icon: PhoneCall },
    ]});
    
    menu.push({ title: 'COMMERCE', items: [
        { href: '/inventory/products', label: 'Catalog', icon: Package },
        { href: '/inventory/sales-orders', label: 'Orders', icon: ShoppingCart },
        { href: '/inventory/invoices', label: 'Billings', icon: Receipt },
    ]});
  }

  if (isAdmin) {
    menu.push({ title: 'GROWTH', items: [{ href: '/campaigns', label: 'Strategy', icon: Megaphone }] });
    menu.push({ title: 'SUPPORT', items: [
        { href: '/support/tickets', label: 'Tickets', icon: Ticket },
        { href: '/support/refunds', label: 'Refunds', icon: Undo2 },
        { href: '/support/complaints', label: 'Escalations', icon: ShieldAlert },
    ]});
  }

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
                    <Link href="/admin/users" className={cn('sidebar-link', pathname.startsWith('/admin/users') && 'sidebar-link-active')}>
                        <UserCog className="h-4 w-4" /> <span>{isAdmin ? 'Global Team' : 'My Team'}</span>
                    </Link>
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
                            <Link key={item.href} href={item.href} className={cn('sidebar-link', active && 'sidebar-link-active')}>
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        ))}
      </div>
    </aside>
  );
}
