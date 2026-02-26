'use client';

import { useState, useTransition } from 'react';
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
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      role: 'sales_executive',
      teamspaceIds: [],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const result = await createUser(values);
      if (result.success) {
        toast({
          title: 'User Created',
          description: `Successfully created user ${values.displayName}.`,
        });
        setOpen(false);
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Creating User',
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
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Fill out the form to create a new user and assign their role and teamspaces.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] pr-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Display Name</FormLabel>
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
                    <FormLabel>Password</FormLabel>
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
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="sales_team_lead">Sales Team Lead</SelectItem>
                          <SelectItem value="sales_executive">Sales Executive</SelectItem>
                          <SelectItem value="marketer">Marketer</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
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
                            <FormLabel className="text-base">Teamspaces</FormLabel>
                            <FormDescription>
                                Select the teamspaces this user will belong to.
                            </FormDescription>
                        </div>
                        <div className="space-y-2">
                        {isLoadingTeamspaces ? (
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        ) : teamspaces.length > 0 ? (
                           teamspaces.map((item) => (
                                <div key={item.id} className="flex flex-row items-center space-x-3 space-y-0">
                                    <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), item.id])
                                                : field.onChange(
                                                    field.value?.filter((value: string) => value !== item.id)
                                                )
                                        }}
                                    />
                                    <Label className="text-sm font-normal cursor-pointer">
                                        {item.name}
                                    </Label>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                                No teamspaces found. Please create one first.
                            </div>
                        )}
                        </div>
                        <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPending || isLoadingTeamspaces || teamspaces.length === 0} className="w-full">
                {isPending ? 'Creating User...' : 'Create User'}
                </Button>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
