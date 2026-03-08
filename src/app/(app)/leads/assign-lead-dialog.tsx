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
import { assignLead } from './actions';
import { useApp } from '@/context/app-context';
import type { Lead, UserProfile } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  assignedToIds: z.array(z.string()).min(1, 'Select at least one wellness specialist.'),
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

  // FILTERING LOGIC: Hierarchical Assignment
  // Admin assigns to Team Leads. Team Leads assign to Executives.
  const filteredUsers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
      return users.filter(u => u.role === 'sales_team_lead');
    }
    if (currentUser.role === 'sales_team_lead') {
      return users.filter(u => u.role === 'sales_executive');
    }
    return [];
  }, [users, currentUser]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignedToIds: lead.assignedToIds || [],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace?.id) {
      toast({ variant: 'destructive', title: 'Session Error', description: 'Active workspace required.' });
      return;
    }
    
    startTransition(async () => {
      // Logic for Team Leads: They keep themselves assigned but add the Executive
      const newIds = currentUser.role === 'sales_team_lead' 
        ? Array.from(new Set([currentUser.id, ...values.assignedToIds]))
        : values.assignedToIds;

      const result = await assignLead({
        leadId: lead.id,
        teamspaceId: currentTeamspace.id, 
        newAssignedToIds: newIds,
        currentUserId: currentUser.id,
      });

      if (result.success) {
        toast({ title: 'Lead Delegated', description: `Successfully updated specialists for ${lead.fullName}.` });
        onOpenChange(false);
      } else {
        toast({ 
          variant: 'destructive', 
          title: 'Assignment Failed', 
          description: result.error || 'Check your environment configuration.' 
        });
      }
    });
  };

  const title = currentUser?.role === 'admin' ? 'Assign to Team Lead' : 'Distribute to Executive';
  const description = currentUser?.role === 'admin' 
    ? `Select a Team Lead to manage ${lead.fullName}.` 
    : `Select a Sales Executive to handle ${lead.fullName}.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-10 border-none shadow-2xl bg-[#0D1F0B]/95 backdrop-blur-3xl text-white">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-3xl font-black tracking-tight text-[#4ade80]">{title}</DialogTitle>
          <DialogDescription className="text-lg font-medium text-white/60">
            {description}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            <FormField
              control={form.control}
              name="assignedToIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 px-2">Available Team Members</FormLabel>
                  <ScrollArea className="h-72 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-inner">
                    <div className="space-y-6">
                    {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                      <div key={user.id} className="flex flex-row items-center space-x-4 space-y-0 group">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={field.value?.includes(user.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), user.id])
                              : field.onChange(field.value?.filter(v => v !== user.id))
                          }}
                          className="rounded-full h-6 w-6 border-2 border-[#4ade80]/30 data-[state=checked]:bg-[#4ade80] data-[state=checked]:border-[#4ade80]"
                        />
                        <Label htmlFor={`user-${user.id}`} className="text-sm font-bold cursor-pointer group-hover:text-[#4ade80] transition-colors flex flex-col gap-0.5">
                          {user.displayName}
                          <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.1em]">{user.role.replace(/_/g, ' ')}</span>
                        </Label>
                      </div>
                    )) : (
                        <div className="text-center text-sm text-white/30 font-medium py-16 italic">
                          {currentUser?.role === 'admin' ? 'No Team Leads found in this workspace.' : 'No Sales Executives found in this workspace.'}
                        </div>
                    )}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending || filteredUsers.length === 0} className="w-full h-16 text-lg font-black rounded-2xl herbal-gradient shadow-2xl shadow-[#2D5A27]/40 gold-glow hover:scale-[1.02] transition-transform">
              {isPending ? 'Processing Delegation...' : 'Confirm Delegation'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
