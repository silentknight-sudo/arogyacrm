'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Users, Contact, Handshake, Megaphone, Package,
    ShoppingCart, Receipt, Ticket, Undo2, ShieldAlert, LayoutDashboard,
    Leaf, Shield, LayoutGrid, Calendar, Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';

export function MainSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { currentUser } = useApp();

  const menu = [
    { title: "INSIGHTS", items: [{ href: '/dashboard', label: 'Overview', icon: LayoutDashboard }] },
    { title: 'PIPELINE', items: [
        { href: '/leads', label: 'Prospects', icon: Users },
        { href: '/contacts', label: 'Contacts', icon: Contact },
        { href: '/deals', label: 'Deals', icon: Handshake },
    ]},
    { title: 'ACTIVITIES', items: [
        { href: '/tasks', label: 'Tasks', icon: Calendar },
        { href: '/meetings', label: 'Meetings', icon: Calendar },
        { href: '/calls', label: 'Calls', icon: Phone },
    ]},
    { title: 'GROWTH', items: [{ href: '/campaigns', label: 'Campaigns', icon: Megaphone }] },
    { title: 'ECOMMERCE', items: [
        { href: '/inventory/products', label: 'Catalog', icon: Package },
        { href: '/inventory/quotes', label: 'Quotes', icon: LayoutGrid },
        { href: '/inventory/sales-orders', label: 'Orders', icon: ShoppingCart },
        { href: '/inventory/invoices', label: 'Invoices', icon: Receipt },
    ]},
    { title: 'SERVICE', items: [
        { href: '/support/tickets', label: 'Tickets', icon: Ticket },
        { href: '/support/refunds', label: 'Refunds', icon: Undo2 },
        { href: '/support/complaints', label: 'Escalations', icon: ShieldAlert },
    ]},
  ];

  return (
    <aside className={cn("flex flex-col glass-sidebar h-screen sticky top-0", className)}>
      <div className="h-28 flex items-center px-10">
        <Link href="/" className="flex items-center gap-4 group">
           <div className="p-4 herbal-gradient rounded-[1.5rem] shadow-2xl shadow-primary/40 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
             <Leaf className="h-7 w-7 text-white" />
           </div>
           <div className="flex flex-col">
             <span className="font-black text-3xl text-primary tracking-tighter leading-none">AROGYA</span>
             <span className="text-[11px] font-black text-accent tracking-[0.4em] uppercase opacity-80">Premium</span>
           </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-12 space-y-10 scrollbar-hide pt-6">
        {currentUser?.role === 'admin' && (
            <div className="space-y-3">
                <p className="px-5 text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Governance</p>
                <div className="space-y-1.5">
                    <Link href="/admin" className={cn('sidebar-link', pathname === '/admin' && 'sidebar-link-active')}>
                        <Shield className="h-4 w-4" /> <span>Console</span>
                    </Link>
                    <Link href="/admin/users" className={cn('sidebar-link', pathname.startsWith('/admin/users') && 'sidebar-link-active')}>
                        <Users className="h-4 w-4" /> <span>Team Management</span>
                    </Link>
                </div>
            </div>
        )}

        {menu.map((section) => (
            <div key={section.title} className="space-y-3">
                <p className="px-5 text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">{section.title}</p>
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
