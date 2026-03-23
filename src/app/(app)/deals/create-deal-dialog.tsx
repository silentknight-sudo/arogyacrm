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
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createDeal } from './actions';
import { useApp } from '@/context/app-context';
import type { Contact, Product } from '@/types';
import { LineItemSchema } from '../inventory/schemas';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2 } from 'lucide-react';

const dealStages = ['intrested', 'not connect', 'CNP', 'done', 'not intrested'] as const;
const dealTypes = ['Wellness Package', 'Single Order', 'Subscription', 'Bulk Order', 'Retail'] as const;

const formSchema = z.object({
  name: z.string().min(2, 'Deal name must be at least 2 characters.'),
  stage: z.enum(['intrested', 'not connect', 'CNP', 'done', 'not intrested']),
  type: z.string().min(1, 'Deal type is required.'),
  closeDate: z.string().min(1, 'Close date is required.'),
  contactId: z.string().min(1, 'Contact is required.'),
  lineItems: z.array(LineItemSchema).min(1, 'Add at least one product to the deal.'),
});

type CreateDealDialogProps = {
  children: React.ReactNode;
  contacts: Contact[];
  products: Product[];
  isLoading: boolean;
};

export function CreateDealDialog({ children, contacts, products, isLoading }: CreateDealDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      stage: 'intrested',
      type: 'Wellness Package',
      closeDate: '',
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
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace.' });
        return;
    }
    startTransition(async () => {
      const date = new Date(values.closeDate);
      date.setDate(date.getDate() + 1);

      if (isNaN(date.getTime())) {
          toast({ variant: 'destructive', title: 'Invalid Date', description: 'Please enter a valid date.' });
          return;
      }

      const result = await createDeal({
          ...values,
          amount: totalAmount,
          closeDate: date.toISOString(),
          ownerId: currentUser.id,
          teamspaceId: currentTeamspace.id,
      });

      if (result.success) {
        toast({ title: 'Deal Created', description: `Successfully created product-based deal "${values.name}".` });
        setOpen(false);
        form.reset();
      } else {
        toast({ variant: 'destructive', title: 'Error Creating Deal', description: result.error });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">New Sales Deal</DialogTitle>
          <DialogDescription>Configure products and terms for this opportunity.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] pr-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Deal Heading</FormLabel><FormControl><Input placeholder="e.g. Corporate Wellness Bulk Order" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                
                <FormField control={form.control} name="contactId" render={({ field }) => (
                    <FormItem><FormLabel>Primary Contact</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoading}><SelectValue placeholder="Select contact" /></SelectTrigger></FormControl><SelectContent>{contacts.map(c => (<SelectItem key={c.id} value={c.id}>{`${c.firstName} ${c.lastName}`}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="stage" render={({ field }) => (
                        <FormItem><FormLabel>Stage</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{dealStages.map(s => (<SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem><FormLabel>Deal Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{dealTypes.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="closeDate" render={({ field }) => (
                    <FormItem><FormLabel>Target Close Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <FormLabel className="text-base font-semibold text-primary">Products & Items</FormLabel>
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
                                            <SelectTrigger className="h-9"><SelectValue placeholder="Select Ayurvedic Product" /></SelectTrigger>
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
                                        <Input className="h-9 font-bold bg-muted/30" value={`Total: ₹${field.subtotal}`} readOnly />
                                    </div>
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {fields.length === 0 && (
                            <div className="text-center py-8 border border-dashed rounded-xl text-muted-foreground text-sm">
                                No products added to this deal yet.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">Est. Deal Value</span>
                    <span className="text-3xl font-black text-primary">₹{totalAmount.toLocaleString()}</span>
                </div>

                <Button type="submit" disabled={isPending || isLoading} className="w-full h-14 rounded-2xl herbal-gradient shadow-xl text-lg font-bold">
                    {isPending ? 'Processing...' : 'Secure Deal Pipeline'}
                </Button>
            </form>
            </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
