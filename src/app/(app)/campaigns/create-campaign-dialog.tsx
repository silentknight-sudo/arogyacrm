'use client';

import { useMemo, useState, useTransition } from 'react';
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
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createCampaign } from './actions';
import { useApp } from '@/context/app-context';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2 } from 'lucide-react';

const campaignStatuses = ['Planned', 'Active', 'Completed', 'Paused', 'Cancelled'] as const;
const campaignTypes = ['Landing Page Campaign', 'Social Media Ad', 'Event Promotion', 'Content Marketing', 'Referral Program'];
const fieldTypes = ['text', 'textarea', 'tel', 'email', 'number', 'select'] as const;

const fieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Field key is required.'),
  label: z.string().min(1, 'Field label is required.'),
  type: z.enum(fieldTypes),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(2, 'Campaign name must be at least 2 characters.'),
  type: z.string().min(2, 'Campaign type is required.'),
  status: z.enum(campaignStatuses),
  budget: z.coerce.number().min(0, 'Budget must be a positive number.'),
  budgetInterval: z.enum(['Daily', 'Weekly']),
  description: z.string().optional(),
  landingPageEnabled: z.boolean().default(true),
  landingPageStatus: z.enum(['draft', 'live']).default('live'),
  locale: z.enum(['hi', 'en']).default('hi'),
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  ctaText: z.string().optional(),
  productName: z.string().optional(),
  currentPrice: z.coerce.number().optional(),
  originalPrice: z.coerce.number().optional(),
  heroImageUrl: z.string().optional(),
  productImageUrl: z.string().optional(),
  secondaryImageUrl: z.string().optional(),
  primaryColor: z.string().default('#184f24'),
  accentColor: z.string().default('#f59e0b'),
  trustPointsText: z.string().optional(),
  benefitsText: z.string().optional(),
  testimonialsText: z.string().optional(),
  formTitle: z.string().optional(),
  formSubtitle: z.string().optional(),
  formFields: z.array(fieldSchema).default([]),
});

type CreateCampaignDialogProps = {
  children: React.ReactNode;
};

const defaultField = (name: string, label: string, type: typeof fieldTypes[number], required = false) => ({
  id: `${name}-${Math.random().toString(36).slice(2, 8)}`,
  name,
  label,
  type,
  placeholder: label,
  required,
  options: '',
});

export function CreateCampaignDialog({ children }: CreateCampaignDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'Active',
      type: 'Landing Page Campaign',
      budget: 5000,
      budgetInterval: 'Daily',
      landingPageEnabled: true,
      landingPageStatus: 'live',
      locale: 'hi',
      headline: 'जोड़ों के दर्द से छुटकारा पाएं!',
      subheadline: '100% आयुर्वेदिक गाउटहेल्थ ऑयल के साथ राहत, लचीलापन और बेहतर जीवन।',
      ctaText: 'अभी ऑर्डर करें',
      productName: 'Arogya Bio Gouthealth Oil',
      currentPrice: 1999,
      originalPrice: 2499,
      heroImageUrl: '',
      productImageUrl: '',
      secondaryImageUrl: '',
      primaryColor: '#184f24',
      accentColor: '#f59e0b',
      trustPointsText: '100% आयुर्वेदिक\nकोई साइड इफेक्ट नहीं\nCash on Delivery',
      benefitsText: 'जोड़ों और हड्डियों की देखभाल\nदर्द और सूजन में राहत\nलचीलापन बढ़ाने में सहायक\n100% आयुर्वेदिक फ़ॉर्मूला',
      testimonialsText: 'दर्द में राहत मिली और चलना आसान हुआ।\nघरेलू आयुर्वेदिक समाधान जैसा भरोसा।\nपरिवार में सभी के लिए उपयोगी अनुभव।',
      formTitle: 'अभी जानकारी भरें',
      formSubtitle: 'हमारी टीम जल्द आपसे संपर्क करेगी।',
      formFields: [
        defaultField('fullName', 'पूरा नाम', 'text', true),
        defaultField('phone', 'मोबाइल नंबर', 'tel', true),
        defaultField('city', 'शहर', 'text'),
        defaultField('painPoint', 'आपको कहाँ-कहाँ दर्द है?', 'textarea'),
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'formFields',
  });

  const watched = form.watch();

  const parsedBenefits = useMemo(
    () => (watched.benefitsText || '').split('\n').map((item) => item.trim()).filter(Boolean),
    [watched.benefitsText]
  );

  const parsedTrustPoints = useMemo(
    () => (watched.trustPointsText || '').split('\n').map((item) => item.trim()).filter(Boolean),
    [watched.trustPointsText]
  );

  const parsedTestimonials = useMemo(
    () => (watched.testimonialsText || '').split('\n').map((item) => item.trim()).filter(Boolean),
    [watched.testimonialsText]
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and in a teamspace.' });
      return;
    }

    startTransition(async () => {
      const result = await createCampaign({
        ...values,
        ownerId: currentUser.id,
        teamspaceId: currentTeamspace.id,
        benefits: values.benefitsText?.split('\n').map((item) => item.trim()).filter(Boolean) || [],
        trustPoints: values.trustPointsText?.split('\n').map((item) => item.trim()).filter(Boolean) || [],
        testimonials: values.testimonialsText?.split('\n').map((item) => item.trim()).filter(Boolean) || [],
        formFields: values.formFields.map((field) => ({
          id: field.id,
          name: field.name,
          label: field.label,
          type: field.type,
          placeholder: field.placeholder,
          required: field.required,
          options: field.options?.split('\n').map((item) => item.trim()).filter(Boolean) || [],
        })),
      });

      if (result.success) {
        toast({
          title: 'Campaign Created',
          description: `Successfully created campaign "${values.name}".`,
        });
        setOpen(false);
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Creating Campaign',
          description: result.error,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Build a real landing page with branded sections, images, pricing, and advanced lead-form fields.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[76vh] overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="setup" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="setup">Setup</TabsTrigger>
                  <TabsTrigger value="design">Design</TabsTrigger>
                  <TabsTrigger value="form">Form Builder</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="setup" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Campaign Name</FormLabel><FormControl><Input placeholder="Gout Health Combo" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem><FormLabel>Campaign Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl><SelectContent>{campaignTypes.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{campaignStatuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="budgetInterval" render={({ field }) => (
                      <FormItem><FormLabel>Budget Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select budget type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Daily">Daily Budget</SelectItem><SelectItem value="Weekly">Weekly Budget</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="budget" render={({ field }) => (
                      <FormItem><FormLabel>Budget (₹)</FormLabel><FormControl><Input type="number" placeholder="5000" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="locale" render={({ field }) => (
                      <FormItem><FormLabel>Landing Page Language</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select locale" /></SelectTrigger></FormControl><SelectContent><SelectItem value="hi">Hindi</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Objectives, audience, ad angle, product notes..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="landingPageEnabled" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-2xl border border-primary/10 bg-muted/20 p-4">
                      <div>
                        <FormLabel>Enable Live Landing Page</FormLabel>
                        <p className="text-xs font-medium text-muted-foreground">Use this campaign with Meta ads instead of instant forms.</p>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="landingPageStatus" render={({ field }) => (
                    <FormItem><FormLabel>Landing Page Status</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select landing status" /></SelectTrigger></FormControl><SelectContent><SelectItem value="live">Live</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </TabsContent>

                <TabsContent value="design" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="headline" render={({ field }) => (
                      <FormItem><FormLabel>Headline</FormLabel><FormControl><Textarea {...field} placeholder="जोड़ों के दर्द से छुटकारा पाएं!" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subheadline" render={({ field }) => (
                      <FormItem><FormLabel>Subheadline</FormLabel><FormControl><Textarea {...field} placeholder="100% आयुर्वेदिक देखभाल..." /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="productName" render={({ field }) => (
                      <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} placeholder="Arogya Bio Gouthealth Oil" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="ctaText" render={({ field }) => (
                      <FormItem><FormLabel>CTA Button Text</FormLabel><FormControl><Input {...field} placeholder="अभी ऑर्डर करें" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="currentPrice" render={({ field }) => (
                      <FormItem><FormLabel>Offer Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="originalPrice" render={({ field }) => (
                      <FormItem><FormLabel>Original Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="primaryColor" render={({ field }) => (
                      <FormItem><FormLabel>Primary Color</FormLabel><FormControl><Input type="color" {...field} className="h-12" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="accentColor" render={({ field }) => (
                      <FormItem><FormLabel>Accent Color</FormLabel><FormControl><Input type="color" {...field} className="h-12" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="heroImageUrl" render={({ field }) => (
                      <FormItem><FormLabel>Hero Image URL</FormLabel><FormControl><Input {...field} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="productImageUrl" render={({ field }) => (
                      <FormItem><FormLabel>Product Image URL</FormLabel><FormControl><Input {...field} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="secondaryImageUrl" render={({ field }) => (
                      <FormItem><FormLabel>Secondary Image URL</FormLabel><FormControl><Input {...field} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="benefitsText" render={({ field }) => (
                    <FormItem><FormLabel>Benefits (one per line)</FormLabel><FormControl><Textarea {...field} className="min-h-[120px]" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="trustPointsText" render={({ field }) => (
                    <FormItem><FormLabel>Trust Points (one per line)</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="testimonialsText" render={({ field }) => (
                    <FormItem><FormLabel>Testimonials (one per line)</FormLabel><FormControl><Textarea {...field} className="min-h-[120px]" /></FormControl><FormMessage /></FormItem>
                  )} />
                </TabsContent>

                <TabsContent value="form" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="formTitle" render={({ field }) => (
                      <FormItem><FormLabel>Form Title</FormLabel><FormControl><Input {...field} placeholder="अभी जानकारी भरें" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="formSubtitle" render={({ field }) => (
                      <FormItem><FormLabel>Form Subtitle</FormLabel><FormControl><Input {...field} placeholder="हमारी टीम जल्द आपसे संपर्क करेगी।" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <div className="space-y-4 rounded-2xl border border-primary/10 bg-muted/20 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-primary">Advanced Form Field Builder</p>
                        <p className="text-xs font-medium text-muted-foreground">Add and customize lead capture fields like a lightweight landing-page editor.</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => append(defaultField(`field${fields.length + 1}`, `Custom Field ${fields.length + 1}`, 'text'))}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Field
                      </Button>
                    </div>

                    {fields.map((field, index) => (
                      <div key={field.id} className="grid gap-3 rounded-2xl border border-primary/10 bg-background p-4 md:grid-cols-12">
                        <div className="md:col-span-3">
                          <FormField control={form.control} name={`formFields.${index}.label`} render={({ field }) => (
                            <FormItem><FormLabel>Label</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div className="md:col-span-2">
                          <FormField control={form.control} name={`formFields.${index}.name`} render={({ field }) => (
                            <FormItem><FormLabel>Key</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div className="md:col-span-2">
                          <FormField control={form.control} name={`formFields.${index}.type`} render={({ field }) => (
                            <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{fieldTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div className="md:col-span-3">
                          <FormField control={form.control} name={`formFields.${index}.placeholder`} render={({ field }) => (
                            <FormItem><FormLabel>Placeholder</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div className="md:col-span-1">
                          <FormField control={form.control} name={`formFields.${index}.required`} render={({ field }) => (
                            <FormItem><FormLabel>Required</FormLabel><FormControl><div className="flex h-10 items-center"><Switch checked={field.value} onCheckedChange={field.onChange} /></div></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <div className="md:col-span-1 flex items-end">
                          <Button type="button" variant="destructive" className="w-full rounded-xl" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {form.watch(`formFields.${index}.type`) === 'select' && (
                          <div className="md:col-span-12">
                            <FormField control={form.control} name={`formFields.${index}.options`} render={({ field }) => (
                              <FormItem><FormLabel>Select Options (one per line)</FormLabel><FormControl><Textarea {...field} className="min-h-[90px]" /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  <div
                    className="overflow-hidden rounded-[2rem] border border-primary/10 bg-white shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${watched.primaryColor}12 0%, #ffffff 50%, ${watched.accentColor}14 100%)`,
                    }}
                  >
                    <div className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr]">
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className="rounded-full px-4 py-2 font-black text-white" style={{ backgroundColor: watched.accentColor }}>
                            {watched.budgetInterval} Campaign
                          </Badge>
                          <Badge variant="outline">₹{watched.currentPrice || 1999}</Badge>
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: watched.primaryColor }}>Arogya Bio Landing</p>
                          <h3 className="text-4xl font-black leading-tight" style={{ color: watched.primaryColor }}>
                            {watched.headline || 'Campaign headline preview'}
                          </h3>
                          <p className="text-lg font-medium text-slate-600">
                            {watched.subheadline || 'Subheadline preview'}
                          </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: watched.primaryColor }}>
                            <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">Offer</p>
                            <div className="mt-3 flex items-end gap-3">
                              <span className="text-xl font-black line-through text-white/50">₹{watched.originalPrice || 2499}</span>
                              <span className="text-4xl font-black">₹{watched.currentPrice || 1999}</span>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-primary/10 bg-white p-5">
                            <p className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: watched.primaryColor }}>Trust Points</p>
                            <ul className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
                              {parsedTrustPoints.slice(0, 3).map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        {!!parsedBenefits.length && (
                          <div className="grid gap-3 md:grid-cols-2">
                            {parsedBenefits.slice(0, 4).map((benefit) => (
                              <div key={benefit} className="rounded-xl border border-primary/10 bg-white/90 p-4 text-sm font-bold text-slate-700">
                                {benefit}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {[watched.heroImageUrl, watched.productImageUrl].filter(Boolean).map((image) => (
                            <div key={image} className="overflow-hidden rounded-2xl border border-primary/10 bg-slate-50">
                              <img src={image} alt="Campaign preview" className="h-48 w-full object-cover" />
                            </div>
                          ))}
                        </div>
                        <div className="rounded-[2rem] border border-primary/10 bg-white p-5 shadow-lg">
                          <p className="text-lg font-black" style={{ color: watched.primaryColor }}>{watched.formTitle || 'Form Title'}</p>
                          <p className="mt-1 text-sm font-medium text-slate-500">{watched.formSubtitle || 'Form subtitle'}</p>
                          <div className="mt-4 space-y-3">
                            {watched.formFields.map((field) => (
                              <div key={field.id} className="rounded-xl border border-primary/10 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                                {field.label} {field.required ? '*' : ''}
                              </div>
                            ))}
                            <Button type="button" className="h-12 w-full rounded-2xl font-black text-white" style={{ backgroundColor: watched.primaryColor }}>
                              {watched.ctaText || 'CTA'}
                            </Button>
                          </div>
                        </div>
                        {!!parsedTestimonials.length && (
                          <div className="grid gap-3">
                            {parsedTestimonials.slice(0, 2).map((item) => (
                              <div key={item} className="rounded-xl border border-primary/10 bg-white/90 p-4 text-sm font-semibold text-slate-700">
                                “{item}”
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button type="submit" disabled={isPending} className="w-full rounded-2xl h-12 font-black">
                {isPending ? 'Creating Campaign...' : 'Create Campaign'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
