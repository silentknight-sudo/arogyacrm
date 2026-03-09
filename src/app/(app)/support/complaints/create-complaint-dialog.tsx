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
import { createComplaint } from './actions';
import { useApp } from '@/context/app-context';
import type { Contact, UserProfile } from '@/types';
import { Textarea } from '@/components/ui/textarea';

const complaintStatuses = ['Received', 'Investigating', 'Action Taken', 'Resolved', 'Closed'] as const;
const complaintSeverities = ['Minor', 'Moderate', 'Major', 'Critical'] as const;

const formSchema = z.object({
    subject: z.string().min(5, 'Subject is required.'),
    description: z.string().min(10, 'Description is required.'),
    status: z.enum(complaintStatuses),
    contactId: z.string().min(1, 'Contact is required.'),
    assignedToId: z.string().min(1, 'Assigned user is required.'),
    severity: z.enum(complaintSeverities),
});

type CreateComplaintDialogProps = {
  children: React.ReactNode;
  contacts: Contact[];
  users: UserProfile[];
  isLoading: boolean;
};

export function CreateComplaintDialog({ children, contacts, users, isLoading }: CreateComplaintDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      description: '',
      status: 'Received',
      severity: 'Moderate',
      assignedToId: currentUser?.id || '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'Active workspace context required.' });
      return;
    }
    startTransition(async () => {
      const result = await createComplaint({
        ...values,
        teamspaceId: currentTeamspace.id,
      });

      if (result.success) {
        toast({
          title: 'Strategic Escalation Logged',
          description: `Successfully registered escalation for "${values.subject}".`,
        });
        setOpen(false);
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Secure Logging Failed',
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
          <DialogTitle className="text-2xl font-bold text-primary">New Stakeholder Escalation</DialogTitle>
          <DialogDescription>
            Document high-priority individual complaints for rapid resolution.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[70vh] pr-4 pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g. Shipping delay" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="contactId" render={({ field }) => (
                <FormItem><FormLabel>Affected Stakeholder</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoading}><SelectValue placeholder="Select contact" /></SelectTrigger></FormControl><SelectContent>{contacts.length > 0 ? contacts.map(c => (<SelectItem key={c.id} value={c.id}>{`${c.firstName} ${c.lastName}`}</SelectItem>)) : <div className="p-2 text-sm text-muted-foreground text-center">No contacts found.</div>}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Detailed Insight</FormLabel><FormControl><Textarea className="min-h-[100px] rounded-xl" placeholder="Full context of the stakeholder's concern..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Process Stage</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{complaintStatuses.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="severity" render={({ field }) => (
                    <FormItem><FormLabel>Severity Tier</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{complaintSeverities.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
              </div>
                <FormField control={form.control} name="assignedToId" render={({ field }) => (
                    <FormItem><FormLabel>Assign Resolution Lead</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoading}><SelectValue placeholder="Select specialist" /></SelectTrigger></FormControl><SelectContent>{users.length > 0 ? users.map(u => (<SelectItem key={u.id} value={u.id}>{u.displayName}</SelectItem>)) : <div className="p-2 text-sm text-muted-foreground text-center">No specialists found.</div>}</SelectContent></Select><FormMessage /></FormItem>
                )} />
              <Button type="submit" disabled={isPending || isLoading} className="w-full h-12 rounded-xl herbal-gradient font-bold shadow-lg mt-2">
                {isPending ? 'Processing Escalation...' : 'Log Stakeholder Escalation'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}