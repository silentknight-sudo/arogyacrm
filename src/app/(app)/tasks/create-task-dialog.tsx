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
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createTask } from './actions';
import { useApp } from '@/context/app-context';
import type { UserProfile } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const taskStatuses = ['Todo', 'In Progress', 'Done'] as const;
const taskPriorities = ['Low', 'Medium', 'High'] as const;

const formSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  description: z.string().optional(),
  status: z.enum(taskStatuses),
  priority: z.enum(taskPriorities),
  dueDate: z.date({ required_error: 'Due date is required.' }),
  assignedToIds: z.array(z.string()).min(1, 'Select at least one specialist.'),
});

type CreateTaskDialogProps = {
  children: React.ReactNode;
  users: UserProfile[];
  isLoading: boolean;
};

export function CreateTaskDialog({ children, users, isLoading }: CreateTaskDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // HIERARCHICAL FILTERING:
  // Admins can assign to anyone. Team Leads assign to Executives.
  const filteredUsers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return users;
    if (currentUser.role === 'sales_team_lead') {
        return users.filter(u => u.role === 'sales_executive' || u.id === currentUser.id);
    }
    return users.filter(u => u.id === currentUser.id); // Executives can assign to themselves
  }, [users, currentUser]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'Todo',
      priority: 'Medium',
      assignedToIds: currentUser ? [currentUser.id] : [],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace.' });
        return;
    }
    startTransition(async () => {
      const result = await createTask({
          ...values,
          dueDate: values.dueDate.toISOString(),
          teamspaceId: currentTeamspace.id,
      });

      if (result.success) {
        toast({
          title: 'Task Created',
          description: `Successfully created task "${values.title}".`,
        });
        setOpen(false);
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Creating Task',
          description: result.error,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-[2rem] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Strategic Task Assignment</DialogTitle>
          <DialogDescription>
            Configure operational milestones and delegate to specialists.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Task Heading</FormLabel><FormControl><Input placeholder="e.g. Q3 Inventory Audit" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Context / Details</FormLabel><FormControl><Textarea className="min-h-[100px]" placeholder="Specific instructions or success criteria..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                
                <FormField
                  control={form.control}
                  name="assignedToIds"
                  render={({ field }) => (
                    <FormItem>
                        <div className="mb-2">
                            <FormLabel className="text-base font-bold text-primary">Delegation</FormLabel>
                            <FormDescription>Select one or more wellness specialists for this task.</FormDescription>
                        </div>
                        <div className="rounded-[1.5rem] border bg-muted/20 p-4 shadow-inner">
                            <ScrollArea className="h-40">
                                <div className="space-y-3">
                                {isLoading ? (
                                    <div className="py-4 text-center text-xs animate-pulse">Loading workspace members...</div>
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <div key={user.id} className="flex flex-row items-center space-x-3 space-y-0 group">
                                            <Checkbox
                                                id={`task-user-${user.id}`}
                                                checked={field.value?.includes(user.id)}
                                                onCheckedChange={(checked) => {
                                                    return checked
                                                        ? field.onChange([...(field.value || []), user.id])
                                                        : field.onChange(field.value?.filter(v => v !== user.id))
                                                }}
                                                className="rounded-full h-5 w-5 border-2"
                                            />
                                            <Label htmlFor={`task-user-${user.id}`} className="text-sm font-medium cursor-pointer group-hover:text-primary transition-colors flex flex-col">
                                                {user.displayName}
                                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{user.role.replace(/_/g, ' ')}</span>
                                            </Label>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-xs text-muted-foreground py-8">No eligible specialists found.</div>
                                )}
                                </div>
                            </ScrollArea>
                        </div>
                        <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>Current Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{taskStatuses.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="priority" render={({ field }) => (
                        <FormItem><FormLabel>Priority Tier</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a priority" /></SelectTrigger></FormControl><SelectContent>{taskPriorities.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Target Completion Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal rounded-xl h-12", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0 rounded-2xl" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isPending || isLoading} className="w-full h-14 rounded-2xl herbal-gradient shadow-xl text-lg font-bold">
                    {isPending ? 'Processing Milestone...' : 'Initiate Task Delegation'}
                </Button>
            </form>
            </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
