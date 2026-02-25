'use server';
import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { z } from 'zod';
import type { RawLead } from '@/types';
import { revalidatePath } from 'next/cache';

const UploadLeadsSchema = z.object({
  rawLeads: z.array(z.any()), // Keeping it flexible for now
  assignedToId: z.string().min(1),
  teamspaceId: z.string().min(1),
});

export type UploadLeadsInput = z.infer<typeof UploadLeadsSchema>;
type UploadLeadsResult = { success: boolean; error?: string; count?: number };

export async function uploadLeads(values: UploadLeadsInput): Promise<UploadLeadsResult> {
  try {
    const { rawLeads, assignedToId, teamspaceId } = UploadLeadsSchema.parse(values);

    if (!rawLeads || rawLeads.length === 0) {
      throw new Error('No leads to import.');
    }
    
    const batch = adminDb.batch();

    for (const rawLead of rawLeads) {
      const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc();
      
      const newLeadData = {
        id: leadRef.id,
        fullName: rawLead['Name'] || '',
        email: rawLead['Email address'] || '',
        phone: rawLead['Phone'] || '',
        source: rawLead['Source'] || 'Meta Ads',
        status: 'New',
        assignedToId: assignedToId,
        teamspaceId: teamspaceId,
        attributionFields: JSON.stringify({
            'form': rawLead['Form'],
            'channel': rawLead['Channel'],
        }),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      batch.set(leadRef, newLeadData);
    }
    
    await batch.commit();

    revalidatePath('/leads');

    return { success: true, count: rawLeads.length };

  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}
