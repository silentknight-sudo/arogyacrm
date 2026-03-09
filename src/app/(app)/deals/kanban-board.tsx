'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Deal, DealStage, Contact } from '@/types';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { useApp } from '@/context/app-context';
import { doc, collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Calendar, ArrowRight, Wallet, PackageCheck, Phone, Tag, Loader2, Layers } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { updateDealType, updateDealStage } from './actions';
import { useToast } from '@/hooks/use-toast';

const stages: DealStage[] = ['pending', 'not connect', 'busy', 'done', 'cancel'];
const dealTypes = ['Wellness Package', 'Single Order', 'Subscription', 'Bulk Order', 'Retail'] as const;

const stageColors: Record<DealStage, string> = {
  pending: 'bg-blue-500',
  'not connect': 'bg-slate-500',
  busy: 'bg-amber-500',
  done: 'bg-green-500',
  cancel: 'bg-red-500',
};

const ViewDealDialog = ({ deal, open, onOpenChange }: { deal: Deal | null; open: boolean; onOpenChange: (open: boolean) => void }) => {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { currentTeamspace } = useApp();
  const [isUpdating, startTransition] = useTransition();

  const contactRef = useMemoFirebase(() => 
    deal?.contactId && currentTeamspace ? doc(firestore, 'teamspaces', currentTeamspace.id, 'contacts', deal.contactId) : null
  , [firestore, currentTeamspace, deal?.contactId]);
  const { data: contact, isLoading: isLoadingContact } = useDoc<Contact>(contactRef);

  const handleTypeUpdate = (newType: string) => {
    if (!deal || !currentTeamspace) return;
    startTransition(async () => {
        const result = await updateDealType({
            dealId: deal.id,
            teamspaceId: currentTeamspace.id,
            type: newType
        });
        if (result.success) {
            toast({ title: 'Deal Category Updated', description: `Category changed to ${newType}.` });
        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
        }
    });
  };

  const handleStageUpdate = (newStage: string) => {
    if (!deal || !currentTeamspace) return;
    startTransition(async () => {
        const result = await updateDealStage({
            dealId: deal.id,
            teamspaceId: currentTeamspace.id,
            stage: newStage as DealStage
        });
        if (result.success) {
            toast({ title: 'Deal Stage Updated', description: `Status changed to ${newStage}.` });
        } else {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.error });
        }
    });
  };

  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl rounded-[2.5rem] border-none bg-card/95 backdrop-blur-3xl shadow-2xl p-0 overflow-hidden">
        <div className="herbal-gradient p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-white/60 font-medium">
                    <Layers className="h-4 w-4 text-accent" />
                    Status: 
                    <Select disabled={isUpdating} defaultValue={deal.stage} onValueChange={handleStageUpdate}>
                        <SelectTrigger className="h-8 bg-white/10 border-white/20 rounded-lg text-xs font-bold text-white w-40">
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {stages.map(s => <SelectItem key={s} value={s} className="text-xs uppercase font-bold">{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Strategic Deal Insight</div>
          </div>
          <DialogTitle className="text-4xl font-black tracking-tighter mb-2 leading-tight">{deal.name}</DialogTitle>
          <div className="flex flex-wrap items-center gap-6 mt-4">
            <p className="text-white/60 font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4 text-accent" />
                Projected Value: <span className="text-white font-bold">₹{deal.amount.toLocaleString('en-IN')}</span>
            </p>
            <div className="flex items-center gap-2 text-white/60 font-medium">
                <Tag className="h-4 w-4 text-accent" />
                Category: 
                <Select disabled={isUpdating} defaultValue={deal.type} onValueChange={handleTypeUpdate}>
                    <SelectTrigger className="h-8 bg-white/10 border-white/20 rounded-lg text-xs font-bold text-white w-40">
                        {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {dealTypes.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh] p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Stakeholder Intelligence</p>
                {isLoadingContact ? (
                    <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-muted/20 border border-primary/5 shadow-inner">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full herbal-gradient flex items-center justify-center text-sm font-black shadow-lg text-white">
                                {contact?.firstName?.[0]}{contact?.lastName?.[0]}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-black text-primary tracking-tight">{contact?.firstName} {contact?.lastName}</span>
                                <span className="text-xs font-medium text-muted-foreground">{contact?.email}</span>
                            </div>
                        </div>
                        {contact?.phone && (
                            <div className="flex items-center gap-2 text-primary font-bold text-sm bg-primary/5 p-2 rounded-xl border border-primary/10">
                                <Phone className="h-3.5 w-3.5" />
                                {contact.phone}
                            </div>
                        )}
                    </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Timeline Alignment</p>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/20 border border-primary/5">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="font-black text-primary tracking-tight">
                            {new Date(deal.closeDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </span>
                    </div>
                </div>
                
                <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10">
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2">Deal Velocity</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-primary">₹{(deal.amount / 1000).toFixed(1)}k</span>
                        <span className="text-xs font-bold text-muted-foreground italic">Target.</span>
                    </div>
                </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-primary flex items-center gap-2">
                <PackageCheck className="h-5 w-5" />
                Product Configuration
              </h4>
              <Badge variant="secondary" className="rounded-full font-black text-[10px] uppercase px-3 py-1">
                {deal.lineItems?.length || 0} Ayurvedic Items
              </Badge>
            </div>

            <div className="rounded-[2rem] border border-primary/5 bg-muted/20 p-6 space-y-4 shadow-inner">
              {deal.lineItems?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="space-y-0.5">
                    <p className="font-black text-primary text-sm group-hover:translate-x-1 transition-transform">{item.productName}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                      {item.quantity} units @ ₹{item.unitPrice.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <p className="font-black text-primary/80">₹{item.subtotal.toLocaleString('en-IN')}</p>
                </div>
              ))}
              {(!deal.lineItems || deal.lineItems.length === 0) && (
                <p className="text-center py-10 text-muted-foreground text-xs italic font-medium">No products associated with this opportunity.</p>
              )}
              <Separator className="bg-primary/5" />
              <div className="flex justify-end items-center gap-4 pt-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Aggregate Total</span>
                <span className="text-2xl font-black text-primary tracking-tighter">₹{deal.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-8 pt-0 flex justify-end">
          <button 
            onClick={() => onOpenChange(false)}
            className="px-8 py-4 rounded-2xl bg-muted font-black text-xs uppercase tracking-widest hover:bg-muted/80 transition-colors shadow-sm"
          >
            Exit Strategy View
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DealCard = ({ deal, onClick }: { deal: Deal; onClick: () => void }) => {
    const itemCount = Array.isArray(deal.lineItems) ? deal.lineItems.length : 0;
    
    return (
        <Card 
          onClick={onClick}
          className="mb-4 bg-card/80 backdrop-blur-sm hover:bg-card transition-all hover:shadow-2xl rounded-2xl border-primary/5 group cursor-pointer active:scale-95 border-2 hover:border-primary/10"
        >
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-foreground group-hover:text-primary transition-colors leading-tight">{deal.name}</h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <p className="text-xl font-black text-primary/90 mt-2 tracking-tighter">
                    ₹{deal.amount.toLocaleString('en-IN')}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-4">
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/10 bg-primary/5 px-2 py-0.5">
                        {deal.type || 'Standard'}
                    </Badge>
                    {itemCount > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-muted/50 rounded-lg shadow-inner">
                            <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tight">
                                {itemCount} Items
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

const KanbanColumn = ({ stage, deals, isLoading, onDealClick }: { stage: DealStage; deals: Deal[], isLoading: boolean, onDealClick: (deal: Deal) => void }) => {
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
                <DealCard key={deal.id} deal={deal} onClick={() => onDealClick(deal)} />
            ))}
             {!isLoading && deals.length === 0 && (
                <div className="text-center text-muted-foreground text-xs font-black pt-16 opacity-30 uppercase tracking-[0.3em]">Empty Stage</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default function KanbanBoard() {
  const { currentTeamspace, isUserLoading, areTeamspacesLoading } = useApp();
  const firestore = useFirestore();
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: deals, isLoading: isLoadingDeals } = useCollection<Deal>(
    useMemoFirebase(() => 
      !isUserLoading && !areTeamspacesLoading && currentTeamspace
        ? collection(firestore, 'teamspaces', currentTeamspace.id, 'deals')
        : null
    , [firestore, currentTeamspace, isUserLoading, areTeamspacesLoading])
  );

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsDetailOpen(true);
  };

  const displayLoading = isLoadingDeals || isUserLoading || areTeamspacesLoading;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-240px)]">
      <ViewDealDialog 
        deal={selectedDeal} 
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen} 
      />
      <div className="flex-1 flex overflow-x-auto scrollbar-hide">
        <div className="flex space-x-8 p-8">
          {stages.map(stage => {
            const dealsInStage = displayLoading || !deals ? [] : deals.filter(deal => deal.stage === stage);
            return (
              <KanbanColumn 
                key={stage} 
                stage={stage} 
                deals={dealsInStage} 
                isLoading={displayLoading} 
                onDealClick={handleDealClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
