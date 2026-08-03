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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { bulkAssignDeals } from './actions';
import { useApp } from '@/context/app-context';
import type { Deal, UserProfile } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRoleLabel } from '@/lib/user-labels';

const formSchema = z.object({
  newOwnerId: z.string().min(1, 'Please select an authorized specialist.'),
});

type BulkAssignDealsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deals: Deal[];
  users: UserProfile[];
};

export function BulkAssignDealsDialog({ open, onOpenChange, deals, users }: BulkAssignDealsDialogProps) {
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
      if (!currentTeamspace?.id) return [];
      return users.filter(
        (u) => u.role === 'sales_executive' && (u.teamspaceIds || []).includes(currentTeamspace.id)
      );
    }
    return [];
  }, [users, currentUser, currentTeamspace?.id]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newOwnerId: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'Active workspace required.' });
      return;
    }
    startTransition(async () => {
      const result = await bulkAssignDeals({
        dealIds: deals.map(d => d.id),
        teamspaceId: currentTeamspace.id,
        newOwnerId: values.newOwnerId,
        currentUserId: currentUser.id,
      });

      if (result.success) {
        toast({ title: 'Delegation Successful', description: `Reassigned ${deals.length} deals to your authorized team member.` });
        onOpenChange(false);
        form.reset();
      } else {
        toast({ variant: 'destructive', title: 'Delegation Failed', description: result.error });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-8 border-none shadow-2xl bg-[#0D1F0B] text-white">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black text-[#4ade80]">Authorized Reassignment</DialogTitle>
          <DialogDescription className="text-white/60">Transfer {deals.length} deals to a specialist within your jurisdiction.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newOwnerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">Authorized Recipient</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl bg-white/5 border-white/10 h-12">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#0D1F0B] text-white border-white/10">
                      {filteredUsers.length > 0 ? filteredUsers.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.displayName} ({getRoleLabel(u.role)})</SelectItem>
                      )) : (
                        <div className="p-4 text-center text-xs text-white/40 italic">No authorized specialists found.</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending || filteredUsers.length === 0} className="w-full h-12 font-black rounded-xl herbal-gradient shadow-lg">
              {isPending ? 'Processing Transfer...' : `Assign ${deals.length} Opportunities`}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
