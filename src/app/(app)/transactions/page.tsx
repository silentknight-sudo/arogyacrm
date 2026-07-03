'use client';

import Link from 'next/link';
import { collection, query } from 'firebase/firestore';
import { Receipt, ShoppingCart, FileText } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Invoice, SalesOrder, Quote } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TransactionsPage() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const invoicesQuery = useMemoFirebase(() => currentTeamspace?.id ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'invoices')) : null, [firestore, currentTeamspace?.id]);
  const salesOrdersQuery = useMemoFirebase(() => currentTeamspace?.id ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'salesOrders')) : null, [firestore, currentTeamspace?.id]);
  const quotesQuery = useMemoFirebase(() => currentTeamspace?.id ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'quotes')) : null, [firestore, currentTeamspace?.id]);

  const { data: invoices } = useCollection<Invoice>(invoicesQuery);
  const { data: salesOrders } = useCollection<SalesOrder>(salesOrdersQuery);
  const { data: quotes } = useCollection<Quote>(quotesQuery);

  const cards = [
    { title: 'Invoices', value: invoices?.length || 0, icon: Receipt, href: '/inventory/invoices' },
    { title: 'Sales Orders', value: salesOrders?.length || 0, icon: ShoppingCart, href: '/inventory/sales-orders' },
    { title: 'Quotes', value: quotes?.length || 0, icon: FileText, href: '/inventory/quotes' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-primary">Transactions</h1>
        <p className="text-muted-foreground font-medium">Quick access to billing, orders, and quote records.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="rounded-[2rem] border-primary/10">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-black">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-5xl font-black text-primary">{card.value}</p>
                <Button asChild variant="outline" className="w-full rounded-2xl">
                  <Link href={card.href}>View {card.title}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
