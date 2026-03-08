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
import { Label } from '@/components/ui/label';
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
  const { currentUser, currentTeamspace } = useApp();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignedToIds: lead.assignedToIds || [],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'Session expired. Please log in again.' });
      return;
    }
    startTransition(async () => {
      const result = await assignLead({
        leadId: lead.id,
        teamspaceId: currentTeamspace.id, // Use reliable ID from context
        newAssignedToIds: values.assignedToIds,
        currentUserId: currentUser.id,
      });

      if (result.success) {
        toast({
          title: 'Lead Assigned',
          description: `Successfully updated assignments for ${lead.fullName}.`,
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
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Assign Lead: {lead.fullName}</DialogTitle>
          <DialogDescription>Select the specialists who will nurture this prospect.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="assignedToIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Team Members</FormLabel>
                  <ScrollArea className="h-56 rounded-2xl border bg-muted/20 p-4">
                    <div className="space-y-4">
                    {users.length > 0 ? users.map((user) => (
                      <div key={user.id} className="flex flex-row items-center space-x-3 space-y-0 group">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={field.value?.includes(user.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), user.id])
                              : field.onChange(
                                  field.value?.filter((value: string) => value !== user.id)
                                )
                          }}
                          className="rounded-full h-5 w-5"
                        />
                        <Label htmlFor={`user-${user.id}`} className="text-sm font-semibold cursor-pointer group-hover:text-primary transition-colors">
                          {user.displayName}
                          <span className="ml-2 text-[10px] text-muted-foreground uppercase">{user.role.replace(/_/g, ' ')}</span>
                        </Label>
                      </div>
                    )) : (
                        <div className="text-center text-sm text-muted-foreground py-8">No team members found in this workspace.</div>
                    )}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending || users.length === 0} className="w-full h-12 text-lg rounded-xl herbal-gradient shadow-xl shadow-primary/20">
              {isPending ? 'Processing...' : 'Save Assignments'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
