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
import { createCampaign } from './actions';
import { useApp } from '@/context/app-context';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

const campaignStatuses = ['Planned', 'Active', 'Completed', 'Paused', 'Cancelled'] as const;
const campaignTypes = ['Landing Page Campaign', 'Social Media Ad', 'Event Promotion', 'Content Marketing', 'Referral Program'];

const formSchema = z.object({
  name: z.string().min(2, 'Campaign name must be at least 2 characters.'),
  type: z.string().min(2, 'Campaign type is required.'),
  status: z.enum(campaignStatuses),
  budget: z.coerce.number().min(0, 'Budget must be a positive number.'),
  budgetInterval: z.enum(['Daily', 'Weekly']),
  description: z.string().optional(),
  landingPageEnabled: z.boolean().default(true),
  locale: z.enum(['hi', 'en']).default('hi'),
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  ctaText: z.string().optional(),
  productName: z.string().optional(),
  currentPrice: z.coerce.number().optional(),
  originalPrice: z.coerce.number().optional(),
});

type CreateCampaignDialogProps = {
  children: React.ReactNode;
};

export function CreateCampaignDialog({ children }: CreateCampaignDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'Active',
      type: 'Landing Page Campaign',
      budget: 5000,
      budgetInterval: 'Daily',
      landingPageEnabled: true,
      locale: 'hi',
      headline: 'जोड़ों के दर्द से छुटकारा पाएं!',
      subheadline: '100% आयुर्वेदिक गाउटहेल्थ ऑयल के साथ राहत, लचीलापन और बेहतर जीवन।',
      ctaText: 'अभी ऑर्डर करें',
      productName: 'Arogya Bio Gouthealth Oil',
      currentPrice: 1999,
      originalPrice: 2499,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace.' });
        return;
    }
    startTransition(async () => {
      const result = await createCampaign({
          ...values,
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
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Create a campaign with its own landing-page link and direct CRM lead capture.
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
                    <FormItem><FormLabel>Budget (₹)</FormLabel><FormControl><Input type="number" placeholder="5000" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="budgetInterval" render={({ field }) => (
                    <FormItem><FormLabel>Budget Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select budget type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Daily">Daily Budget</SelectItem><SelectItem value="Weekly">Weekly Budget</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Objectives, target audience, etc." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="rounded-2xl border border-primary/10 bg-muted/20 p-4 space-y-4">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">Landing Page Setup</p>
                    <FormField control={form.control} name="landingPageEnabled" render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl bg-background p-3">
                            <div>
                                <FormLabel>Enable Landing Page Link</FormLabel>
                                <p className="text-xs text-muted-foreground font-medium">Use this campaign with Meta ads instead of instant forms.</p>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="headline" render={({ field }) => (
                        <FormItem><FormLabel>Hindi Headline</FormLabel><FormControl><Input {...field} placeholder="जोड़ों के दर्द से छुटकारा पाएं!" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subheadline" render={({ field }) => (
                        <FormItem><FormLabel>Subheadline</FormLabel><FormControl><Textarea {...field} placeholder="100% आयुर्वेदिक देखभाल..." /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="originalPrice" render={({ field }) => (
                            <FormItem><FormLabel>Original Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="currentPrice" render={({ field }) => (
                            <FormItem><FormLabel>Offer Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="ctaText" render={({ field }) => (
                        <FormItem><FormLabel>Button Text</FormLabel><FormControl><Input {...field} placeholder="अभी ऑर्डर करें" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? 'Creating Campaign...' : 'Create Campaign'}
                </Button>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
