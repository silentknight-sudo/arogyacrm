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
} from '../../../components/ui/alert-dialog';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../hooks/use-toast';
import { resetAllData } from './actions';
import { useApp } from '../../../context/app-context';
import { Loader2 } from 'lucide-react';

export function ResetDataButton() {
  const { toast } = useToast();
  const { currentUser } = useApp();
  const [isPending, startTransition] = useTransition();

  const handleReset = () => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    startTransition(async () => {
      const result = await resetAllData(currentUser.id);
      if (result.success) {
        toast({
          title: 'Data Reset Successful',
          description: 'All transactional data has been cleared.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Data Reset Failed',
          description: result.error,
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset All CRM Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete all leads,
            contacts, deals, products, and other transactional data from all
            teamspaces. User and Teamspace records will not be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset} disabled={isPending}>
            {isPending ? 'Resetting...' : 'Yes, reset everything'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
