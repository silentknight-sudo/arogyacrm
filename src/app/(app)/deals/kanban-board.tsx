'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Deal, DealStage } from '@/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useApp } from '@/context/app-context';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Calendar, ArrowRight } from 'lucide-react';

const stages: DealStage[] = ['pending', 'not connect', 'busy', 'done', 'cancel'];

const stageColors: Record<DealStage, string> = {
  pending: 'bg-blue-500',
  'not connect': 'bg-slate-500',
  busy: 'bg-amber-500',
  done: 'bg-green-500',
  cancel: 'bg-red-500',
};


const DealCard = ({ deal }: { deal: Deal }) => {
    const itemCount = Array.isArray(deal.lineItems) ? deal.lineItems.length : 0;
    
    return (
        <Card className="mb-4 bg-card/80 backdrop-blur-sm hover:bg-card transition-all hover:shadow-2xl rounded-2xl border-primary/5 group cursor-pointer active:scale-95">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-foreground group-hover:text-primary transition-colors leading-tight">{deal.name}</h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <p className="text-xl font-black text-primary/90 mt-2 tracking-tighter">
                    ₹{deal.amount.toLocaleString('en-IN')}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-4">
                    {itemCount > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 rounded-lg border border-primary/10 shadow-inner">
                            <ShoppingBag className="h-3 w-3 text-primary/60" />
                            <span className="text-[10px] text-primary/70 font-black uppercase tracking-tight">
                                {itemCount} {itemCount === 1 ? 'Product' : 'Products'}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 rounded-lg border border-border/50">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {new Date(deal.closeDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const KanbanColumn = ({ stage, deals, isLoading }: { stage: DealStage; deals: Deal[], isLoading: boolean }) => {
  const stageTotalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);

  return (
    <div className="w-80 flex-shrink-0">
      <div className="flex flex-col h-full rounded-[2.5rem] bg-muted/20 p-2 shadow-inner border border-primary/5">
        <div className="p-5 flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${stageColors[stage]} shadow-lg animate-pulse`} />
            <h2 className="font-black text-primary tracking-tighter uppercase text-sm">{stage}</h2>
            <Badge variant="secondary" className="rounded-full bg-white/80 text-[10px] font-black border-none shadow-sm">{isLoading ? '...' : deals.length}</Badge>
          </div>
          <span className="text-[11px] font-black text-primary/40 uppercase tracking-tighter">₹{stageTotalValue.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex-1 p-3 pt-0 overflow-y-auto scrollbar-hide">
            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full rounded-[2rem]" />
                    <Skeleton className="h-32 w-full rounded-[2rem]" />
                </div>
            )}
            {!isLoading && deals.map(deal => (
                <DealCard key={deal.id} deal={deal} />
            ))}
             {!isLoading && deals.length === 0 && (
                <div className="text-center text-muted-foreground text-xs font-black pt-16 opacity-30 uppercase tracking-[0.2em]">Empty Stage</div>
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
    <div className="flex-1 flex overflow-x-auto h-[calc(100vh-240px)] scrollbar-hide">
      <div className="flex space-x-8 p-8">
        {stages.map(stage => {
          const dealsInStage = displayLoading || !deals ? [] : deals.filter(deal => deal.stage === stage);
          return <KanbanColumn key={stage} stage={stage} deals={dealsInStage} isLoading={displayLoading} />;
        })}
      </div>
    </div>
  );
}
