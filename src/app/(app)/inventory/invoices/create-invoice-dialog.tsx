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
import { createInvoice } from './actions';
import { useApp } from '@/context/app-context';
import type { Account, SalesOrder, InvoiceStatus } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineItemSchema } from '../schemas';

const invoiceStatuses: InvoiceStatus[] = ['Draft', 'Sent', 'Paid', 'Partially Paid', 'Overdue', 'Voided'];

const formSchema = z.object({
  salesOrderId: z.string().min(1, 'Sales Order is required.'),
  invoiceDate: z.date({ required_error: 'Invoice date is required.' }),
  dueDate: z.date({ required_error: 'Due date is required.' }),
  status: z.enum(invoiceStatuses),
  lineItems: z.array(LineItemSchema).min(1, 'Invoice must have at least one line item.'),
});

type CreateInvoiceDialogProps = {
  children: React.ReactNode;
  accounts: Account[];
  salesOrders: SalesOrder[];
  isLoading: boolean;
};

export function CreateInvoiceDialog({ children, accounts, salesOrders, isLoading }: CreateInvoiceDialogProps) {
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

  const { fields } = useFieldArray({ control: form.control, name: 'lineItems' });
  const watchedSalesOrderId = form.watch('salesOrderId');

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
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace.' });
      return;
    }
    setIsSubmitting(true);
    
    const totalAmount = values.lineItems.reduce((sum, item) => sum + item.subtotal, 0);

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
      toast({
        title: 'Invoice Created',
        description: `Successfully created invoice.`,
      });
      setOpen(false);
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Creating Invoice',
        description: result.error,
      });
    }
    setIsSubmitting(false);
  };

  const totalAmount = form.watch('lineItems').reduce((acc, item) => acc + (item.subtotal || 0), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Generate an invoice from a sales order.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="salesOrderId" render={({ field }) => (
                    <FormItem><FormLabel>From Sales Order</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoading}><SelectValue placeholder={isLoading ? "Loading..." : "Select a sales order"} /></SelectTrigger></FormControl><SelectContent>{salesOrders.map(so => (<SelectItem key={so.id} value={so.id}>{so.orderNumber}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="invoiceDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Invoice Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="dueDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{invoiceStatuses.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />

                <div>
                    <FormLabel>Line Items</FormLabel>
                    <div className="space-y-2 mt-2 rounded-md border p-4">
                        {fields.length > 0 ? fields.map((field) => (
                        <div key={field.id} className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{field.productName}</p>
                                <p className="text-sm text-muted-foreground">
                                    {field.quantity} x ₹{field.unitPrice.toFixed(2)}
                                </p>
                            </div>
                            <p className="font-medium">₹{field.subtotal.toFixed(2)}</p>
                        </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center">Select a sales order to see line items.</p>
                        )}
                        {fields.length > 0 && (
                            <div className="flex justify-end items-center pt-4 mt-4 border-t">
                                <span className="text-muted-foreground mr-2">Total:</span>
                                <span className="font-bold text-lg">₹{totalAmount.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                    <FormMessage>{form.formState.errors.lineItems?.message}</FormMessage>
                </div>

              <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">
                {isSubmitting ? 'Creating Invoice...' : 'Create Invoice'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
    