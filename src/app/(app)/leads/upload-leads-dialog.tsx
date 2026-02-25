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

const formSchema = z.object({
  assignedToId: z.string().min(1, 'You must assign the leads to a user.'),
});

type UploadLeadsDialogProps = {
  children: React.ReactNode;
  users: UserProfile[];
  isLoading: boolean;
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
  });

  const handleUploadAccepted = (results: any) => {
    const header = results.data[0];
    const data = results.data.slice(1);
    const leads: RawLead[] = data.map((row: string[]) => {
      const lead: RawLead = { 'Name': '', 'Email address': '', 'Phone': '', 'Source': '' };
      header.forEach((key: string, index: number) => {
        lead[key] = row[index];
      });
      return lead;
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
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    if(importedLeads.length === 0){
        toast({ variant: 'destructive', title: 'Error', description: 'Please upload a CSV file with leads.' });
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
          title: 'Leads Imported',
          description: `${result.count} leads have been successfully imported.`,
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
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Upload and Assign Leads</DialogTitle>
          <DialogDescription>
            Upload a CSV file from Meta Ads, review the leads, and assign them to a team lead.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <CSVReader onUploadAccepted={handleUploadAccepted}>
                        {({ getRootProps, acceptedFile, ProgressBar }: any) => (
                            <div className="space-y-2">
                                <FormLabel>Upload CSV</FormLabel>
                                <FileInput {...getRootProps()}>
                                    {acceptedFile ? acceptedFile.name : 'Click to upload a file'}
                                </FileInput>
                                <ProgressBar />
                            </div>
                        )}
                    </CSVReader>

                    <FormField
                    control={form.control}
                    name="assignedToId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Assign To Team Lead</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger disabled={isLoading}>
                                <SelectValue placeholder={isLoading ? 'Loading...' : 'Select a Team Lead'} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {users.filter(u => u.role === 'sales_team_lead').map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                {user.displayName}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? 'Importing...' : 'Import and Assign Leads'}
                    </Button>
                </form>
                </Form>
            </div>
            <div>
                <FormLabel>Review Imported Leads</FormLabel>
                <ScrollArea className="h-72 mt-2 rounded-md border">
                    <div className="p-4 space-y-4">
                        {importedLeads.length > 0 ? (
                            importedLeads.map((lead, index) => (
                                <div key={index} className="p-3 border rounded-lg space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input value={lead.Name} onChange={e => handleLeadFieldChange(index, 'Name', e.target.value)} placeholder="Name" />
                                        <Input value={lead.Phone} onChange={e => handleLeadFieldChange(index, 'Phone', e.target.value)} placeholder="Phone" />
                                    </div>
                                    <Input value={lead['Email address']} onChange={e => handleLeadFieldChange(index, 'Email address', e.target.value)} placeholder="Email" />
                                    <Input value={lead.Source} onChange={e => handleLeadFieldChange(index, 'Source', e.target.value)} placeholder="Source" />
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Upload a file to see a preview of the leads.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
