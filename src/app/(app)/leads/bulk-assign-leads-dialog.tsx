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
import { bulkAssignLeads } from './actions';
import { useApp } from '@/context/app-context';
import type { Lead, UserProfile } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  assignedToIds: z.array(z.string()).min(1, 'You must select at least one user.'),
});

type BulkAssignLeadsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  users: UserProfile[];
};

export function BulkAssignLeadsDialog({ open, onOpenChange, leads, users }: BulkAssignLeadsDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignedToIds: [],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'You are not authenticated.' });
      return;
    }
    if (leads.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'No leads selected.' });
        return;
    }
    startTransition(async () => {
      const result = await bulkAssignLeads({
        leadIds: leads.map(l => l.id),
        teamspaceId: currentTeamspace.id,
        newAssignedToIds: values.assignedToIds,
        currentUserId: currentUser.id,
      });

      if (result.success) {
        toast({
          title: 'Leads Assigned',
          description: `${leads.length} lead(s) have been assigned.`,
        });
        onOpenChange(false);
        form.reset();
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
          <DialogTitle>Assign {leads.length} Lead(s)</DialogTitle>
          <DialogDescription>Select one or more users to assign these leads to.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assignedToIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Members</FormLabel>
                  <ScrollArea className="h-40 rounded-md border p-4">
                    <div className="space-y-3">
                    {users.length > 0 ? users.map((user) => (
                      <div
                        key={user.id}
                        className="flex flex-row items-center space-x-3 space-y-0"
                      >
                        <Checkbox
                          id={`bulk-user-${user.id}`}
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
                        <label htmlFor={`bulk-user-${user.id}`} className="text-sm font-normal cursor-pointer ml-2">
                          {user.displayName}
                        </label>
                      </div>
                    )) : (
                        <div className="text-center text-sm text-muted-foreground py-4">No team members found.</div>
                    )}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending || users.length === 0} className="w-full">
              {isPending ? 'Assigning...' : `Assign ${leads.length} Lead(s)`}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}