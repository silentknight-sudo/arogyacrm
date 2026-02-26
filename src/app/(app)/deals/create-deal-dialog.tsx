'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createDeal } from './actions';
import { useApp } from '@/context/app-context';
import type { DealStage, Account, Contact } from '@/types';

const dealStages = ['New', 'Contacted', 'Qualified', 'Demo', 'Negotiation', 'Won', 'Lost'] as const;

const formSchema = z.object({
  name: z.string().min(2, 'Deal name must be at least 2 characters.'),
  amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
  stage: z.enum(dealStages),
  closeDate: z.string().min(1, 'Close date is required.'),
  accountId: z.string().min(1, 'Account is required.'),
  contactId: z.string().optional(),
});

type CreateDealDialogProps = {
  children: React.ReactNode;
  accounts: Account[];
  contacts: Contact[];
  isLoading: boolean;
};

export function CreateDealDialog({ children, accounts, contacts, isLoading }: CreateDealDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      amount: 0,
      stage: 'New',
      closeDate: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace.' });
        return;
    }
    startTransition(async () => {
      const date = new Date(values.closeDate);
      // Add a day to counteract timezone issues where new Date() creates a date at UTC midnight
      date.setDate(date.getDate() + 1);

      if (isNaN(date.getTime())) {
          toast({
              variant: 'destructive',
              title: 'Invalid Date',
              description: 'Please enter a valid date format (e.g., YYYY-MM-DD).',
          });
          return;
      }

      const result = await createDeal({
          ...values,
          closeDate: date.toISOString(),
          ownerId: currentUser.id,
          teamspaceId: currentTeamspace.id,
      });

      if (result.success) {
        toast({
          title: 'Deal Created',
          description: `Successfully created deal "${values.name}".`,
        });
        setOpen(false);
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Creating Deal',
          description: result.error,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
          <DialogDescription>
            Fill out the form to add a new deal to your sales pipeline.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] pr-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Deal Name</FormLabel><FormControl><Input placeholder="Q3 Enterprise Contract" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>Amount (₹)</FormLabel><FormControl><Input type="number" placeholder="25000" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="accountId" render={({ field }) => (
                    <FormItem><FormLabel>Account</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoading}><SelectValue placeholder={isLoading ? "Loading..." : "Select an account"} /></SelectTrigger></FormControl><SelectContent>{accounts.length > 0 ? accounts.map(account => (<SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)) : <div className="p-2 text-sm text-muted-foreground text-center">No accounts found.</div>}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="contactId" render={({ field }) => (
                    <FormItem><FormLabel>Contact (Optional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoading}><SelectValue placeholder={isLoading ? "Loading..." : "Select a contact"} /></SelectTrigger></FormControl><SelectContent>{contacts.length > 0 ? contacts.map(contact => (<SelectItem key={contact.id} value={contact.id}>{`${contact.firstName} ${contact.lastName}`}</SelectItem>)) : <div className="p-2 text-sm text-muted-foreground text-center">No contacts found.</div>}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="stage" render={({ field }) => (
                    <FormItem><FormLabel>Stage</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a stage" /></SelectTrigger></FormControl><SelectContent>{dealStages.map(stage => (<SelectItem key={stage} value={stage}>{stage}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField
                  control={form.control}
                  name="closeDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Close Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPending || isLoading} className="w-full">
                    {isPending ? 'Creating Deal...' : 'Create Deal'}
                </Button>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
