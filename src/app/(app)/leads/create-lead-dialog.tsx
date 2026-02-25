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
import { useApp } from '@/context/app-context';
import type { LeadStatus } from '@/types';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const leadStatuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Lost'];

const formSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  age: z.coerce.number().positive().int().optional(),
  phone: z.string().min(1, 'Phone number is required.'),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  status: z.enum(leadStatuses),
});

type CreateLeadDialogProps = {
  children: React.ReactNode;
};

export function CreateLeadDialog({ children }: CreateLeadDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      status: 'New',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace to create a lead.' });
        return;
    }
    startTransition(async () => {
      try {
        const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
        await addDoc(leadsRef, {
            ...values,
            assignedToId: currentUser.id,
            teamspaceId: currentTeamspace.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Lead Created',
          description: `Successfully created lead "${values.fullName}".`,
        });
        setOpen(false);
        form.reset();
      } catch (error: any) {
         console.error("Error creating lead: ", error);
         toast({
          variant: 'destructive',
          title: 'Error Creating Lead',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Fill out the form to add a new lead to your pipeline.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] pr-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+1 234 567 890" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email (Optional)</FormLabel><FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem><FormLabel>Age (Optional)</FormLabel><FormControl><Input type="number" placeholder="35" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{leadStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? 'Creating Lead...' : 'Create Lead'}
                </Button>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
