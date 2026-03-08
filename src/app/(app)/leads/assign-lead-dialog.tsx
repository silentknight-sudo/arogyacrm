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
  assignedToIds: z.array(z.string()).min(1, 'Select at least one team member.'),
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
      toast({ variant: 'destructive', title: 'Session Error', description: 'Authentication required.' });
      return;
    }
    
    startTransition(async () => {
      // CRITICAL: Use the reliable teamspace ID from context
      const result = await assignLead({
        leadId: lead.id,
        teamspaceId: currentTeamspace.id, 
        newAssignedToIds: values.assignedToIds,
        currentUserId: currentUser.id,
      });

      if (result.success) {
        toast({ title: 'Lead Assigned', description: `Successfully delegated ${lead.fullName}.` });
        onOpenChange(false);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-black tracking-tight text-primary">Assign Prospect</DialogTitle>
          <DialogDescription className="text-base font-medium">Delegate {lead.fullName} to your wellness specialists.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="assignedToIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">Team Selection</FormLabel>
                  <ScrollArea className="h-64 rounded-[2rem] border bg-muted/20 p-6 shadow-inner">
                    <div className="space-y-5">
                    {users.length > 0 ? users.map((user) => (
                      <div key={user.id} className="flex flex-row items-center space-x-4 space-y-0 group">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={field.value?.includes(user.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), user.id])
                              : field.onChange(field.value?.filter(v => v !== user.id))
                          }}
                          className="rounded-full h-6 w-6 border-2"
                        />
                        <Label htmlFor={`user-${user.id}`} className="text-sm font-bold cursor-pointer group-hover:text-primary transition-colors flex flex-col">
                          {user.displayName}
                          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{user.role.replace(/_/g, ' ')}</span>
                        </Label>
                      </div>
                    )) : (
                        <div className="text-center text-sm text-muted-foreground font-medium py-12">No eligible members found.</div>
                    )}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending || users.length === 0} className="w-full h-14 text-lg font-black rounded-2xl herbal-gradient shadow-2xl shadow-primary/30 gold-glow">
              {isPending ? 'Processing...' : 'Confirm Assignment'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
