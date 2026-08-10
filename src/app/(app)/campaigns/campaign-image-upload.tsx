'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

type CampaignImageUploadProps = {
  label: string;
  description: string;
  value?: string;
  onChange: (url: string) => void;
  teamspaceId?: string;
  assetType: 'hero' | 'product' | 'secondary';
};

export function CampaignImageUpload({ label, description, value, onChange, teamspaceId, assetType }: CampaignImageUploadProps) {
  const auth = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Please sign in again before uploading.');
      const payload = new FormData();
      payload.set('file', file);
      payload.set('teamspaceId', teamspaceId || 'slt');
      payload.set('assetType', assetType);
      const response = await fetch('/api/campaign-assets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        body: payload,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed.');
      onChange(result.url);
      toast({ title: 'Image uploaded', description: `${label} is ready for the live landing page.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error?.message || 'Please try again.' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-primary/15 bg-background p-4">
      <div>
        <p className="font-bold text-primary">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {value ? (
        <div className="group relative overflow-hidden rounded-xl border bg-muted">
          <img src={value} alt={label} className="h-48 w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/75 to-transparent p-3 pt-12">
            <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>Replace</Button>
            <Button type="button" size="icon" variant="destructive" onClick={() => onChange('')}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); void upload(event.dataTransfer.files[0]); }}
          className={`flex h-48 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${dragging ? 'border-primary bg-primary/10' : 'border-primary/20 bg-muted/30 hover:border-primary/50'}`}
        >
          {uploading ? <Loader2 className="h-9 w-9 animate-spin text-primary" /> : <UploadCloud className="h-9 w-9 text-primary" />}
          <span className="mt-3 font-bold">{uploading ? 'Uploading securely...' : 'Drop image here or browse'}</span>
          <span className="mt-1 text-xs text-muted-foreground">JPG, PNG or WebP, maximum 8 MB</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void upload(event.target.files?.[0])} />
      <div className="relative">
        <ImagePlus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder="Or paste an HTTPS image URL" className="pl-9" />
      </div>
    </div>
  );
}
