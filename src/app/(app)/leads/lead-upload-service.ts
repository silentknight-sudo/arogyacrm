'use server';
import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { syncDealForLead } from './actions';
import type { RawLead } from '@/types';

const UploadLeadsSchema = z.object({
  rawLeads: z.array(z.any()),
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
    
    const createdLeadIds: string[] = [];
    const batch = adminDb.batch();

    for (const rawLead of (rawLeads as RawLead[])) {
      const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc();
      const id = leadRef.id;
      createdLeadIds.push(id);
      
      const newLeadData = {
        id: id,
        fullName: rawLead['Name'] || 'Unknown Prospect',
        email: rawLead['Email address'] || '',
        phone: rawLead['Phone'] || '',
        source: rawLead['Source'] || 'Meta Ads',
        status: 'new',
        assignedToIds: [assignedToId],
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

    /**
     * AUTOMATIC CONVERSION: Initiate deals for all imported leads
     */
    for (const id of createdLeadIds) {
      await syncDealForLead(id, teamspaceId);
    }

    revalidatePath('/leads');
    revalidatePath('/deals');

    return { success: true, count: rawLeads.length };

  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}
