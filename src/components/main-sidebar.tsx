'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Users,
    Contact,
    Building2,
    Handshake,
    Megaphone,
    ListTodo,
    Calendar,
    Phone,
    Package,
    ShoppingCart,
    FilePlus2,
    Receipt,
    Ticket,
    Undo2,
    ShieldAlert,
    LayoutDashboard,
    ChevronDown,
    Settings,
    LayoutGrid,
    Leaf,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import React from 'react';
import { useApp } from '@/context/app-context';

const menuItems = [
    {
        title: "CORE",
        items: [
            { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        ]
    },
    {
        title: 'SALES PIPELINE',
        items: [
            { href: '/leads', label: 'Prospects', icon: Users },
            { href: '/contacts', label: 'Contacts', icon: Contact },
            { href: '/accounts', label: 'Accounts', icon: Building2 },
            { href: '/deals', label: 'Deals', icon: Handshake },
        ],
    },
    {
        title: 'MARKETING',
        items: [
            { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
        ],
    },
    {
        title: 'OPERATIONS',
        items: [
            { href: '/tasks', label: 'Tasks', icon: ListTodo },
            { href: '/meetings', label: 'Events', icon: Calendar },
            { href: '/calls', label: 'Calls', icon: Phone },
        ],
    },
    {
        title: 'INVENTORY & BILLING',
        items: [
            { href: '/inventory/products', label: 'Catalog', icon: Package },
            { href: '/inventory/quotes', label: 'Quotes', icon: LayoutGrid },
            { href: '/inventory/sales-orders', label: 'Sales Orders', icon: ShoppingCart },
            { href: '/inventory/purchase-orders', label: 'Purchase Orders', icon: FilePlus2 },
            { href: '/inventory/invoices', label: 'Invoices', icon: Receipt },
        ],
    },
    {
        title: 'CUSTOMER SUCCESS',
        items: [
            { href: '/support/tickets', label: 'Tickets', icon: Ticket },
            { href: '/support/refunds', label: 'Refunds', icon: Undo2 },
            { href: '/support/complaints', label: 'Escalations', icon: ShieldAlert },
        ],
    },
];

export function MainSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { currentUser } = useApp();

  return (
    <aside className={cn("flex-col glass-sidebar", className)}>
      <div className="flex h-20 items-center px-6 mb-2">
        <Link href="/" className="flex items-center gap-3 group">
           <div className="p-2.5 bg-primary rounded-2xl shadow-xl shadow-primary/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
             <Leaf className="h-6 w-6 text-white" />
           </div>
          <div className="flex flex-col">
            <span className="font-black tracking-tighter text-xl text-primary leading-tight">AROGYA</span>
            <span className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] -mt-1 uppercase">Wellness CRM</span>
          </div>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-6 scrollbar-thin">
        <nav className="grid items-start gap-1.5">
          {currentUser?.role === 'admin' && (
             <Collapsible key="Admin" defaultOpen={pathname.startsWith('/admin')} className="mb-2">
                <CollapsibleTrigger className="flex w-full items-center justify-between px-3 mb-2 group">
                    <span className="text-[10px] font-extrabold tracking-[0.15em] text-muted-foreground uppercase group-hover:text-primary">ADMINISTRATION</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 animate-in fade-in-0 slide-in-from-top-1">
                    <Link href="/admin" className={cn('sidebar-link', pathname === '/admin' && 'sidebar-link-active')}>
                        <Settings className="h-4 w-4" /> <span>Dashboard</span>
                    </Link>
                    <Link href="/admin/users" className={cn('sidebar-link', pathname.startsWith('/admin/users') && 'sidebar-link-active')}>
                        <Users className="h-4 w-4" /> <span>Users</span>
                    </Link>
                    <Link href="/admin/teamspaces" className={cn('sidebar-link', pathname.startsWith('/admin/teamspaces') && 'sidebar-link-active')}>
                        <Building2 className="h-4 w-4" /> <span>Teams</span>
                    </Link>
                </CollapsibleContent>
             </Collapsible>
          )}
          {menuItems.map((section) => (
             <Collapsible key={section.title} defaultOpen={section.items.some(item => pathname.startsWith(item.href))} className="mb-2">
                <CollapsibleTrigger className="flex w-full items-center justify-between px-3 mb-2 group">
                    <span className="text-[10px] font-extrabold tracking-[0.15em] text-muted-foreground uppercase group-hover:text-primary transition-colors">{section.title}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 animate-in fade-in-0 slide-in-from-top-1">
                    {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link key={item.href} href={item.href} className={cn('sidebar-link', isActive && 'sidebar-link-active')}>
                                <Icon className="h-4 w-4" />
                                <span className="font-semibold">{item.label}</span>
                            </Link>
                        );
                    })}
                </CollapsibleContent>
             </Collapsible>
          ))}
        </nav>
      </div>
    </aside>
  );
}