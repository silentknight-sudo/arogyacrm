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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createMeeting } from './actions';
import { useApp } from '@/context/app-context';
import type { UserProfile, Contact } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  title: z.string().min(2, 'Title is required.'),
  description: z.string().optional(),
  startTime: z.date({ required_error: 'Start time is required.' }),
  endTime: z.date({ required_error: 'End time is required.' }),
  location: z.string().min(1, 'Location is required.'),
  attendeeIds: z.array(z.string()).optional(),
});

type CreateMeetingDialogProps = {
  children: React.ReactNode;
  users: UserProfile[];
  contacts: Contact[];
  isLoading: boolean;
};

function AttendeeCheckbox({ field, item }: { field: any; item: UserProfile | Contact }) {
  const label = 'displayName' in item ? item.displayName : `${item.firstName} ${item.lastName}`;
  return (
    <FormItem
      key={item.id}
      className="flex flex-row items-start space-x-3 space-y-0"
    >
      <FormControl>
        <Checkbox
          checked={(field.value || []).includes(item.id)}
          onCheckedChange={(checked) => {
            return checked
              ? field.onChange([...(field.value || []), item.id])
              : field.onChange(
                  (field.value || []).filter((value: string) => value !== item.id)
                );
          }}
        />
      </FormControl>
      <FormLabel className="font-normal">{label}</FormLabel>
    </FormItem>
  );
}

export function CreateMeetingDialog({ children, users, contacts, isLoading }: CreateMeetingDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      attendeeIds: [],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace.' });
      return;
    }
    startTransition(async () => {
      const result = await createMeeting({
        ...values,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
        organizerId: currentUser.id,
        teamspaceId: currentTeamspace.id,
      });

      if (result.success) {
        toast({
          title: 'Meeting Scheduled',
          description: `Successfully scheduled meeting "${values.title}".`,
        });
        setOpen(false);
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Scheduling Meeting',
          description: result.error,
        });
      }
    });
  };

  const allAttendees = [...users, ...contacts];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule a Meeting</DialogTitle>
          <DialogDescription>
            Fill out the details to schedule a new meeting.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Quarterly Review" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description/Agenda (Optional)</FormLabel><FormControl><Textarea placeholder="Agenda items..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startTime" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Start Time</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPp")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>End Time</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPp")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="Zoom Link / Conference Room" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField
                control={form.control}
                name="attendeeIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attendees</FormLabel>
                    <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border p-2">
                      {allAttendees.map((item) => <AttendeeCheckbox key={item.id} field={field} item={item} />)}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending || isLoading} className="w-full">
                {isPending ? 'Scheduling...' : 'Schedule Meeting'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
