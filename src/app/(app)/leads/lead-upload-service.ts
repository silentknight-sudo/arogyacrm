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
      
      // STRATEGIC CLEANING: Handle Meta Ads phone prefix artifact (p:+91...)
      const cleanPhone = (rawLead['phone_number'] || '').toString().replace(/^p:/, '').trim();
      
      const newLeadData = {
        id: id,
        fullName: rawLead['full_name'] || 'Unknown Prospect',
        email: rawLead['email'] || '',
        phone: cleanPhone || '',
        source: rawLead['platform'] || 'Meta Ads',
        status: 'new',
        assignedToIds: [assignedToId],
        teamspaceId: teamspaceId,
        reassigned: false,
        attributionFields: JSON.stringify({
            'campaign': rawLead['campaign_name'],
            'ad': rawLead['ad_name'],
            'form': rawLead['form_name'],
            'platform': rawLead['platform'],
        }),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      batch.set(leadRef, newLeadData);
    }
    
    await batch.commit();

    /**
     * PERSISTENT NOTIFICATION: Informed unit-based alert
     */
    await adminDb.collection('users').doc(assignedToId).collection('notifications').add({
        title: `you got ${rawLeads.length} new leads`,
        description: `Successfully imported ${rawLeads.length} strategic prospects from marketing platforms.`,
        type: 'lead_assigned',
        timestamp: new Date().toISOString(),
        read: false,
        link: '/leads'
    });

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
