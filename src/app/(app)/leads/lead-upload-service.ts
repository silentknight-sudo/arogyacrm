'use server';
import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { syncDealForLead } from './actions';

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
            createdLeadIds.push(id);
            
            const rawPhone = (getVal(['phone_number', 'phone', 'contact_number']) || '').toString();
            const cleanPhone = rawPhone.replace(/^p:/i, '').trim();

            const rawSecondary = (getVal(['secondary_phone_number', 'secondary phone', 'secondary phone number']) || '').toString();
            const cleanSecondary = rawSecondary.replace(/^p:/i, '').trim();

            const rawWhatsapp = (getVal(['whatsapp_number', 'whatsapp number']) || '').toString();
            const cleanWhatsapp = rawWhatsapp.replace(/^p:/i, '').trim();
            
            const newLeadData = {
                id: id,
                fullName: getVal(['full_name', 'name', 'customer_name']) || 'New Prospect',
                email: getVal(['email', 'email_address', 'mail']) || '',
                phone: cleanPhone || '',
                secondaryPhone: cleanSecondary || '',
                whatsappNumber: cleanWhatsapp || '',
                source: getVal(['source']) || 'Paid',
                formName: getVal(['form', 'form_name']) || '',
                channel: getVal(['channel']) || 'Phone number',
                status: 'new',
                assignedToIds: [assignedToId],
                teamspaceId: teamspaceId,
                reassigned: false,
                labels: [],
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            };
            
            batch.set(leadRef, newLeadData);
        }
        await batch.commit();
    }

    await adminDb.collection('users').doc(assignedToId).collection('notifications').add({
        title: `you got ${rawLeads.length} new leads`,
        description: `Successfully ingested ${rawLeads.length} prospects according to updated strategic headers.`,
        type: 'lead_assigned',
        timestamp: new Date().toISOString(),
        read: false,
        link: '/leads'
    });

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
