'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Users, Contact, Building2, Handshake, Megaphone, Package,
    ShoppingCart, Receipt, Ticket, Undo2, ShieldAlert, LayoutDashboard,
    Leaf, Shield, LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';

export function MainSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { currentUser } = useApp();

  const menu = [
    { title: "CORE", items: [{ href: '/dashboard', label: 'Overview', icon: LayoutDashboard }] },
    { title: 'SALES', items: [
        { href: '/leads', label: 'Prospects', icon: Users },
        { href: '/contacts', label: 'Contacts', icon: Contact },
        { href: '/accounts', label: 'Accounts', icon: Building2 },
        { href: '/deals', label: 'Deals', icon: Handshake },
    ]},
    { title: 'MARKETING', items: [{ href: '/campaigns', label: 'Campaigns', icon: Megaphone }] },
    { title: 'INVENTORY', items: [
        { href: '/inventory/products', label: 'Catalog', icon: Package },
        { href: '/inventory/quotes', label: 'Quotes', icon: LayoutGrid },
        { href: '/inventory/sales-orders', label: 'Sales Orders', icon: ShoppingCart },
        { href: '/inventory/invoices', label: 'Invoices', icon: Receipt },
    ]},
    { title: 'SUPPORT', items: [
        { href: '/support/tickets', label: 'Tickets', icon: Ticket },
        { href: '/support/refunds', label: 'Refunds', icon: Undo2 },
        { href: '/support/complaints', label: 'Escalations', icon: ShieldAlert },
    ]},
  ];

  return (
    <aside className={cn("flex flex-col glass-sidebar h-screen sticky top-0", className)}>
      <div className="h-24 flex items-center px-8">
        <Link href="/" className="flex items-center gap-3 group">
           <div className="p-3 herbal-gradient rounded-2xl shadow-2xl shadow-primary/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
             <Leaf className="h-6 w-6 text-white" />
           </div>
           <div className="flex flex-col">
             <span className="font-black text-2xl text-primary tracking-tighter leading-none">AROGYA</span>
             <span className="text-[10px] font-bold text-accent tracking-[0.3em] uppercase">Premium CRM</span>
           </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-8 scrollbar-hide pt-4">
        {currentUser?.role === 'admin' && (
            <div className="space-y-2">
                <p className="px-4 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Administration</p>
                <div className="space-y-1">
                    <Link href="/admin" className={cn('sidebar-link', pathname === '/admin' && 'sidebar-link-active')}>
                        <Shield className="h-4 w-4" /> <span>Console</span>
                    </Link>
                    <Link href="/admin/users" className={cn('sidebar-link', pathname.startsWith('/admin/users') && 'sidebar-link-active')}>
                        <Users className="h-4 w-4" /> <span>Users</span>
                    </Link>
                </div>
            </div>
        )}

        {menu.map((section) => (
            <div key={section.title} className="space-y-2">
                <p className="px-4 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">{section.title}</p>
                <div className="space-y-1">
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