'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Deal, DealStage } from '@/types';
import { deals as initialDeals } from '@/lib/data';
import { useApp } from '@/context/app-context';
import { DollarSign, User } from 'lucide-react';
import { users } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    const assignedUser = users.find(u => u.name === deal.contactName);

    return (
        <Card className="mb-4 bg-card/80 backdrop-blur-sm hover:bg-card transition-colors">
            <CardContent className="p-4">
                <h3 className="font-semibold">{deal.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <DollarSign className="h-3 w-3"/>
                    {deal.value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                     <User className="h-3 w-3"/>
                    {deal.contactName}
                </p>
                <div className="mt-4 flex items-center justify-between">
                     <span className="text-xs text-muted-foreground">Close: {deal.closeDate}</span>
                     {assignedUser && (
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={assignedUser.avatar} />
                                        <AvatarFallback>{assignedUser.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{assignedUser.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                     )}
                </div>
            </CardContent>
        </Card>
    )
}

const KanbanColumn = ({ stage, deals }: { stage: DealStage; deals: Deal[] }) => {
  const stageTotalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div className="w-80 flex-shrink-0">
      <div className="flex flex-col h-full rounded-lg">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stageColors[stage]}`} />
            <h2 className="font-semibold">{stage}</h2>
            <Badge variant="secondary">{deals.length}</Badge>
          </div>
          <span className="text-sm font-medium text-muted-foreground">${stageTotalValue.toLocaleString()}</span>
        </div>
        <div className="flex-1 p-4 pt-0 overflow-y-auto">
            {deals.map(deal => (
                <DealCard key={deal.id} deal={deal} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default function KanbanBoard() {
  return (
    <div className="flex-1 flex overflow-x-auto h-[calc(100vh-150px)]">
      <div className="flex space-x-4 p-4">
        {stages.map(stage => {
          const dealsInStage = initialDeals.filter(deal => deal.stage === stage);
          return <KanbanColumn key={stage} stage={stage} deals={dealsInStage} />;
        })}
      </div>
    </div>
  );
}
