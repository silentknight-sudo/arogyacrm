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
import { getRoleLabel } from '@/lib/user-labels';
import { belongsToTeamLeadTeam } from '@/lib/team-membership';

const formSchema = z.object({
  assignedToIds: z.array(z.string()).min(1, 'Select at least one recipient.'),
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

  // HIERARCHICAL FILTERING:
  // Admin assigns ONLY to Team Leads. Team Leads assign ONLY to telecallers in their active teamspace.
  const filteredUsers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
      return users.filter(u => u.role === 'sales_team_lead');
    }
    if (currentUser.role === 'sales_team_lead') {
      return users.filter((u) => belongsToTeamLeadTeam(u, currentUser, currentTeamspace));
    }
    return [];
  }, [users, currentTeamspace, currentUser]);

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
      const result = await assignLead({
        leadId: lead.id,
        teamspaceId: currentTeamspace.id, 
        newAssignedToIds: values.assignedToIds,
        currentUserId: currentUser.id,
      });

      if (result.success) {
        toast({ title: 'Lead Delegated', description: `Successfully updated assignment for ${lead.fullName}.` });
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

  const title = currentUser?.role === 'admin' ? 'Strategic Delegation (Admin)' : 'Team Distribution (TL)';
  const description = currentUser?.role === 'admin' 
    ? `Delegate ${lead.fullName} to a verified Team Leader.` 
    : `Assign ${lead.fullName} to a telecaller in your team.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-10 border border-border/60 bg-card text-card-foreground shadow-2xl">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-3xl font-black tracking-tight text-primary">{title}</DialogTitle>
          <DialogDescription className="text-lg font-medium text-muted-foreground">
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
                  <FormLabel className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground px-2">Authorized Recipients</FormLabel>
                  <ScrollArea className="h-72 rounded-[2rem] border border-border bg-muted/20 p-6 shadow-inner">
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
                          className="rounded-full h-6 w-6 border-2 border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor={`user-${user.id}`} className="text-sm font-bold cursor-pointer group-hover:text-primary transition-colors flex flex-col gap-0.5">
                          {user.displayName}
                          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.1em]">{getRoleLabel(user.role)}</span>
                        </Label>
                      </div>
                    )) : (
                        <div className="text-center text-sm text-muted-foreground font-medium py-16 italic px-4">
                          {currentUser?.role === 'admin' 
                            ? 'No Team Leaders available for global delegation.' 
                            : 'No telecallers found in this workspace.'}
                        </div>
                    )}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending || filteredUsers.length === 0} className="w-full h-16 text-lg font-black rounded-2xl herbal-gradient shadow-2xl shadow-[#2D5A27]/40 gold-glow hover:scale-[1.02] transition-transform">
              {isPending ? 'Processing Assignment...' : 'Confirm Pipeline Delegation'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
