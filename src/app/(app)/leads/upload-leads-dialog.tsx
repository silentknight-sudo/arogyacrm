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
import type { UserProfile, RawLead } from '@/types';
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
  assignedToId: z.string().min(1, 'You must assign the leads to a user.'),
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
  const [importedLeads, setImportedLeads] = useState<RawLead[]>([]);

  const { CSVReader } = useCSVReader();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assignedToId: '',
    },
  });

  const handleUploadAccepted = (results: any) => {
    const header = results.data[0];
    const data = results.data.slice(1);
    
    // Filter out empty rows
    const validRows = data.filter((row: any) => row.length > 1 && row.some((cell: any) => cell));

    const leads: RawLead[] = validRows.map((row: string[]) => {
      const lead: any = {};
      header.forEach((key: string, index: number) => {
        const cleanKey = key.trim();
        lead[cleanKey] = row[index];
      });
      return lead as RawLead;
    });
    setImportedLeads(leads);
  };

  const handleLeadFieldChange = (index: number, field: keyof RawLead, value: string) => {
    const updatedLeads = [...importedLeads];
    updatedLeads[index][field] = value;
    setImportedLeads(updatedLeads);
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !currentTeamspace) {
      toast({ variant: 'destructive', title: 'Error', description: 'Active session required.' });
      return;
    }
    if(importedLeads.length === 0){
        toast({ variant: 'destructive', title: 'Error', description: 'Please upload a CSV file with Meta Ads leads.' });
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
          description: `${result.count} strategic prospects have been ingested.`,
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
      <DialogContent className="sm:max-w-4xl rounded-[2.5rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-primary">Strategic Bulk Ingestion</DialogTitle>
          <DialogDescription className="font-medium">
            Upload CSV from Meta Ads Lead Gen. We'll automatically map full_name, email, and platform source.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="space-y-6">
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <CSVReader onUploadAccepted={handleUploadAccepted}>
                        {({ getRootProps, acceptedFile, ProgressBar }: any) => (
                            <div className="space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Source Data (CSV)</Label>
                                <FileInput {...getRootProps()} className="bg-muted/20 border-primary/10 hover:bg-muted/30 transition-all h-32">
                                    {acceptedFile ? (
                                        <span className="font-bold text-primary">{acceptedFile.name}</span>
                                    ) : 'Drop Meta Ads export here'}
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
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Target Recipient</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                            <SelectTrigger disabled={isLoading} className="rounded-xl h-12 bg-muted/20 border-none">
                                <SelectValue placeholder={isLoading ? 'Loading hierarchy...' : 'Select wellness specialist'} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                            {users.length > 0 ? users.map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                {user.displayName} ({user.role.replace(/_/g, ' ')})
                                </SelectItem>
                            )) : (
                                <div className="p-4 text-center text-xs text-muted-foreground italic">No authorized recipients found.</div>
                            )}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={isPending || users.length === 0} className="w-full h-14 rounded-2xl herbal-gradient font-black shadow-xl gold-glow">
                    {isPending ? 'Processing Ingestion...' : 'Finalize Import and Assign'}
                    </Button>
                </form>
                </Form>
            </div>
            <div>
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Data Verification Pulse</Label>
                <div className="rounded-[2rem] border bg-muted/10 p-1 mt-3 shadow-inner">
                    <ScrollArea className="h-[350px]">
                        <div className="p-4 space-y-4">
                            {importedLeads.length > 0 ? (
                                importedLeads.map((lead, index) => (
                                    <div key={index} className="p-4 rounded-2xl bg-background border border-primary/5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase font-black opacity-40">Full Name</Label>
                                                <Input className="h-9 rounded-lg border-none bg-muted/30 text-xs font-bold" value={lead.full_name} onChange={e => handleLeadFieldChange(index, 'full_name', e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase font-black opacity-40">Phone Number</Label>
                                                <Input className="h-9 rounded-lg border-none bg-muted/30 text-xs font-bold" value={lead.phone_number} onChange={e => handleLeadFieldChange(index, 'phone_number', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase font-black opacity-40">Digital Identity</Label>
                                            <Input className="h-9 rounded-lg border-none bg-muted/30 text-xs font-bold" value={lead.email} onChange={e => handleLeadFieldChange(index, 'email', e.target.value)} />
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Source: {lead.platform || 'Unknown'}</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Ready for sync</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-center gap-2">
                                    <div className="p-4 rounded-full bg-muted/50 border border-dashed">
                                        <Input type="file" className="hidden" />
                                        <span className="text-xs font-medium">Verify your CSV headers match:</span>
                                        <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-40">full_name, email, phone_number, platform</p>
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
