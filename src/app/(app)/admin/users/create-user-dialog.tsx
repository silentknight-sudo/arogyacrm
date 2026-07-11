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
import type { Teamspace, UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/context/app-context';
import { getRoleLabel } from '@/lib/user-labels';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['admin', 'sales_team_lead', 'sales_executive', 'marketer', 'support']),
  teamspaceIds: z.array(z.string()),
  managerId: z.string().optional(),
  newTeamspaceName: z.string().optional(),
  newTeamspaceDescription: z.string().optional(),
}).superRefine((values, ctx) => {
  if (values.role === 'sales_executive' && !values.managerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['managerId'],
      message: 'Choose the Team Lead this telecaller should work under.',
    });
  }

  if (values.role === 'sales_team_lead' && !values.newTeamspaceName?.trim() && values.teamspaceIds.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['newTeamspaceName'],
      message: 'Create a new teamspace for this Team Lead.',
    });
  }

  if (!['sales_executive', 'sales_team_lead'].includes(values.role) && values.teamspaceIds.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['teamspaceIds'],
      message: 'User must belong to at least one teamspace.',
    });
  }
});

function getTeamspaceNames(teamspaces: Teamspace[], ids: string[]) {
  return ids
    .map((id) => teamspaces.find((teamspace) => teamspace.id === id)?.name)
    .filter(Boolean)
    .join(', ');
}

type CreateUserDialogProps = {
  children: React.ReactNode;
  teamspaces: Teamspace[];
  isLoadingTeamspaces: boolean;
};

export function CreateUserDialog({ children, teamspaces, isLoadingTeamspaces }: CreateUserDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const teamLeadsQuery = useMemoFirebase(() => (
    currentUser?.role === 'admin'
      ? query(collection(firestore, 'users'), where('role', '==', 'sales_team_lead'))
      : null
  ), [firestore, currentUser?.role]);
  const { data: teamLeads, isLoading: isLoadingTeamLeads } = useCollection<UserProfile>(teamLeadsQuery);

  const availableRoles = useMemo(() => {
    if (currentUser?.role === 'admin') {
        return ['sales_team_lead', 'sales_executive', 'admin', 'marketer', 'support'];
    }
    return [];
  }, [currentUser]);

  // TEAMSPACE RESTRICTIONS: Team Leads can only assign to their own teams
  const filteredTeamspaces = useMemo(() => {
    if (currentUser?.role === 'admin') return teamspaces;
    return [];
  }, [teamspaces, currentUser]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      role: 'sales_executive',
      teamspaceIds: currentUser?.role === 'sales_team_lead' && currentTeamspace ? [currentTeamspace.id] : [],
      managerId: '',
      newTeamspaceName: '',
      newTeamspaceDescription: '',
    },
  });

  const selectedRole = form.watch('role');
  const selectedTeamspaceIds = form.watch('teamspaceIds');

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
        form.reset({
          displayName: '',
          email: '',
          password: '',
          role: 'sales_executive',
          teamspaceIds: [],
          managerId: '',
          newTeamspaceName: '',
          newTeamspaceDescription: '',
        });
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
            Register a team lead or telecaller and assign their workspace access.
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
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('teamspaceIds', []);
                        form.setValue('managerId', '');
                        form.setValue('newTeamspaceName', '');
                        form.setValue('newTeamspaceDescription', '');
                      }}
                      value={field.value}
                      disabled={availableRoles.length === 1}
                    >
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableRoles.map(r => (
                              <SelectItem key={r} value={r} className="capitalize">{getRoleLabel(r)}</SelectItem>
                          ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                {selectedRole === 'sales_executive' && (
                  <FormField
                    control={form.control}
                    name="managerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Lead / Sales Department</FormLabel>
                        <Select
                          value={field.value}
                          disabled={isLoadingTeamLeads}
                          onValueChange={(value) => {
                            field.onChange(value);
                            const selectedTL = (teamLeads || []).find((teamLead) => teamLead.id === value);
                            form.setValue('teamspaceIds', selectedTL?.teamspaceIds || [], { shouldValidate: true });
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingTeamLeads ? 'Loading Team Leads...' : 'Choose Team Lead'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(teamLeads || []).map((teamLead) => (
                              <SelectItem key={teamLead.id} value={teamLead.id}>
                                {teamLead.displayName} Team
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Telecaller will be added directly under this TL and their sales department.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {selectedRole === 'sales_executive' && selectedTeamspaceIds.length > 0 && (
                  <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm font-semibold">
                    <div className="flex items-center justify-between gap-3">
                      <span>Selected Department</span>
                      <Badge variant="secondary">
                        {getTeamspaceNames(teamspaces, selectedTeamspaceIds) || 'Teamspace linked'}
                      </Badge>
                    </div>
                  </div>
                )}
                {selectedRole === 'sales_team_lead' && (
                  <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold">Create Team Space</h3>
                      <p className="text-xs text-muted-foreground">
                        This dedicated teamspace will be created and assigned to the new Team Lead automatically.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="newTeamspaceName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teamspace Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Example: Yogesh TL Team" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="newTeamspaceDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional team notes or product focus" {...field} />
                            </FormControl>
                            <FormDescription>
                              You can transfer telecallers into this team after the TL is created.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
                {!['sales_executive', 'sales_team_lead'].includes(selectedRole) && (
                <FormField
                  control={form.control}
                  name="teamspaceIds"
                  render={({ field }) => (
                    <FormItem>
                        <div className="mb-2">
                            <FormLabel className="text-base">Workspace Assignment</FormLabel>
                            <FormDescription>
                                Team leads should have one dedicated workspace. Telecallers can be moved between teamspaces by admin.
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
                )}
                <Button
                  type="submit"
                  disabled={
                    isPending ||
                    (selectedRole === 'sales_executive'
                      ? isLoadingTeamLeads || !form.watch('managerId')
                      : selectedRole === 'sales_team_lead'
                        ? !form.watch('newTeamspaceName')?.trim()
                        : isLoadingTeamspaces || filteredTeamspaces.length === 0)
                  }
                  className="w-full"
                >
                {isPending ? 'Processing...' : 'Complete Registration'}
                </Button>
            </form>
            </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
