'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Deal, DealStage } from '@/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useApp } from '@/context/app-context';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

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
    return (
        <Card className="mb-4 bg-card/80 backdrop-blur-sm hover:bg-card transition-colors">
            <CardContent className="p-4">
                <h3 className="font-semibold">{deal.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <span>₹</span>
                    {deal.amount.toLocaleString('en-IN')}
                </p>
                <div className="mt-4 flex items-center justify-between">
                     <span className="text-xs text-muted-foreground">Close: {new Date(deal.closeDate).toLocaleDateString()}</span>
                </div>
            </CardContent>
        </Card>
    )
}

const KanbanColumn = ({ stage, deals, isLoading }: { stage: DealStage; deals: Deal[], isLoading: boolean }) => {
  const stageTotalValue = deals.reduce((sum, deal) => sum + deal.amount, 0);

  return (
    <div className="w-80 flex-shrink-0">
      <div className="flex flex-col h-full rounded-lg">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stageColors[stage]}`} />
            <h2 className="font-semibold">{stage}</h2>
            <Badge variant="secondary">{isLoading ? '...' : deals.length}</Badge>
          </div>
          <span className="text-sm font-medium text-muted-foreground">₹{stageTotalValue.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex-1 p-4 pt-0 overflow-y-auto">
            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            )}
            {!isLoading && deals.map(deal => (
                <DealCard key={deal.id} deal={deal} />
            ))}
             {!isLoading && deals.length === 0 && (
                <div className="text-center text-muted-foreground text-sm pt-8">No deals in this stage.</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default function KanbanBoard() {
  const { currentTeamspace } = useApp();
  const firestore = useFirestore();

  const dealsQuery = useMemoFirebase(() =>
    currentTeamspace
      ? query(collection(firestore, 'teamspaces', currentTeamspace.id, 'deals'))
      : null
  , [firestore, currentTeamspace]);
  
  const { data: deals, isLoading } = useCollection<Deal>(dealsQuery);

  return (
    <div className="flex-1 flex overflow-x-auto h-[calc(100vh-150px)]">
      <div className="flex space-x-4 p-4">
        {stages.map(stage => {
          const dealsInStage = deals ? deals.filter(deal => deal.stage === stage) : [];
          return <KanbanColumn key={stage} stage={stage} deals={dealsInStage} isLoading={isLoading} />;
        })}
      </div>
    </div>
  );
}
