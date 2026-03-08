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
    BarChart3,
    LayoutDashboard,
    ChevronDown,
    Settings,
    LayoutGrid,
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
    <aside className={cn("flex-col border-r bg-card/50 backdrop-blur-xl", className)}>
      <div className="flex h-16 items-center px-6 mb-4">
        <Link href="/" className="flex items-center gap-2 group">
           <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
             <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
             >
              <path d="M5 22V8a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14H5z" />
              <path d="M2 22V6.25a1 1 0 0 1 1.34-.95l1.66.55a1 1 0 0 0 1.01-.2l1.65-1.1a1 1 0 0 1 1.01-.2l1.66.55a1 1 0 0 0 1.01-.2l1.65-1.1a1 1 0 0 1 1.01-.2l1.66.55A1 1 0 0 0 19 6.25V22H2z" />
             </svg>
           </div>
          <span className="font-bold tracking-tight text-lg text-primary">Arogya CRM</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-6">
        <nav className="grid items-start gap-1">
          {currentUser?.role === 'admin' && (
             <Collapsible key="Admin" defaultOpen={pathname.startsWith('/admin')} className="mb-2">
                <CollapsibleTrigger className="flex w-full items-center justify-between px-2 mb-2">
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">ADMINISTRATION</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-300" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1">
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
                <CollapsibleTrigger className="flex w-full items-center justify-between px-2 mb-2 group">
                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase group-hover:text-primary transition-colors">{section.title}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-300" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1">
                    {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link key={item.href} href={item.href} className={cn('sidebar-link', isActive && 'sidebar-link-active')}>
                                <Icon className="h-4 w-4" />
                                <span className="font-medium">{item.label}</span>
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