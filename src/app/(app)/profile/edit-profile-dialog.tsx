'use client';

import { useState, useEffect, useTransition } from 'react';
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
import { useApp } from '@/context/app-context';
import { useAuth, useFirestore } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';


const formSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  avatar: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

type EditProfileDialogProps = {
  children: React.ReactNode;
};

export function EditProfileDialog({ children }: EditProfileDialogProps) {
  const { toast } = useToast();
  const { currentUser } = useApp();
  const auth = useAuth();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: currentUser?.displayName || '',
      avatar: currentUser?.avatar || '',
    },
  });
  
  useEffect(() => {
    if (currentUser && open) {
        form.reset({
            displayName: currentUser.displayName || '',
            avatar: currentUser.avatar || '',
        });
    }
  }, [currentUser, form, open]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !auth.currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to edit your profile.' });
        return;
    }
    startTransition(async () => {
      try {
        const { displayName, avatar } = values;

        // Update Firebase Auth user profile
        await updateProfile(auth.currentUser!, { displayName, photoURL: avatar });

        // Update Firestore document
        const userDocRef = doc(firestore, 'users', currentUser.id);
        await updateDoc(userDocRef, {
          displayName,
          avatar,
          updatedAt: serverTimestamp(),
        });
        
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
        setOpen(false);

      } catch (error: any) {
        console.error('Error updating profile:', error);
        toast({
          variant: 'destructive',
          title: 'Error Updating Profile',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="displayName" render={({ field }) => (
                <FormItem><FormLabel>Display Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="avatar" render={({ field }) => (
                <FormItem><FormLabel>Avatar URL (Optional)</FormLabel><FormControl><Input placeholder="https://example.com/avatar.png" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
