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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createCall } from './actions';
import { useApp } from '@/context/app-context';
import type { Contact, UserProfile, CallStatus, CallType } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const callStatuses: CallStatus[] = ['Completed', 'No Answer', 'Voicemail', 'Busy'];
const callTypes: CallType[] = ['Outbound', 'Inbound'];

const formSchema = z.object({
  subject: z.string().min(2, 'Subject is required.'),
  callDate: z.date({ required_error: 'Call date is required.' }),
  callDurationMinutes: z.coerce.number().min(0, 'Duration must be a positive number.'),
  callType: z.enum(callTypes),
  status: z.enum(callStatuses),
  notes: z.string().optional(),
  relatedToEntityId: z.string().optional(),
});

type CreateCallDialogProps = {
  children: React.ReactNode;
  contacts: Contact[];
  users: UserProfile[];
  isLoading: boolean;
};

export function CreateCallDialog({ children, contacts, users, isLoading }: CreateCallDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      callDurationMinutes: 0,
      callType: 'Outbound',
      status: 'Completed',
      notes: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace.' });
      return;
    }
    startTransition(async () => {
      const result = await createCall({
        ...values,
        callDate: values.callDate.toISOString(),
        callerId: currentUser.id,
        teamspaceId: currentTeamspace.id,
        relatedToEntityType: values.relatedToEntityId ? 'Contact' : undefined,
      });

      if (result.success) {
        toast({
          title: 'Call Logged',
          description: `Successfully logged call "${values.subject}".`,
        });
        setOpen(false);
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Logging Call',
          description: result.error,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log a Call</DialogTitle>
          <DialogDescription>
            Fill out the details of the call to log it.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="Follow-up call" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="relatedToEntityId" render={({ field }) => (
                <FormItem><FormLabel>Related Contact (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoading}><SelectValue placeholder={isLoading ? "Loading..." : "Select a contact"} /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => (<SelectItem key={c.id} value={c.id}>{`${c.firstName} ${c.lastName}`}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="callDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Call Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="callDurationMinutes" render={({ field }) => (
                    <FormItem><FormLabel>Duration (min)</FormLabel><FormControl><Input type="number" placeholder="15" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="callType" render={({ field }) => (
                    <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{callTypes.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{callStatuses.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Discussed pricing and features..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <Button type="submit" disabled={isPending || isLoading} className="w-full">
                {isPending ? 'Logging Call...' : 'Log Call'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
