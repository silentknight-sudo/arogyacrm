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
import { Textarea } from '@/components/ui/textarea';
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
import { createTicket } from './actions';
import { useApp } from '@/context/app-context';
import type { Contact, UserProfile } from '@/types';

const ticketStatuses = ['Open', 'In Progress', 'Awaiting Customer', 'Resolved', 'Closed'] as const;
const ticketPriorities = ['Low', 'Medium', 'High', 'Urgent'] as const;
const ticketCategories = ['Technical Support', 'Billing Inquiry', 'Product Information', 'Complaint', 'Other'];

const formSchema = z.object({
    subject: z.string().min(5, 'Subject must be at least 5 characters.'),
    description: z.string().min(10, 'Description must be at least 10 characters.'),
    category: z.string().min(1, 'Category is required.'),
    status: z.enum(ticketStatuses),
    priority: z.enum(ticketPriorities),
    contactId: z.string().min(1, 'Contact is required.'),
    assignedToId: z.string().min(1, 'Must be assigned to a specialist.'),
});

type CreateTicketDialogProps = {
  children: React.ReactNode;
  contacts: Contact[];
  users: UserProfile[];
  isLoading: boolean;
};

export function CreateTicketDialog({ children, contacts, users, isLoading }: CreateTicketDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      description: '',
      status: 'Open',
      priority: 'Medium',
      assignedToId: currentUser?.id || '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
        toast({ variant: 'destructive', title: 'Error', description: 'Active workspace context required.' });
        return;
    }
    startTransition(async () => {
      const result = await createTicket({
          ...values,
          teamspaceId: currentTeamspace.id,
      });

      if (result.success) {
        toast({
          title: 'Support Ticket Registered',
          description: `Successfully opened ticket for "${values.subject}".`,
        });
        setOpen(false);
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Secure Creation Failed',
          description: result.error,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">New Stakeholder Ticket</DialogTitle>
          <DialogDescription>
            Log a new individual inquiry or service request.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] pr-4 pt-2">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="subject" render={({ field }) => (
                    <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g. Guidance on dosage" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contactId" render={({ field }) => (
                    <FormItem><FormLabel>Stakeholder Contact</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoading}><SelectValue placeholder="Select contact" /></SelectTrigger></FormControl><SelectContent>{contacts.length > 0 ? contacts.map(c => (<SelectItem key={c.id} value={c.id}>{`${c.firstName} ${c.lastName}`}</SelectItem>)) : <div className="p-2 text-sm text-muted-foreground text-center">No contacts found.</div>}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Issue Context</FormLabel><FormControl><Textarea className="min-h-[100px] rounded-xl" placeholder="Detailed description of the stakeholder's request..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Inquiry Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent>{ticketCategories.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>Process Stage</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{ticketStatuses.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="priority" render={({ field }) => (
                        <FormItem><FormLabel>Urgency Level</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{ticketPriorities.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="assignedToId" render={({ field }) => (
                    <FormItem><FormLabel>Assign Specialist</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoading}><SelectValue placeholder="Select specialist" /></SelectTrigger></FormControl><SelectContent>{users.length > 0 ? users.map(u => (<SelectItem key={u.id} value={u.id}>{u.displayName}</SelectItem>)) : <div className="p-2 text-sm text-muted-foreground text-center">No specialists found.</div>}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isPending || isLoading} className="w-full h-12 rounded-xl herbal-gradient font-bold shadow-lg mt-2">
                    {isPending ? 'Initiating Ticket...' : 'Register Support Ticket'}
                </Button>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
