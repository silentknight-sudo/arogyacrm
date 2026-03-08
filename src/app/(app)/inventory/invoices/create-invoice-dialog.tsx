'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createInvoice } from './actions';
import { useApp } from '@/context/app-context';
import type { SalesOrder } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineItemSchema } from '../schemas';
import { ScrollArea } from '@/components/ui/scroll-area';

const invoiceStatuses = ['Draft', 'Sent', 'Paid', 'Partially Paid', 'Overdue', 'Voided'] as const;

const formSchema = z.object({
  salesOrderId: z.string().min(1, 'Sales Order is required.'),
  invoiceDate: z.date({ required_error: 'Invoice date is required.' }),
  dueDate: z.date({ required_error: 'Due date is required.' }),
  status: z.enum(invoiceStatuses),
  lineItems: z.array(LineItemSchema).min(1, 'Invoice must have at least one line item.'),
});

type CreateInvoiceDialogProps = {
  children: React.ReactNode;
  salesOrders: SalesOrder[];
  isLoading: boolean;
};

export function CreateInvoiceDialog({ children, salesOrders, isLoading }: CreateInvoiceDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'Draft',
      lineItems: [],
    },
  });

  const watchedSalesOrderId = form.watch('salesOrderId');
  const watchedLineItems = form.watch('lineItems') || [];

  useEffect(() => {
    if (watchedSalesOrderId) {
      const selectedOrder = salesOrders.find(so => so.id === watchedSalesOrderId);
      if (selectedOrder) {
        form.setValue('lineItems', selectedOrder.lineItems);
      }
    }
  }, [watchedSalesOrderId, salesOrders, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'Session expired.' });
      return;
    }
    setIsSubmitting(true);
    const totalAmount = values.lineItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);

    const result = await createInvoice({
      ...values,
      invoiceDate: values.invoiceDate.toISOString(),
      dueDate: values.dueDate.toISOString(),
      ownerId: currentUser.id,
      teamspaceId: currentTeamspace.id,
      totalAmount,
      paidAmount: 0,
    });

    if (result.success) {
      toast({ title: 'Invoice Created', description: `Invoice generated successfully.` });
      setOpen(false);
      form.reset();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSubmitting(false);
  };

  const totalAmount = watchedLineItems.reduce((acc, item) => acc + (item.subtotal || 0), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl rounded-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Create New Invoice</DialogTitle>
          <DialogDescription>Generate a professional invoice from a sales order.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-4 pt-2">
                <FormField
                  control={form.control}
                  name="salesOrderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Sales Order</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl" disabled={isLoading}>
                            <SelectValue placeholder="Select sales order" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {salesOrders.map(so => (
                            <SelectItem key={so.id} value={so.id}>{so.orderNumber} (₹{so.totalAmount})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="invoiceDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Invoice Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant="outline" className={cn("rounded-xl pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="dueDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant="outline" className={cn("rounded-xl pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {invoiceStatuses.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                )} />

                <div className="space-y-4">
                  <FormLabel className="text-base font-semibold">Items Preview</FormLabel>
                  <div className="rounded-2xl border bg-muted/20 p-4 space-y-3">
                      {watchedLineItems.length > 0 ? watchedLineItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm py-1">
                            <div className="space-y-0.5">
                                <p className="font-bold text-foreground">{item.productName}</p>
                                <p className="text-xs text-muted-foreground">{item.quantity} x ₹{item.unitPrice.toFixed(2)}</p>
                            </div>
                            <p className="font-mono font-bold">₹{item.subtotal.toFixed(2)}</p>
                        </div>
                      )) : (
                          <p className="text-sm text-muted-foreground text-center py-6">Select a sales order to preview items.</p>
                      )}
                      {watchedLineItems.length > 0 && (
                          <div className="flex justify-end items-center pt-4 border-t border-border/50 mt-2">
                              <span className="text-xs text-muted-foreground mr-3 uppercase tracking-widest font-bold">Grand Total:</span>
                              <span className="font-extrabold text-2xl text-primary font-mono">₹{totalAmount.toFixed(2)}</span>
                          </div>
                      )}
                  </div>
                </div>

              <Button type="submit" disabled={isSubmitting || isLoading} className="w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20">
                {isSubmitting ? 'Processing...' : 'Finalize & Create Invoice'}
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}