'use client';

import { useTransition, useMemo } from 'react';
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
import { bulkAssignLeads } from './actions';
import { useApp } from '@/context/app-context';
import type { Lead, UserProfile } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  assignedToIds: z.array(z.string()).min(1, 'Select at least one authorized specialist.'),
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

  // HIERARCHICAL FILTERING:
  // Admin assigns ONLY to Team Leads. Team Leads assign ONLY to Executives they created.
  const filteredUsers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
      return users.filter(u => u.role === 'sales_team_lead');
    }
    if (currentUser.role === 'sales_team_lead') {
      const createdExecutives = users.filter(u => u.role === 'sales_executive' && u.createdBy === currentUser.id);
      if (createdExecutives.length > 0) return createdExecutives;
      return users.filter(u => u.role === 'sales_executive');
    }
    return [];
  }, [users, currentUser]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignedToIds: [],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Active session required.' });
      return;
    }
    if (leads.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'No prospects selected.' });
        return;
    }
    
    startTransition(async () => {
      // For TLs, ensure they stay assigned for oversight
      const finalIds = currentUser.role === 'sales_team_lead'
        ? Array.from(new Set([currentUser.id, ...values.assignedToIds]))
        : values.assignedToIds;

      const result = await bulkAssignLeads({
        leadIds: leads.map(l => l.id),
        teamspaceId: currentTeamspace.id,
        newAssignedToIds: finalIds,
        currentUserId: currentUser.id,
      });

      if (result.success) {
        toast({
          title: 'Batch Delegation Success',
          description: `${leads.length} prospects have been reassigned to your authorized team.`,
        });
        onOpenChange(false);
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Delegation Failed',
          description: result.error,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-primary">Bulk Pipeline Delegation</DialogTitle>
          <DialogDescription className="font-medium">
            Redistribute {leads.length} selected prospects to authorized specialists.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="assignedToIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Authorized Specialists</FormLabel>
                  <ScrollArea className="h-48 rounded-2xl border bg-muted/20 p-4">
                    <div className="space-y-4">
                    {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                      <div key={user.id} className="flex flex-row items-center space-x-3 space-y-0">
                        <Checkbox
                          id={`bulk-user-${user.id}`}
                          checked={field.value?.includes(user.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), user.id])
                              : field.onChange(field.value?.filter(v => v !== user.id))
                          }}
                          className="rounded-full h-5 w-5"
                        />
                        <Label htmlFor={`bulk-user-${user.id}`} className="text-sm font-bold cursor-pointer flex flex-col">
                          {user.displayName}
                          <span className="text-[9px] uppercase font-black text-muted-foreground">{user.role.replace(/_/g, ' ')}</span>
                        </Label>
                      </div>
                    )) : (
                        <div className="text-center text-xs text-muted-foreground py-8 italic">No sales executives available in this workspace.</div>
                    )}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending || filteredUsers.length === 0} className="w-full h-14 rounded-2xl herbal-gradient font-black shadow-xl">
              {isPending ? 'Processing Batch...' : `Assign ${leads.length} Strategic Assets`}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
