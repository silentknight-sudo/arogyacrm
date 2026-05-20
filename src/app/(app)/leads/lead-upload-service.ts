'use server';
import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

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
      throw new Error('No leads detected in the ingestion batch.');
    }
    
    const chunks = [];
    for (let i = 0; i < rawLeads.length; i += 500) {
        chunks.push(rawLeads.slice(i, i + 500));
    }

    for (const chunk of chunks) {
        const batch = adminDb.batch();
        
        for (const rawLead of chunk) {
            const getVal = (possibleKeys: string[]) => {
                const foundKey = Object.keys(rawLead).find(k => 
                    possibleKeys.some(pk => k.toLowerCase().trim() === pk.toLowerCase().trim())
                );
                return foundKey ? rawLead[foundKey] : '';
            };

            const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc();
            const id = leadRef.id;
            
            const rawPhone = (getVal(['phone_number', 'phone', 'contact_number']) || '').toString();
            const cleanPhone = rawPhone.replace(/^p:/i, '').trim();
            
            const newLeadData = {
                id: id,
                fullName: getVal(['full_name', 'name', 'customer_name']) || 'New Prospect',
                email: getVal(['email', 'email_address', 'mail']) || '',
                phone: cleanPhone || '',
                source: getVal(['campaign_name', 'platform', 'source']) || 'Meta Ads',
                status: 'new',
                assignedToIds: [assignedToId],
                teamspaceId: teamspaceId,
                reassigned: false,
                createdAt: getVal(['created_time', 'created_at']) || FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            };
            
            batch.set(leadRef, newLeadData);
        }
        await batch.commit();
    }

    // Trigger high-intensity alert pulse for the assigned specialist
    await adminDb.collection('users').doc(assignedToId).collection('notifications').add({
        title: `you got ${rawLeads.length} new leads`,
        description: `Successfully ingested ${rawLeads.length} prospects from Meta Ads.`,
        type: 'lead_assigned',
        timestamp: new Date().toISOString(),
        read: false,
        link: '/leads'
    });

    revalidatePath('/leads');
    revalidatePath('/deals');

    return { success: true, count: rawLeads.length };

  } catch (error: any) {
    const errorMessage = handleAdminSDKError(error);
    return { success: false, error: errorMessage };
  }
}
