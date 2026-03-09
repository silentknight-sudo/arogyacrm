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
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createQuote } from './actions';
import { useApp } from '@/context/app-context';
import type { Contact, Product } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineItemSchema } from '../schemas';
import { ScrollArea } from '@/components/ui/scroll-area';

const quoteStatuses = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'] as const;

const formSchema = z.object({
  name: z.string().min(2, 'Quote name is required.'),
  contactId: z.string().min(1, 'Contact is required.'),
  validUntil: z.date({ required_error: 'Valid until date is required.' }),
  status: z.enum(quoteStatuses),
  lineItems: z.array(LineItemSchema).min(1, 'Quote must have at least one line item.'),
});

type CreateQuoteDialogProps = {
  children: React.ReactNode;
  contacts: Contact[];
  products: Product[];
  isLoading: boolean;
};

export function CreateQuoteDialog({ children, contacts, products, isLoading }: CreateQuoteDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      status: 'Draft',
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'Active workspace required.' });
      return;
    }
    setIsSubmitting(true);
    const result = await createQuote({
      ...values,
      validUntil: values.validUntil.toISOString(),
      ownerId: currentUser.id,
      teamspaceId: currentTeamspace.id,
    });

    if (result.success) {
      toast({
        title: 'Quote Finalized',
        description: `Successfully created formal quote "${values.name}".`,
      });
      setOpen(false);
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Quote Error',
        description: result.error,
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Secure Wellness Quote</DialogTitle>
          <DialogDescription>
            Configure items and pricing for a formal stakeholder offer.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4 pt-2">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote Heading</FormLabel>
                      <FormControl><Input placeholder="e.g. Q4 Supplement Package" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )} />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="contactId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Stakeholder</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger disabled={isLoading}><SelectValue placeholder="Select contact" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contacts.map(c => (<SelectItem key={c.id} value={c.id}>{`${c.firstName} ${c.lastName}`}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {quoteStatuses.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="validUntil" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Valid Until Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("rounded-xl pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? (format(field.value, "PPP")) : (<span>Pick expiry date</span>)}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                )} />
                
                <FormField
                  control={form.control}
                  name="lineItems"
                  render={() => (
                    <FormItem className="space-y-4">
                      <FormLabel className="font-bold text-primary">Inventory Items</FormLabel>
                      <div className="space-y-2">
                        {fields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2 p-2 border rounded-xl bg-muted/20">
                            <div className="grid grid-cols-3 gap-2 flex-grow">
                                <Select onValueChange={(value) => handleProductChange(index, value)} defaultValue={field.productId}>
                                    <SelectTrigger className="col-span-3 h-9 rounded-lg"><SelectValue placeholder="Select Product" /></SelectTrigger>
                                    <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <Input className="h-9" type="number" placeholder="Qty" value={field.quantity} onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)} />
                                <Input className="h-9" value={`₹${field.unitPrice}`} readOnly/>
                                <Input className="h-9 font-bold bg-white/50" value={`₹${field.subtotal}`} readOnly/>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button type="button" variant="outline" size="sm" className="w-full border-dashed rounded-xl" onClick={() => append({productId: '', productName: '', quantity: 1, unitPrice: 0, subtotal: 0})}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Package Item
                      </Button>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <Button type="submit" disabled={isSubmitting || isLoading} className="w-full h-12 rounded-xl herbal-gradient font-bold shadow-lg">
                {isSubmitting ? 'Processing Offer...' : 'Generate Formal Quote'}
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}