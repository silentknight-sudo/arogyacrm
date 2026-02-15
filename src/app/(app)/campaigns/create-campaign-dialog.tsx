
'use client';

import { useState } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createCampaign } from './actions';
import { useApp } from '@/context/app-context';
import type { CampaignStatus } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

const campaignStatuses: CampaignStatus[] = ['Planned', 'Active', 'Completed', 'Paused', 'Cancelled'];
const campaignTypes = ['Email Marketing', 'Social Media Ad', 'Event Promotion', 'Content Marketing', 'Referral Program'];

const formSchema = z.object({
  name: z.string().min(2, 'Campaign name must be at least 2 characters.'),
  type: z.string().min(2, 'Campaign type is required.'),
  status: z.enum(campaignStatuses),
  budget: z.coerce.number().min(0, 'Budget must be a positive number.'),
  startDate: z.date({ required_error: 'Start date is required.' }),
  endDate: z.date({ required_error: 'End date is required.' }),
  description: z.string().optional(),
});

type CreateCampaignDialogProps = {
  children: React.ReactNode;
};

export function CreateCampaignDialog({ children }: CreateCampaignDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'Planned',
      budget: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace.' });
        return;
    }
    setIsSubmitting(true);
    const result = await createCampaign({
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        ownerId: currentUser.id,
        teamspaceId: currentTeamspace.id,
    });

    if (result.success) {
      toast({
        title: 'Campaign Created',
        description: `Successfully created campaign "${values.name}".`,
      });
      setOpen(false);
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Creating Campaign',
        description: result.error,
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Fill out the form to launch a new marketing campaign.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] pr-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Campaign Name</FormLabel><FormControl><Input placeholder="Summer Sale 2024" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Campaign Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl><SelectContent>{campaignTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{campaignStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="budget" render={({ field }) => (
                    <FormItem><FormLabel>Budget ($)</FormLabel><FormControl><Input type="number" placeholder="5000" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>End Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Objectives, target audience, etc." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Creating Campaign...' : 'Create Campaign'}
                </Button>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
