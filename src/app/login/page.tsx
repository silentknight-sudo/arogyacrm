'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Leaf, ShieldCheck, TrendingUp, Package } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Authorized Access Granted',
        description: "Welcome back to the Arogya operational center.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error', error);
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'Please verify your professional credentials.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isUserLoading || user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#F5F9F4]">
            <div className="flex flex-col items-center space-y-4">
                <div className="p-6 herbal-gradient rounded-[2rem] animate-pulse">
                    <Leaf className="h-12 w-12 text-white" />
                </div>
                <Skeleton className="h-8 w-48 rounded-lg" />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F9F4] grid lg:grid-cols-2">
      {/* BRANDING SECTION (SEO Meat) */}
      <div className="hidden lg:flex flex-col justify-center p-16 herbal-gradient text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full -ml-32 -mb-32 blur-2xl" />
        
        <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                    <Leaf className="h-8 w-8 text-accent" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter">AROGYA PREMIUM</h1>
            </div>
            
            <div className="space-y-6">
                <h2 className="text-6xl font-black leading-tight tracking-tighter">
                    Enterprise Excellence for <br />
                    <span className="text-accent">Ayurvedic Wellness.</span>
                </h2>
                <p className="text-xl text-white/70 max-w-lg font-medium leading-relaxed">
                    The industry-leading CRM platform designed specifically for Ayurvedic supplement management, 
                    lead scoring, and high-velocity distribution.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-8">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <ShieldCheck className="h-6 w-6 text-accent mb-3" />
                    <p className="font-bold">Secure Data</p>
                    <p className="text-xs text-white/50">Enterprise-grade encryption.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <TrendingUp className="h-6 w-6 text-accent mb-3" />
                    <p className="font-bold">Growth Engine</p>
                    <p className="text-xs text-white/50">Automated lead prioritization.</p>
                </div>
            </div>
        </div>
      </div>

      {/* LOGIN SECTION */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2 lg:hidden">
             <div className="flex justify-center mb-4">
                <div className="p-4 herbal-gradient rounded-2xl">
                    <Leaf className="h-8 w-8 text-white" />
                </div>
             </div>
             <h1 className="text-3xl font-black tracking-tight text-primary">Arogya CRM</h1>
          </div>

          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl border border-white">
            <CardHeader className="text-center pt-10">
              <CardTitle className="text-2xl font-black text-primary">Professional Portal</CardTitle>
              <CardDescription className="font-medium">Enter your secure credentials to continue.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="name@arogya.com" {...field} className="h-12 rounded-xl bg-muted/30 border-none shadow-inner" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Secret Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="h-12 rounded-xl bg-muted/30 border-none shadow-inner" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-14 rounded-2xl herbal-gradient shadow-xl shadow-primary/30 font-black text-lg gold-glow" disabled={isSubmitting}>
                    {isSubmitting ? 'Authenticating...' : 'Sign In to Hub'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <p className="text-center text-sm text-muted-foreground font-medium italic">
            Private Enterprise System. Unauthorized access is strictly monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
