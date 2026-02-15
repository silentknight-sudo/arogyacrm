
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createContact } from './actions';
import { useApp } from '@/context/app-context';
import type { Account } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().optional(),
  accountId: z.string().min(1, 'Account is required.'),
});

type CreateContactDialogProps = {
  children: React.ReactNode;
  accounts: Account[];
  isLoadingAccounts: boolean;
};

export function CreateContactDialog({ children, accounts, isLoadingAccounts }: CreateContactDialogProps) {
  const { toast } = useToast();
  const { currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      accountId: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentTeamspace) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be in a teamspace to create a contact.' });
        return;
    }
    setIsSubmitting(true);
    const result = await createContact({
        ...values,
        teamspaceId: currentTeamspace.id,
    });

    if (result.success) {
      toast({
        title: 'Contact Created',
        description: `Successfully created contact "${values.firstName} ${values.lastName}".`,
      });
      setOpen(false);
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Creating Contact',
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
          <DialogTitle>Create New Contact</DialogTitle>
          <DialogDescription>
            Fill out the form to add a new contact.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] pr-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="Jane" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="jane.doe@acme.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input placeholder="+1-202-555-0149" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="accountId" render={({ field }) => (
                    <FormItem><FormLabel>Account</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger disabled={isLoadingAccounts}>
                                    <SelectValue placeholder={isLoadingAccounts ? 'Loading accounts...' : 'Select an account'} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {isLoadingAccounts ? (
                                    <div className="p-2">Loading...</div>
                                ) : accounts.length > 0 ? (
                                    accounts.map(account => (
                                        <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-sm text-muted-foreground">No accounts found.</div>
                                )}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting || isLoadingAccounts || accounts.length === 0} className="w-full">
                    {isSubmitting ? 'Creating Contact...' : 'Create Contact'}
                </Button>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
