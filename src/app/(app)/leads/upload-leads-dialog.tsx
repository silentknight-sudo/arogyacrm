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
import type { UserProfile } from '@/types';
import { FileInput } from '@/components/ui/file-input';
import { useCSVReader } from 'react-papaparse';
import { uploadLeads } from './lead-upload-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  assignedToId: z.string().min(1, 'You must assign the leads to a specialist.'),
});

type UploadLeadsDialogProps = {
  users: UserProfile[];
  isLoading: boolean;
  children: React.ReactNode;
};

export function UploadLeadsDialog({ children, users, isLoading }: UploadLeadsDialogProps) {
  const { toast } = useToast();
  const { currentUser, currentTeamspace } = useApp();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [importedLeads, setImportedLeads] = useState<any[]>([]);

  const { CSVReader } = useCSVReader();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignedToId: '',
    },
  });

  const handleUploadAccepted = (results: any) => {
    const data = results.data;
    if (!data || data.length === 0) return;

    // STRATEGIC AUTO-DISCOVERY: Scan rows to find the actual header line (skipping title rows)
    let headerIndex = -1;
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = data[i];
      if (!row || !Array.isArray(row)) continue;
      const hasFullName = row.some((cell: any) => (cell || '').toString().toLowerCase().includes('full_name'));
      const hasPhone = row.some((cell: any) => (cell || '').toString().toLowerCase().includes('phone_number'));
      
      if (hasFullName || hasPhone) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      toast({ 
        variant: 'destructive', 
        title: 'Header Identification Failed', 
        description: 'Could not find "full_name" or "phone_number" headers. Ensure your sheet matches the Meta export format.' 
      });
      return;
    }

    const header = data[headerIndex];
    const rows = data.slice(headerIndex + 1);
    
    // Filter out empty rows
    const validRows = rows.filter((row: any) => row.length > 1 && row.some((cell: any) => cell));

    const leads = validRows.map((row: string[]) => {
      const lead: any = {};
      header.forEach((key: string, index: number) => {
        if (key) {
          const cleanKey = (key || '').trim();
          lead[cleanKey] = row[index];
        }
      });
      return lead;
    });
    setImportedLeads(leads);
  };

  // FUZZY LOOKUP FOR PREVIEW
  const getFuzzyVal = (lead: any, keys: string[]) => {
    const found = Object.keys(lead).find(k => 
      keys.some(pk => k.toLowerCase().trim() === pk.toLowerCase().trim())
    );
    const val = found ? lead[found] : '';
    return (val || '').toString();
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'Active workspace context required.' });
      return;
    }
    if(importedLeads.length === 0){
        toast({ variant: 'destructive', title: 'Error', description: 'Please upload a valid CSV file with recognizable headers.' });
        return;
    }

    startTransition(async () => {
      const result = await uploadLeads({
        rawLeads: importedLeads,
        assignedToId: values.assignedToId,
        teamspaceId: currentTeamspace.id,
      });

      if (result.success) {
        toast({
          title: 'Import Successful',
          description: `${result.count} prospects have been successfully synchronized.`,
        });
        setOpen(false);
        form.reset();
        setImportedLeads([]);
      } else {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: result.error,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-5xl rounded-[2.5rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-primary">Strategic Lead Ingestion</DialogTitle>
          <DialogDescription className="font-medium">
            Upload your Meta Ads sheet. We automatically skip title rows and extract core contact details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="space-y-6">
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <CSVReader onUploadAccepted={handleUploadAccepted}>
                        {({ getRootProps, acceptedFile, ProgressBar }: any) => (
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Source File (CSV)</Label>
                                <FileInput {...getRootProps()} className="bg-muted/20 border-primary/10 hover:bg-muted/30 transition-all h-32">
                                    {acceptedFile ? (
                                        <span className="font-bold text-primary">{acceptedFile.name}</span>
                                    ) : 'Drop Meta Lead Sheet Here'}
                                </FileInput>
                                <ProgressBar className="bg-primary h-1 rounded-full" />
                            </div>
                        )}
                    </CSVReader>

                    <FormField
                    control={form.control}
                    name="assignedToId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Assigned Specialist</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                            <SelectTrigger disabled={isLoading} className="rounded-xl h-12 bg-muted/20 border-none">
                                <SelectValue placeholder={isLoading ? 'Loading hierarchy...' : 'Select recipient'} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                            {users.length > 0 ? users.map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                {user.displayName} ({user.role.replace(/_/g, ' ')})
                                </SelectItem>
                            )) : (
                                <div className="p-4 text-center text-xs text-muted-foreground italic">No eligible specialists found.</div>
                            )}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={isPending || users.length === 0} className="w-full h-14 rounded-2xl herbal-gradient font-black shadow-xl gold-glow">
                    {isPending ? 'Ingesting Leads...' : 'Finalize Batch Ingestion'}
                    </Button>
                </form>
                </Form>
            </div>
            <div>
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Data Verification Pulse</Label>
                <div className="rounded-[2rem] border bg-muted/10 p-1 mt-3 shadow-inner">
                    <ScrollArea className="h-[400px]">
                        <div className="p-4 space-y-4">
                            {importedLeads.length > 0 ? (
                                importedLeads.map((lead, index) => (
                                    <div key={index} className="p-4 rounded-2xl bg-background border border-primary/5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-black opacity-40">Full Name</Label>
                                            <Input className="h-9 rounded-lg border-none bg-muted/30 text-xs font-bold" value={getFuzzyVal(lead, ['full_name', 'name'])} readOnly />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase font-black opacity-40">Phone Number</Label>
                                                <Input className="h-9 rounded-lg border-none bg-muted/30 text-xs font-bold" value={getFuzzyVal(lead, ['phone_number', 'phone']).replace(/^p:/i, '')} readOnly />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase font-black opacity-40">Email</Label>
                                                <Input className="h-9 rounded-lg border-none bg-muted/30 text-xs font-bold" value={getFuzzyVal(lead, ['email', 'mail'])} readOnly />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground text-center gap-2">
                                    <div className="p-4 rounded-full bg-muted/50 border border-dashed">
                                        <span className="text-xs font-medium">Verification Mode:</span>
                                        <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-40">Upload file to verify headers...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
