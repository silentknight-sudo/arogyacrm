'use client';

import { useState, useTransition } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { convertAndCreateDeal } from './actions';
import { useApp } from '@/context/app-context';
import type { Lead, Product } from '@/types';
import { LineItemSchema } from '../inventory/schemas';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2 } from 'lucide-react';

const dealTypes = ['Wellness Package', 'Single Order', 'Subscription', 'Bulk Order', 'Retail'] as const;
const dealStages = ['pending', 'not connect', 'busy', 'done', 'cancel'] as const;

const formSchema = z.object({
  dealName: z.string().min(2, 'Deal name must be at least 2 characters.'),
  dealType: z.string().min(1, 'Please select a deal type.'),
  dealStage: z.enum(dealStages),
  lineItems: z.array(LineItemSchema).min(1, 'Add at least one product to the deal.'),
});

type ConvertToDealDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  products: Product[];
  isLoading: boolean;
};

export function ConvertToDealDialog({ open, onOpenChange, lead, products, isLoading }: ConvertToDealDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dealName: `Order for ${lead.fullName}`,
      dealType: 'Wellness Package',
      dealStage: 'pending',
      lineItems: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      update(index, {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: fields[index].quantity || 1,
        subtotal: product.price * (fields[index].quantity || 1),
      });
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const currentItem = fields[index];
    update(index, {
      ...currentItem,
      quantity,
      subtotal: currentItem.unitPrice * quantity,
    });
  };

  const totalAmount = fields.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'Session context not found.' });
      return;
    }
    
    startTransition(async () => {
      const result = await convertAndCreateDeal({
        leadId: lead.id,
        teamspaceId: currentTeamspace.id,
        currentUserId: currentUser.id,
        dealName: values.dealName,
        dealType: values.dealType,
        dealStage: values.dealStage,
        dealAmount: totalAmount,
        lineItems: values.lineItems,
      });

      if (result.success) {
        toast({ 
          title: 'Direct Conversion Successful', 
          description: `Contact and Product Deal created for ${lead.fullName}.` 
        });
        onOpenChange(false);
      } else {
        toast({ 
          variant: 'destructive', 
          title: 'Conversion Failed', 
          description: result.error 
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-[2.5rem] border-none shadow-2xl bg-card text-foreground">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-black tracking-tight text-primary">Strategic Conversion</DialogTitle>
          <DialogDescription className="text-lg font-medium text-muted-foreground">
            Instantly initiate a Product-Based Deal from this prospect.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="dealName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opportunity Heading</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Bulk Ashwagandha Order" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="dealType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Strategic Deal Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {dealTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="dealStage"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Pipeline Stage</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {dealStages.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-semibold text-primary">Ayurvedic Item Catalog</FormLabel>
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-primary" onClick={() => append({productId: '', productName: '', quantity: 1, unitPrice: 0, subtotal: 0})}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                  </Button>
                </div>
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2 p-3 border rounded-xl bg-muted/20">
                      <div className="grid grid-cols-4 gap-2 flex-grow">
                        <div className="col-span-4">
                          <Select onValueChange={(v) => handleProductChange(index, v)} defaultValue={field.productId}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Configure Product" /></SelectTrigger>
                            <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1">
                          <Input className="h-9" type="number" placeholder="Qty" value={field.quantity} onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="col-span-1">
                          <Input className="h-9" value={`₹${field.unitPrice}`} readOnly />
                        </div>
                        <div className="col-span-2">
                          <Input className="h-9 font-bold bg-muted/30" value={`₹${field.subtotal}`} readOnly />
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Aggregate Revenue</span>
                <span className="text-3xl font-black text-primary">₹{totalAmount.toLocaleString()}</span>
              </div>

              <Button type="submit" disabled={isPending || isLoading} className="w-full h-16 text-lg font-black rounded-2xl herbal-gradient shadow-2xl shadow-primary/30 gold-glow hover:scale-[1.02] transition-transform mt-4">
                {isPending ? 'Processing High-Value Conversion...' : 'Finalize Pipeline Move'}
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}