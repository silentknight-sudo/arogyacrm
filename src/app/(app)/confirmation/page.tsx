'use client';

import Link from 'next/link';
import { ClipboardCheck, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const confirmationCards = [
  { title: 'Confirmation Process', description: 'Track confirmation workflow and customer validation.', icon: ClipboardCheck, href: '/leads?status=done' },
  { title: 'Item Performance', description: 'Review campaign/product confirmation outcomes.', icon: PackageCheck, href: '/campaigns' },
  { title: 'Done Leads', description: 'Open all completed leads ready for next processing.', icon: ShieldCheck, href: '/leads?status=done' },
  { title: 'Delivery Status', description: 'Use parcel search to validate customer and delivery details.', icon: Truck, href: '/parcel-search' },
];

export default function ConfirmationPage() {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-primary">Confirmation Management</h1>
        <p className="text-muted-foreground font-medium">Central workspace for lead confirmation and delivery checks.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {confirmationCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="rounded-[2rem] border-primary/10 shadow-sm">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-black">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm font-medium text-muted-foreground">{card.description}</p>
                <Button asChild variant="outline" className="w-full rounded-2xl">
                  <Link href={card.href}>View All</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
