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

    for (const rawLead of (rawLeads as any[])) {
      // STRATEGIC HELPER: Find value by case-insensitive key search
      const getVal = (possibleKeys: string[]) => {
        const foundKey = Object.keys(rawLead).find(k => 
          possibleKeys.some(pk => k.toLowerCase().trim() === pk.toLowerCase().trim())
        );
        return foundKey ? rawLead[foundKey] : '';
      };

      const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc();
      const id = leadRef.id;
      createdLeadIds.push(id);
      
      // DATA CLEANING: Handle phone artifacts
      const rawPhone = getVal(['phone_number', 'phone', 'contact_number', 'contact number']).toString();
      const cleanPhone = rawPhone.replace(/^p:/, '').trim();
      
      // CLINICAL INSIGHT: Map custom wellness questions
      const problemType = getVal(['aapko_kis_type_ka_problem_hai?', 'problem_type', 'type_of_problem', 'problem']);
      const duration = getVal(['how_long_have_you_been_experiencing_joint_pain?', 'duration', 'how_long']);
      const notes = [problemType, duration].filter(Boolean).join(' | ');

      const newLeadData = {
        id: id,
        fullName: getVal(['full_name', 'name', 'customer_name', 'full name']) || 'New Prospect',
        email: getVal(['email', 'email_address', 'mail']) || '',
        phone: cleanPhone || '',
        source: getVal(['platform', 'source', 'lead_source']) || 'Meta Ads',
        status: 'new',
        assignedToIds: [assignedToId],
        teamspaceId: teamspaceId,
        reassigned: false,
        notes: notes,
        demographicData: {
            country: getVal(['state', 'city', 'location', 'address']) || '',
            industry: '',
            companySize: '',
            jobTitle: ''
        },
        attributionFields: JSON.stringify({
            'campaign': getVal(['campaign_name', 'campaign']),
            'ad': getVal(['ad_name', 'ad']),
            'form': getVal(['form_name', 'form']),
            'platform': getVal(['platform']),
            'created_time': getVal(['created_time', 'time']),
            'meta_id': getVal(['id', 'lead_id', 'meta_id'])
        }),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      batch.set(leadRef, newLeadData);
    }
    
    await batch.commit();

    await adminDb.collection('users').doc(assignedToId).collection('notifications').add({
        title: `you got ${rawLeads.length} new leads`,
        description: `Successfully imported ${rawLeads.length} prospects from your Meta lead sheet.`,
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
