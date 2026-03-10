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
import { useApp } from '@/context/app-context';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Product } from '@/types';

const leadStatuses = ['new', 'pending', 'busy', 'done', 'canceled'] as const;
const leadSources = ['Website', 'Referral', 'Cold Call', 'Advertisement', 'Social Media', 'Other'];

const formSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  age: z.coerce.number().positive().int().optional(),
  phone: z.string().min(1, 'Phone number is required.'),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  productAsked: z.array(z.string()).default([]),
  source: z.string().optional(),
  status: z.enum(['new', 'pending', 'busy', 'done', 'canceled']),
  attributionFields: z.string().optional(),
});

type CreateLeadDialogProps = {
  children: React.ReactNode;
  products: Product[];
  isLoading: boolean;
};

export function CreateLeadDialog({ children, products, isLoading }: CreateLeadDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      productAsked: [],
      source: '',
      status: 'new',
      attributionFields: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
        toast({ variant: 'destructive', title: 'Error', description: 'Active workspace context required.' });
        return;
    }
    startTransition(async () => {
      try {
        const leadsRef = collection(firestore, 'teamspaces', currentTeamspace.id, 'leads');
        await addDoc(leadsRef, {
            ...values,
            assignedToIds: [currentUser.id],
            teamspaceId: currentTeamspace.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        toast({
          title: 'Lead Created',
          description: `Successfully added "${values.fullName}" to the new queue.`,
        });
        setOpen(false);
        form.reset();
      } catch (error: any) {
         console.error("Error creating lead: ", error);
         toast({
          variant: 'destructive',
          title: 'Error Creating Lead',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Add Strategic Prospect</DialogTitle>
          <DialogDescription>
            Register a new lead and their product interests.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[75vh] pr-4">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+91 98765 43210" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email (Optional)</FormLabel><FormControl><Input type="email" placeholder="john.doe@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormField
                  control={form.control}
                  name="productAsked"
                  render={({ field }) => (
                    <FormItem>
                        <div className="mb-2">
                            <FormLabel className="text-base font-bold text-primary">Product Interests</FormLabel>
                        </div>
                        <div className="rounded-2xl border bg-muted/20 p-4 shadow-inner">
                            <ScrollArea className="h-40">
                                <div className="space-y-3">
                                {isLoading ? (
                                    <div className="py-4 text-center text-xs animate-pulse">Loading catalog...</div>
                                ) : products.length > 0 ? (
                                    products.map((product) => (
                                        <div key={product.id} className="flex flex-row items-center space-x-3 space-y-0 group">
                                            <Checkbox
                                                id={`prod-${product.id}`}
                                                checked={field.value?.includes(product.id)}
                                                onCheckedChange={(checked) => {
                                                    return checked
                                                        ? field.onChange([...(field.value || []), product.id])
                                                        : field.onChange(field.value?.filter(v => v !== product.id))
                                                }}
                                                className="rounded-full h-5 w-5 border-2"
                                            />
                                            <label htmlFor={`prod-${product.id}`} className="text-sm font-medium cursor-pointer group-hover:text-primary transition-colors flex flex-col">
                                                {product.name}
                                                <span className="text-[10px] text-muted-foreground uppercase font-black">{product.category}</span>
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-xs text-muted-foreground py-8">No products in catalog.</div>
                                )}
                                </div>
                            </ScrollArea>
                        </div>
                        <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="source" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Lead Source</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Select source" /></SelectTrigger></FormControl>
                                <SelectContent>{leadSources.map(source => (<SelectItem key={source} value={source}>{source}</SelectItem>))}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Initial Stage</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="rounded-xl uppercase font-black text-[10px] tracking-widest">
                                <SelectValue />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {leadStatuses.map(status => (
                                <SelectItem key={status} value={status} className="uppercase font-black text-[10px] tracking-widest">{status}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <Button type="submit" disabled={isPending} className="w-full h-14 rounded-2xl herbal-gradient shadow-xl text-lg font-bold">
                    {isPending ? 'Processing...' : 'Register Prospect'}
                </Button>
            </form>
            </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
