'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Contact,
  Building2,
  Handshake,
  TrendingUp,
  FileText,
  Megaphone,
  ListTodo,
  Calendar,
  Phone,
  Package,
  Book,
  FileQuestion,
  ShoppingCart,
  FilePlus2,
  Receipt,
  Ticket,
  Undo2,
  ShieldAlert,
  BarChart3,
  LayoutDashboard,
  Target,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import React from 'react';
import { useApp } from '@/context/app-context';

const menuItems = [
    {
        title: "Home",
        items: [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ]
    },
    {
        title: 'Sales',
        items: [
            { href: '/leads', label: 'Leads', icon: Users },
            { href: '/contacts', label: 'Contacts', icon: Contact },
            { href: '/accounts', label: 'Accounts', icon: Building2 },
            { href: '/deals', label: 'Deals', icon: Handshake },
            { href: '/forecasts', label: 'Forecasts', icon: TrendingUp },
        ],
    },
    {
        title: 'Marketing',
        items: [
            { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
            { href: '/documents', label: 'Documents', icon: FileText },
        ],
    },
    {
        title: 'Activities',
        items: [
            { href: '/tasks', label: 'Tasks', icon: ListTodo },
            { href: '/meetings', label: 'Meetings', icon: Calendar },
            { href: '/calls', label: 'Calls', icon: Phone },
        ],
    },
    {
        title: 'Inventory',
        items: [
            { href: '/inventory/products', label: 'Products', icon: Package },
            { href: '/inventory/price-books', label: 'Price Books', icon: Book },
            { href: '/inventory/quotes', label: 'Quotes', icon: FileQuestion },
            { href: '/inventory/sales-orders', label: 'Sales Orders', icon: ShoppingCart },
            { href: '/inventory/purchase-orders', label: 'Purchase Orders', icon: FilePlus2 },
            { href: '/inventory/invoices', label: 'Invoices', icon: Receipt },
        ],
    },
    {
        title: 'Support',
        items: [
            { href: '/support/tickets', label: 'Tickets', icon: Ticket },
            { href: '/support/refunds', label: 'Refunds', icon: Undo2 },
            { href: '/support/complaints', label: 'Complaints', icon: ShieldAlert },
        ],
    },
    {
        title: 'Analytics',
        items: [
            { href: '/analytics/reports', label: 'Reports', icon: BarChart3 },
            { href: '/analytics/revenue-dashboard', label: 'Revenue Dashboard', icon: TrendingUp },
            { href: '/analytics/marketing-roi', label: 'Marketing ROI', icon: Target },
        ],
    },
];

export function MainSidebar() {
  const pathname = usePathname();
  const { currentUser } = useApp();

  return (
    <aside className="hidden w-64 flex-col border-r bg-background lg:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
           <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary"
           >
            <path d="M5 22V8a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v14H5z" />
            <path d="M2 22V6.25a1 1 0 0 1 1.34-.95l1.66.55a1 1 0 0 0 1.01-.2l1.65-1.1a1 1 0 0 1 1.01-.2l1.66.55a1 1 0 0 0 1.01-.2l1.65-1.1a1 1 0 0 1 1.01-.2l1.66.55A1 1 0 0 0 19 6.25V22H2z" />
            <path d="M12 14v-2" />
            <path d="M12 8V6" />
           </svg>
          <span className="">Arogya CRM</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium">
          {currentUser?.role === 'admin' && (
             <Collapsible key="Admin" defaultOpen={pathname.startsWith('/admin')} className="mb-2">
                <CollapsibleTrigger className="w-full">
                    <div className="flex w-full items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Admin</span>
                        <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="mt-2 flex flex-col gap-1">
                        <Link
                            href="/admin/users"
                            className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                            pathname.startsWith('/admin/users') && 'bg-muted text-primary'
                            )}
                        >
                            <Users className="h-4 w-4" />
                            User Management
                        </Link>
                    </div>
                </CollapsibleContent>
             </Collapsible>
          )}
          {menuItems.map((section) => (
             <Collapsible key={section.title} defaultOpen={section.items.some(item => pathname.startsWith(item.href))} className="mb-2">
                <CollapsibleTrigger className="w-full">
                    <div className="flex w-full items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">{section.title}</span>
                        <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="mt-2 flex flex-col gap-1">
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                                    isActive && 'bg-muted text-primary'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </CollapsibleContent>
             </Collapsible>
          ))}
        </nav>
      </div>
    </aside>
  );
}
