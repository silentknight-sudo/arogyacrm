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
import type { Contact, UserProfile, ComplaintStatus, ComplaintSeverity } from '@/types';
import { Textarea } from '@/components/ui/textarea';

const complaintStatuses: ComplaintStatus[] = ['Received', 'Investigating', 'Action Taken', 'Resolved', 'Closed'];
const complaintSeverities: ComplaintSeverity[] = ['Minor', 'Moderate', 'Major', 'Critical'];

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
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace.' });
      return;
    }
    startTransition(async () => {
      const result = await createComplaint({
        ...values,
        teamspaceId: currentTeamspace.id,
      });

      if (result.success) {
        toast({
          title: 'Complaint Logged',
          description: `Successfully logged complaint "${values.subject}".`,
        });
        setOpen(false);
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Logging Complaint',
          description: result.error,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log a Complaint</DialogTitle>
          <DialogDescription>
            Document a customer complaint for tracking and resolution.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="Late delivery" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="contactId" render={({ field }) => (
                <FormItem><FormLabel>Contact</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoading}><SelectValue placeholder={isLoading ? "Loading..." : "Select a contact"} /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => (<SelectItem key={c.id} value={c.id}>{`${c.firstName} ${c.lastName}`}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Detailed description of the complaint..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{complaintStatuses.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="severity" render={({ field }) => (
                    <FormItem><FormLabel>Severity</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{complaintSeverities.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
              </div>
                <FormField control={form.control} name="assignedToId" render={({ field }) => (
                    <FormItem><FormLabel>Assign To</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoading}><SelectValue placeholder={isLoading ? "Loading..." : "Select a user"} /></SelectTrigger></FormControl><SelectContent>{users.map(u => (<SelectItem key={u.id} value={u.id}>{u.displayName}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
              <Button type="submit" disabled={isPending || isLoading} className="w-full">
                {isPending ? 'Logging...' : 'Log Complaint'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
