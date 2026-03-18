'use client';

import { useState, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cleanupDuplicateLeads } from './actions';
import { useApp } from '@/context/app-context';
import { ShieldAlert, Loader2, Sparkles } from 'lucide-react';

export function DeduplicateLeadsDialog() {
  const { toast } = useToast();
  const { currentTeamspace } = useApp();
  const [isPending, startTransition] = useTransition();

  const handleCleanup = () => {
    if (!currentTeamspace) return;

    startTransition(async () => {
      const result = await cleanupDuplicateLeads(currentTeamspace.id);
      if (result.success) {
        toast({
          title: 'Database Optimized',
          description: result.removedCount === 0 
            ? 'No duplicates found. Your database is healthy.' 
            : `Successfully purged ${result.removedCount} duplicate records.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Optimization Failed',
          description: result.error,
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="rounded-2xl border-accent/20 hover:bg-accent/5 px-8 py-7 font-black tracking-tight text-base shadow-sm group">
          <ShieldAlert className="mr-3 h-5 w-5 text-accent group-hover:animate-pulse" />
          Purge Duplicates
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl bg-[#0D1F0B] text-white">
        <AlertDialogHeader className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-accent rounded-2xl shadow-xl shadow-accent/20">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
            <AlertDialogTitle className="text-3xl font-black tracking-tight text-[#4ade80]">Strategic Cleanup</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-lg font-medium text-white/60">
            This operation will scan your entire prospect database for duplicate phone numbers.
            <br /><br />
            <span className="text-[#fbbf24] font-bold">Only the earliest record for each number will be preserved.</span> All other duplicates will be permanently purged.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-4">
          <AlertDialogCancel disabled={isPending} className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 h-14 px-8 font-bold">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCleanup} 
            disabled={isPending}
            className="rounded-xl herbal-gradient shadow-2xl h-14 px-10 font-black gold-glow"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Database...
              </>
            ) : 'Initiate Purge'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
