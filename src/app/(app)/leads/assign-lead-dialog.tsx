'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { assignLead } from './actions';
import { useApp } from '@/context/app-context';
import type { Lead, UserProfile } from '@/types';

const formSchema = z.object({
  assignedToId: z.string().min(1, 'You must select a user to assign the lead to.'),
});

type AssignLeadDialogProps = {
  children: React.ReactNode;
  lead: Lead;
  users: UserProfile[];
};

export function AssignLeadDialog({ children, lead, users }: AssignLeadDialogProps) {
  const { toast } = useToast();
  const { currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignedToId: lead.assignedToId,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You are not authenticated.' });
      return;
    }
    startTransition(async () => {
      const result = await assignLead({
        leadId: lead.id,
        teamspaceId: lead.teamspaceId,
        newAssignedToId: values.assignedToId,
        currentUserId: currentUser.id,
      });

      if (result.success) {
        toast({
          title: 'Lead Assigned',
          description: `Lead "${lead.fullName}" has been assigned.`,
        });
        setOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Assignment Failed',
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
          <DialogTitle>Assign Lead: {lead.fullName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.displayName} ({user.role.replace(/_/g, ' ')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Assigning...' : 'Assign Lead'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
