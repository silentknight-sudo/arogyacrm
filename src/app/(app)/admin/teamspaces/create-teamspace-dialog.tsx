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
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { createTeamspace } from './actions';
import { useApp } from '@/context/app-context';


type FormValues = {
  name: string;
  description?: string;
};

type CreateTeamspaceDialogProps = {
  children: React.ReactNode;
};

export function CreateTeamspaceDialog({ children }: CreateTeamspaceDialogProps) {
  const { toast } = useToast();
  const { currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a teamspace.' });
        return;
    }
    startTransition(async () => {
        const result = await createTeamspace({ ...values, ownerId: currentUser.id });
        
        if (result.success) {
        toast({
            title: 'Teamspace Created',
            description: `Successfully created teamspace "${result.name}".`,
        });
        setOpen(false);
        form.reset();
        } else {
        toast({
            variant: 'destructive',
            title: 'Error Creating Teamspace',
            description: result.error,
        });
        }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Teamspace</DialogTitle>
          <DialogDescription>
            Create a new workspace for your teams to collaborate in.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teamspace Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Sales Team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A space for the sales department to manage leads and deals." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Creating...' : 'Create Teamspace'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}