
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
import { createPurchaseOrder } from './actions';
import { useApp } from '@/context/app-context';
import type { Product, UserProfile, PurchaseOrderStatus } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineItemSchema } from '../schemas';

const purchaseOrderStatuses: PurchaseOrderStatus[] = ['Pending', 'Ordered', 'Received', 'Cancelled'];

const formSchema = z.object({
  supplierName: z.string().min(2, 'Supplier name is required.'),
  orderDate: z.date({ required_error: 'Order date is required.' }),
  expectedDeliveryDate: z.date({ required_error: 'Expected delivery date is required.' }),
  status: z.enum(purchaseOrderStatuses),
  lineItems: z.array(LineItemSchema).min(1, 'Purchase Order must have at least one line item.'),
});

type CreatePurchaseOrderDialogProps = {
  children: React.ReactNode;
  users: UserProfile[];
  products: Product[];
  isLoading: boolean;
};

export function CreatePurchaseOrderDialog({ children, users, products, isLoading }: CreatePurchaseOrderDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierName: '',
      status: 'Pending',
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
        unitPrice: product.price, // Or a different cost price if available
        subtotal: product.price * currentItem.quantity,
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
    const result = await createPurchaseOrder({
      ...values,
      orderDate: values.orderDate.toISOString(),
      expectedDeliveryDate: values.expectedDeliveryDate.toISOString(),
      ownerId: currentUser.id,
      teamspaceId: currentTeamspace.id,
    });

    if (result.success) {
      toast({
        title: 'Purchase Order Created',
        description: `Successfully created purchase order.`,
      });
      setOpen(false);
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Creating Purchase Order',
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
          <DialogTitle>Create New Purchase Order</DialogTitle>
          <DialogDescription>
            Fill out the form to create a new purchase order.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField control={form.control} name="supplierName" render={({ field }) => (
                    <FormItem><FormLabel>Supplier Name</FormLabel><FormControl><Input placeholder="Global Ingredients Inc." {...field} /></FormControl><FormMessage /></FormItem>
                 )} />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="orderDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Order Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="expectedDeliveryDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Expected Delivery</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{purchaseOrderStatuses.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
                <div>
                  <FormLabel>Line Items</FormLabel>
                  <div className="space-y-2 mt-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2 p-2 border rounded-lg">
                        <div className="grid grid-cols-3 gap-2 flex-grow">
                            <Select onValueChange={(value) => handleProductChange(index, value)} defaultValue={field.productId}>
                                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a product" /></SelectTrigger>
                                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
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
                  <FormMessage>{form.formState.errors.lineItems?.message}</FormMessage>
                </div>
              <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">
                {isSubmitting ? 'Creating Order...' : 'Create Purchase Order'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
    
