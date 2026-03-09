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
import { createContact } from './actions';
import { useApp } from '@/context/app-context';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().optional(),
});

type CreateContactDialogProps = {
  children: React.ReactNode;
};

export function CreateContactDialog({ children }: CreateContactDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
        toast({ variant: 'destructive', title: 'Error', description: 'Active workspace context required.' });
        return;
    }
    startTransition(async () => {
      const result = await createContact({
          ...values,
          teamspaceId: currentTeamspace.id,
          ownerId: currentUser.id,
      });

      if (result.success) {
        toast({
          title: 'Contact Secured',
          description: `Successfully created contact profile for "${values.firstName} ${values.lastName}".`,
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
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">New Stakeholder</DialogTitle>
          <DialogDescription>
            Register an individual wellness prospect or existing partner.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] pr-4 pt-2">
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
                    <FormItem><FormLabel>Primary Email</FormLabel><FormControl><Input type="email" placeholder="jane.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="+91 98765 43210" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl herbal-gradient font-bold shadow-lg">
                    {isPending ? 'Processing...' : 'Register Contact'}
                </Button>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}