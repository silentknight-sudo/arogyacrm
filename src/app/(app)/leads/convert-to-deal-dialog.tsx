'use client';

import { useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { convertAndCreateDeal } from './actions';
import { useApp } from '@/context/app-context';
import type { Lead } from '@/types';

const formSchema = z.object({
  dealName: z.string().min(2, 'Deal name must be at least 2 characters.'),
  dealAmount: z.coerce.number().min(0, 'Amount must be a positive number.'),
});

type ConvertToDealDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
};

export function ConvertToDealDialog({ open, onOpenChange, lead }: ConvertToDealDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dealName: `Opportunity: ${lead.fullName}`,
      dealAmount: 0,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'Session context not found.' });
      return;
    }
    
    startTransition(async () => {
      const result = await convertAndCreateDeal({
        leadId: lead.id,
        teamspaceId: currentTeamspace.id,
        currentUserId: currentUser.id,
        ...values,
      });

      if (result.success) {
        toast({ 
          title: 'Direct Conversion Successful', 
          description: `Contact and Deal created for ${lead.fullName}.` 
        });
        onOpenChange(false);
      } else {
        toast({ 
          variant: 'destructive', 
          title: 'Conversion Failed', 
          description: result.error 
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-10 border-none shadow-2xl bg-card text-foreground">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-black tracking-tight text-primary">Pipeline Conversion</DialogTitle>
          <DialogDescription className="text-lg font-medium text-muted-foreground">
            Instantly create a Contact and Deal from this prospect.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="dealName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Heading</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Bulk Ayurvedic Package" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dealAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Deal Value (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full h-16 text-lg font-black rounded-2xl herbal-gradient shadow-2xl shadow-primary/30 gold-glow hover:scale-[1.02] transition-transform mt-4">
              {isPending ? 'Processing Direct Conversion...' : 'Finalize Conversion'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
