'use client';

import { useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { assignLead } from './actions';
import { useApp } from '@/context/app-context';
import type { Lead, UserProfile } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  assignedToIds: z.array(z.string()).min(1, 'You must select at least one user.'),
});

type AssignLeadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  users: UserProfile[];
};

export function AssignLeadDialog({ open, onOpenChange, lead, users }: AssignLeadDialogProps) {
  const { toast } = useToast();
  const { currentUser } = useApp();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignedToIds: lead.assignedToIds || [],
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
        newAssignedToIds: values.assignedToIds,
        currentUserId: currentUser.id,
      });

      if (result.success) {
        toast({
          title: 'Lead Assigned',
          description: `Lead "${lead.fullName}" has been assigned.`,
        });
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Lead: {lead.fullName}</DialogTitle>
          <DialogDescription>Select one or more users to assign this lead to.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assignedToIds"
              render={() => (
                <FormItem>
                  <FormLabel>Team Members</FormLabel>
                  <ScrollArea className="h-40 rounded-md border p-4">
                    {users.map((user) => (
                      <FormField
                        key={user.id}
                        control={form.control}
                        name="assignedToIds"
                        render={({ field }) => (
                          <FormItem
                            className="flex flex-row items-start space-x-3 space-y-0 mb-3"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(user.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), user.id])
                                    : field.onChange(
                                        (field.value || []).filter(
                                          (value) => value !== user.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {user.displayName}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Assigning...' : 'Update Assignment'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
