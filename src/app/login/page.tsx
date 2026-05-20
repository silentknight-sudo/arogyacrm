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
import { Sparkles, ShieldCheck, TrendingUp, Zap, Leaf } from 'lucide-react';

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
        title: 'Executive Session Initiated',
        description: 'Welcome to the Arogya Elite operational center.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error', error);
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'Verify your elite credentials.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-8 herbal-gradient rounded-[2.5rem] animate-pulse gold-glow">
            <Leaf className="h-12 w-12 text-accent" />
          </div>
          <Skeleton className="h-8 w-48 rounded-lg bg-primary/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center p-20 zen-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,212,59,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(74,222,128,0.14),transparent_28%)]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/12 rounded-full -mr-64 -mt-64 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/8 rounded-full -ml-48 -mb-48 blur-2xl" />

        <div className="relative z-10 space-y-16">
          <div className="flex items-center gap-6">
            <div className="p-6 bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 shadow-2xl">
              <Sparkles className="h-12 w-12 text-accent fill-accent" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-white">AROGYA ELITE</h1>
          </div>

          <div className="space-y-8">
            <h2 className="text-7xl font-black leading-[1.1] tracking-tighter text-white">
              Precision CRM for <br />
              <span className="text-[#F7D14A] italic">Wellness Leaders.</span>
            </h2>
            <p className="text-2xl text-white/88 max-w-xl font-medium leading-relaxed">
              Automated lead prioritization and high-velocity distribution
              for the modern Ayurvedic enterprise.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-10">
            <div className="p-8 rounded-[2.5rem] bg-white/10 border border-white/15 backdrop-blur-sm shadow-xl">
              <ShieldCheck className="h-8 w-8 text-[#F7D14A] mb-4" />
              <p className="font-black text-xl text-white">Elite Security</p>
              <p className="text-sm text-white/80 font-medium">Bypass-resistant encryption.</p>
            </div>
            <div className="p-8 rounded-[2.5rem] bg-white/10 border border-white/15 backdrop-blur-sm shadow-xl">
              <TrendingUp className="h-8 w-8 text-[#F7D14A] mb-4" />
              <p className="font-black text-xl text-white">Velocity Engine</p>
              <p className="text-sm text-white/80 font-medium">Top-of-stack distribution.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-background relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="w-full max-w-md space-y-12 relative z-10">
          <div className="text-center space-y-2 lg:hidden">
            <div className="flex justify-center mb-8">
              <div className="p-6 herbal-gradient rounded-[2.5rem] gold-glow">
                <Sparkles className="h-12 w-12 text-accent fill-accent" />
              </div>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-primary">Arogya CRM</h1>
          </div>

          <Card className="border-none shadow-[0_40px_100px_rgba(0,0,0,0.1)] rounded-[3.5rem] overflow-hidden bg-white/95 backdrop-blur-3xl border border-white/20">
            <CardHeader className="text-center pt-16 pb-8">
              <CardTitle className="text-4xl font-black text-primary tracking-tighter">Elite Portal</CardTitle>
              <CardDescription className="font-black text-xs uppercase tracking-[0.3em] text-muted-foreground mt-3 opacity-60">
                Authorized Command Center
              </CardDescription>
            </CardHeader>
            <CardContent className="px-12 pb-16 pt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/40 ml-1">
                          Email Terminal
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@arogyabio.com"
                            {...field}
                            className="h-16 rounded-2xl bg-muted/30 border-none shadow-inner font-bold text-xl px-6 focus-visible:ring-primary/20"
                          />
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
                        <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/40 ml-1">
                          Secret Sequence
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            className="h-16 rounded-2xl bg-muted/30 border-none shadow-inner font-bold text-xl px-6 focus-visible:ring-primary/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-20 rounded-[2.5rem] herbal-gradient shadow-2xl shadow-primary/40 font-black text-2xl gold-glow active:scale-95 transition-all group"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Verifying Credentials...' : (
                      <span className="flex items-center gap-4">
                        Initiate Session <Zap className="h-6 w-6 fill-accent text-accent group-hover:scale-125 transition-transform" />
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="text-center space-y-2">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] italic opacity-40">
              Encrypted Operational Endpoint
            </p>
            <p className="text-[9px] text-primary font-black uppercase tracking-widest">
              v2.1 Elite Governance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}