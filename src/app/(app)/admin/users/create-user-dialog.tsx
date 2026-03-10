'use client';

import { useState, useTransition, useMemo } from 'react';
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
import {
  Form,
  FormControl,
  FormDescription,
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
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createUser } from './actions';
import type { Teamspace } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/context/app-context';

const formSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['admin', 'sales_team_lead', 'sales_executive', 'marketer', 'support']),
  teamspaceIds: z.array(z.string()).min(1, 'User must belong to at least one teamspace.'),
});

type CreateUserDialogProps = {
  children: React.ReactNode;
  teamspaces: Teamspace[];
  isLoadingTeamspaces: boolean;
};

export function CreateUserDialog({ children, teamspaces, isLoadingTeamspaces }: CreateUserDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // ROLE RESTRICTIONS: Team Leads can only create Sales Executives
  const availableRoles = useMemo(() => {
    if (currentUser?.role === 'admin') {
        return ['admin', 'sales_team_lead', 'sales_executive', 'marketer', 'support'];
    }
    return ['sales_executive']; // Team leads only create executives
  }, [currentUser]);

  // TEAMSPACE RESTRICTIONS: Team Leads can only assign to their own teams
  const filteredTeamspaces = useMemo(() => {
    if (currentUser?.role === 'admin') return teamspaces;
    return teamspaces.filter(ts => currentUser?.teamspaceIds?.includes(ts.id));
  }, [teamspaces, currentUser]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      role: 'sales_executive',
      teamspaceIds: currentUser?.role === 'sales_team_lead' && currentTeamspace ? [currentTeamspace.id] : [],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser) return;
    
    startTransition(async () => {
      const result = await createUser({
          ...values,
          creatorId: currentUser.id
      });
      if (result.success) {
        toast({
          title: 'Member Registered',
          description: `Successfully onboarded ${values.displayName} to your team.`,
        });
        setOpen(false);
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Onboarding Failed',
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
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            {currentUser?.role === 'admin' ? 'Register a new user and assign global permissions.' : 'Add a new Sales Executive to your workspace.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] px-1">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
                <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Temporary Password</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>System Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={availableRoles.length === 1}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableRoles.map(r => (
                              <SelectItem key={r} value={r} className="capitalize">{r.replace(/_/g, ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                  control={form.control}
                  name="teamspaceIds"
                  render={({ field }) => (
                    <FormItem>
                        <div className="mb-2">
                            <FormLabel className="text-base">Workspace Assignment</FormLabel>
                            <FormDescription>
                                Select the teams this user will belong to.
                            </FormDescription>
                        </div>
                        <div className="space-y-2">
                        {isLoadingTeamspaces ? (
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        ) : filteredTeamspaces.length > 0 ? (
                           filteredTeamspaces.map((item) => (
                                <div key={item.id} className="flex flex-row items-center space-x-3 space-y-0">
                                    <Checkbox
                                        id={`ts-${item.id}`}
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), item.id])
                                                : field.onChange(
                                                    field.value?.filter((value: string) => value !== item.id)
                                                )
                                        }}
                                    />
                                    <Label htmlFor={`ts-${item.id}`} className="text-sm font-normal cursor-pointer">
                                        {item.name}
                                    </Label>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg italic">
                                No authorized workspaces available.
                            </div>
                        )}
                        </div>
                        <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPending || isLoadingTeamspaces || filteredTeamspaces.length === 0} className="w-full">
                {isPending ? 'Processing...' : 'Complete Registration'}
                </Button>
            </form>
            </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
