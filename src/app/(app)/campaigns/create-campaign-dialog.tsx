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
import { createCampaign } from './actions';
import { useApp } from '@/context/app-context';
import { Textarea } from '@/components/ui/textarea';
import { CampaignImageUpload } from './campaign-image-upload';

const formSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters.'),
  description: z.string().optional(),
  currentPrice: z.coerce.number().optional(),
  originalPrice: z.coerce.number().optional(),
  productImageUrl: z.string().optional(),
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
      currentPrice: undefined,
      originalPrice: undefined,
      productImageUrl: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace.' });
      return;
    }

    startTransition(async () => {
      const result = await createCampaign({
        name: values.name,
        type: 'Landing Page Campaign',
        status: 'Active',
        budget: 0,
        budgetInterval: 'Daily',
        description: values.description,
        productName: values.name,
        currentPrice: values.currentPrice,
        originalPrice: values.originalPrice,
        productImageUrl: values.productImageUrl,
        heroImageUrl: values.productImageUrl,
        ownerId: currentUser.id,
        teamspaceId: currentTeamspace.id,
      });

      if (result.success) {
        toast({
          title: 'Product Created',
          description: `"${values.name}" is ready. Connect a Google Sheet to it from Settings to start syncing leads.`,
        });
        setOpen(false);
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Creating Product',
          description: result.error,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>
            Add a product to start tracking its leads. Google Sheets and lead filters can be connected from Settings.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[70vh] pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="Arogya Bio Gouthealth Oil" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Short product description..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="currentPrice" render={({ field }) => (
                  <FormItem><FormLabel>Offer Price (₹)</FormLabel><FormControl><Input type="number" placeholder="1999" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="originalPrice" render={({ field }) => (
                  <FormItem><FormLabel>Original Price (₹)</FormLabel><FormControl><Input type="number" placeholder="2499" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="productImageUrl" render={({ field }) => (
                <FormItem><FormControl><CampaignImageUpload label="Product Image" description="Optional product photo." value={field.value} onChange={field.onChange} teamspaceId={currentTeamspace?.id} assetType="product" /></FormControl><FormMessage /></FormItem>
              )} />

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Creating Product...' : 'Create Product'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
