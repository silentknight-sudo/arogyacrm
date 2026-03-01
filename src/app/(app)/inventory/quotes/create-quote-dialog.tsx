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
import type { Account, Contact, Product } from '@/types';
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
  accountId: z.string().min(1, 'Account is required.'),
  contactId: z.string().optional(),
  validUntil: z.date({ required_error: 'Valid until date is required.' }),
  status: z.enum(quoteStatuses),
  lineItems: z.array(LineItemSchema).min(1, 'Quote must have at least one line item.'),
});

type CreateQuoteDialogProps = {
  children: React.ReactNode;
  accounts: Account[];
  contacts: Contact[];
  products: Product[];
  isLoading: boolean;
};

export function CreateQuoteDialog({ children, accounts, contacts, products, isLoading }: CreateQuoteDialogProps) {
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
      const currentItem = fields[index];
      update(index, {
        ...currentItem,
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        subtotal: product.price * (currentItem.quantity || 1),
      });
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const currentItem = fields[index];
    if (currentItem) {
      update(index, {
        ...currentItem,
        quantity,
        subtotal: currentItem.unitPrice * quantity,
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace.' });
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
        title: 'Quote Created',
        description: `Successfully created quote "${values.name}".`,
      });
      setOpen(false);
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Creating Quote',
        description: result.error,
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Quote</DialogTitle>
          <DialogDescription>
            Fill out the form to create a new sales quote.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Corporate Wellness Package Q3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                )} />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="accountId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger disabled={isLoading}>
                                <SelectValue placeholder={isLoading ? "Loading..." : "Select an account"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accounts.length > 0 ? accounts.map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                              )) : <div className="p-2 text-sm text-muted-foreground text-center">No accounts found.</div>}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="contactId" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger disabled={isLoading}>
                                <SelectValue placeholder={isLoading ? "Loading..." : "Select a contact"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contacts.length > 0 ? contacts.map(c => (
                                <SelectItem key={c.id} value={c.id}>{`${c.firstName} ${c.lastName}`}</SelectItem>
                              )) : <div className="p-2 text-sm text-muted-foreground text-center">No contacts found.</div>}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="validUntil" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Valid Until</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
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
                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {quoteStatuses.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField
                  control={form.control}
                  name="lineItems"
                  render={() => (
                    <FormItem>
                      <FormLabel>Line Items</FormLabel>
                      <div className="space-y-2 mt-2">
                        {fields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2 p-2 border rounded-lg">
                            <div className="grid grid-cols-3 gap-2 flex-grow">
                                <Select onValueChange={(value) => handleProductChange(index, value)} defaultValue={field.productId}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a product" /></SelectTrigger>
                                    <SelectContent>{products.length > 0 ? products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>) : <div className="p-2 text-sm text-muted-foreground text-center">No products found.</div>}</SelectContent>
                                </Select>
                                <Input type="number" placeholder="Qty" value={field.quantity} onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)} />
                                <Input type="number" placeholder="Price" value={field.unitPrice} readOnly/>
                                <Input type="number" placeholder="Subtotal" value={field.subtotal} readOnly/>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({productId: '', productName: '', quantity: 1, unitPrice: 0, subtotal: 0})}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
                      </Button>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">
                {isSubmitting ? 'Creating Quote...' : 'Create Quote'}
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
