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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createRefund } from './actions';
import { useApp } from '@/context/app-context';
import type { SalesOrder, UserProfile, RefundStatus } from '@/types';

const refundStatuses: RefundStatus[] = ['Pending', 'Approved', 'Rejected', 'Processed', 'Cancelled'];

const formSchema = z.object({
    salesOrderId: z.string().min(1, 'Sales Order is required.'),
    reason: z.string().min(1, 'Reason is required.'),
    amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
    status: z.enum(refundStatuses),
});

type CreateRefundDialogProps = {
  children: React.ReactNode;
  salesOrders: SalesOrder[];
  users: UserProfile[];
  isLoading: boolean;
};

export function CreateRefundDialog({ children, salesOrders, users, isLoading }: CreateRefundDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: '',
      amount: 0,
      status: 'Pending',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace.' });
      return;
    }
    setIsSubmitting(true);
    const result = await createRefund({
      ...values,
      requestedById: currentUser.id,
      teamspaceId: currentTeamspace.id,
    });

    if (result.success) {
      toast({
        title: 'Refund Request Created',
        description: `Successfully created refund request.`,
      });
      setOpen(false);
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Creating Refund',
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
          <DialogTitle>Create Refund Request</DialogTitle>
          <DialogDescription>
            Fill out the details to request a refund.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               <FormField control={form.control} name="salesOrderId" render={({ field }) => (
                <FormItem><FormLabel>Sales Order</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger disabled={isLoading}><SelectValue placeholder={isLoading ? "Loading..." : "Select an order"} /></SelectTrigger></FormControl><SelectContent>{salesOrders.map(so => (<SelectItem key={so.id} value={so.id}>{so.orderNumber}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="reason" render={({ field }) => (
                <FormItem><FormLabel>Reason</FormLabel><FormControl><Input placeholder="Customer returning product" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>Amount (₹)</FormLabel><FormControl><Input type="number" placeholder="100.00" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{refundStatuses.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                )} />
              </div>
              <Button type="submit" disabled={isSubmitting || isLoading} className="w-full">
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
    