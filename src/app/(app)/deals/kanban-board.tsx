'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Deal, DealStage } from '@/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useApp } from '@/context/app-context';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag } from 'lucide-react';

const stages: DealStage[] = [
  'New',
  'Contacted',
  'Qualified',
  'Demo',
  'Negotiation',
  'Won',
  'Lost',
];

const stageColors: Record<DealStage, string> = {
  New: 'bg-blue-500',
  Contacted: 'bg-cyan-500',
  Qualified: 'bg-teal-500',
  Demo: 'bg-indigo-500',
  Negotiation: 'bg-purple-500',
  Won: 'bg-green-500',
  Lost: 'bg-red-500',
};


const DealCard = ({ deal }: { deal: Deal }) => {
    const itemCount = deal.lineItems?.length || 0;
    return (
        <Card className="mb-4 bg-card/80 backdrop-blur-sm hover:bg-card transition-all hover:shadow-xl rounded-2xl border-primary/5 group">
            <CardContent className="p-4">
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{deal.name}</h3>
                <p className="text-lg font-black text-primary/80 mt-1">
                    ₹{deal.amount.toLocaleString('en-IN')}
                </p>
                
                {itemCount > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 px-2 py-1 bg-primary/5 rounded-lg w-fit">
                        <ShoppingBag className="h-3 w-3 text-primary/60" />
                        <span className="text-[10px] text-primary/60 font-black uppercase tracking-tight">
                            {itemCount} {itemCount === 1 ? 'Product' : 'Products'}
                        </span>
                    </div>
                )}

                <div className="mt-4 pt-3 border-t border-dashed flex items-center justify-between">
                     <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Close: {new Date(deal.closeDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                     </span>
                </div>
            </CardContent>
        </Card>
    )
}

const KanbanColumn = ({ stage, deals, isLoading }: { stage: DealStage; deals: Deal[], isLoading: boolean }) => {
  const stageTotalValue = deals.reduce((sum, deal) => sum + deal.amount, 0);

  return (
    <div className="w-80 flex-shrink-0">
      <div className="flex flex-col h-full rounded-[2rem] bg-muted/20 p-2">
        <div className="p-4 flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${stageColors[stage]} shadow-lg`} />
            <h2 className="font-bold text-primary tracking-tight">{stage}</h2>
            <Badge variant="secondary" className="rounded-full bg-white/50 text-[10px]">{isLoading ? '...' : deals.length}</Badge>
          </div>
          <span className="text-[11px] font-black text-primary/40 uppercase tracking-tighter">₹{stageTotalValue.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex-1 p-2 pt-0 overflow-y-auto scrollbar-hide">
            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
            )}
            {!isLoading && deals.map(deal => (
                <DealCard key={deal.id} deal={deal} />
            ))}
             {!isLoading && deals.length === 0 && (
                <div className="text-center text-muted-foreground text-xs font-medium pt-12 opacity-50">Nothing in {stage}.</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default function KanbanBoard() {
  const { currentTeamspace, isUserLoading, areTeamspacesLoading } = useApp();
  const firestore = useFirestore();

  const dealsQuery = useMemoFirebase(() =>
    !isUserLoading && !areTeamspacesLoading && currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'deals'))
      : null
  , [firestore, currentTeamspace, isUserLoading, areTeamspacesLoading]);
  
  const { data: deals, isLoading: isLoadingDeals } = useCollection<Deal>(dealsQuery);

  const displayLoading = isLoadingDeals || isUserLoading || areTeamspacesLoading;

  return (
    <div className="flex-1 flex overflow-x-auto h-[calc(100vh-220px)] scrollbar-hide">
      <div className="flex space-x-6 p-6">
        {stages.map(stage => {
          const dealsInStage = displayLoading || !deals ? [] : deals.filter(deal => deal.stage === stage);
          return <KanbanColumn key={stage} stage={stage} deals={dealsInStage} isLoading={displayLoading} />;
        })}
      </div>
    </div>
  );
}
