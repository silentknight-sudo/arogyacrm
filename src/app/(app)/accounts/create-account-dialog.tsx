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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createAccount } from './actions';
import { useApp } from '@/context/app-context';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  name: z.string().min(2, 'Account name must be at least 2 characters.'),
  industry: z.string().optional(),
  website: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type CreateAccountDialogProps = {
  children: React.ReactNode;
};

export function CreateAccountDialog({ children }: CreateAccountDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      industry: '',
      website: '',
      phone: '',
      address: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace to create an account.' });
        return;
    }
    
    startTransition(async () => {
        const result = await createAccount({
            ...values,
            ownerId: currentUser.id,
            teamspaceId: currentTeamspace.id,
        });

        if (result.success) {
        toast({
            title: 'Account Created',
            description: `Successfully created account "${values.name}".`,
        });
        setOpen(false);
        form.reset();
        } else {
        toast({
            variant: 'destructive',
            title: 'Error Creating Account',
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
          <DialogTitle>Create New Account</DialogTitle>
          <DialogDescription>
            Fill out the form to add a new account.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] pr-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Account Name</FormLabel><FormControl><Input placeholder="Acme Corporation" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="industry" render={({ field }) => (
                    <FormItem><FormLabel>Industry</FormLabel><FormControl><Input placeholder="Technology" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem><FormLabel>Website (Optional)</FormLabel><FormControl><Input placeholder="acme.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input placeholder="+1-202-555-0149" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address (Optional)</FormLabel><FormControl><Textarea placeholder="123 Main St, Anytown, USA" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? 'Creating Account...' : 'Create Account'}
                </Button>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
