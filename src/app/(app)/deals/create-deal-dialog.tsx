
'use client';

import { useState } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createDeal } from './actions';
import { useApp } from '@/context/app-context';
import type { DealStage, Account, Contact } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const dealStages: DealStage[] = ['New', 'Contacted', 'Qualified', 'Demo', 'Negotiation', 'Won', 'Lost'];

const formSchema = z.object({
  name: z.string().min(2, 'Deal name must be at least 2 characters.'),
  amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
  stage: z.enum(dealStages),
  closeDate: z.date({ required_error: 'Close date is required.' }),
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      amount: 0,
      stage: 'New',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace.' });
        return;
    }
    setIsSubmitting(true);
    const result = await createDeal({
        ...values,
        closeDate: values.closeDate.toISOString(),
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
    setIsSubmitting(false);
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
                    <FormItem><FormLabel>Account</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoading}><SelectValue placeholder={isLoading ? "Loading..." : "Select an account"} /></SelectTrigger></FormControl><SelectContent>{accounts.map(account => (<SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="contactId" render={({ field }) => (
                    <FormItem><FormLabel>Contact (Optional)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoading}><SelectValue placeholder={isLoading ? "Loading..." : "Select a contact"} /></SelectTrigger></FormControl><SelectContent>{contacts.map(contact => (<SelectItem key={contact.id} value={contact.id}>{`${contact.firstName} ${contact.lastName}`}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="stage" render={({ field }) => (
                    <FormItem><FormLabel>Stage</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a stage" /></SelectTrigger></FormControl><SelectContent>{dealStages.map(stage => (<SelectItem key={stage} value={stage}>{stage}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="closeDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Expected Close Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">
                    {isSubmitting ? 'Creating Deal...' : 'Create Deal'}
                </Button>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
