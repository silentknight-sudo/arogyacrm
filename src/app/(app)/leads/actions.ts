'use server';

import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { aiLeadScoringAndPrioritization, AiLeadScoringAndPrioritizationInput } from '@/ai/flows/ai-lead-scoring-and-prioritization-flow';
import type { Lead } from '@/types';
import { LineItemSchema } from '../inventory/schemas';

export async function scoreLeadWithAI(lead: Lead) {
  try {
    const input: AiLeadScoringAndPrioritizationInput = {
      engagementScore: lead.engagementScore || 0,
      leadSource: lead.source || 'Unknown',
      demographicData: {
        industry: lead.demographicData?.industry || '',
        companySize: lead.demographicData?.companySize || '',
        jobTitle: lead.demographicData?.jobTitle || '',
        country: lead.demographicData?.country || '',
      },
      productAsked: lead.productAsked,
      leadStatus: lead.status,
      notes: lead.notes,
    };

    const result = await aiLeadScoringAndPrioritization(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error scoring lead with AI:', error);
    return { success: false, error: 'Failed to score lead.' };
  }
}

const AssignLeadSchema = z.object({
  leadId: z.string().min(1),
  teamspaceId: z.string().min(1),
  newAssignedToIds: z.array(z.string()).min(1, 'At least one user must be assigned.'),
  currentUserId: z.string().min(1),
});

export async function assignLead(values: z.infer<typeof AssignLeadSchema>)
: Promise<{ success: boolean; error?: string }> {
  try {
    const { leadId, teamspaceId, newAssignedToIds, currentUserId } = AssignLeadSchema.parse(values);

    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get();
    if (!currentUserDoc.exists) throw new Error('User context not found.');
    
    const role = currentUserDoc.data()?.role;
    if (!['admin', 'sales_team_lead'].includes(role)) {
      throw new Error('Unauthorized: Only admins or team leads can delegate prospects.');
    }

    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);

    await leadRef.update({
      assignedToIds: newAssignedToIds,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/leads');
    revalidatePath(`/leads/${leadId}`);

    return { success: true };

  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

const BulkAssignSchema = z.object({
  leadIds: z.array(z.string()).min(1),
  teamspaceId: z.string().min(1),
  newAssignedToIds: z.array(z.string()).min(1),
  currentUserId: z.string().min(1),
});

export async function bulkAssignLeads(values: z.infer<typeof BulkAssignSchema>)
: Promise<{ success: boolean; error?: string }> {
  try {
    const { leadIds, teamspaceId, newAssignedToIds, currentUserId } = BulkAssignSchema.parse(values);

    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get();
    if (!currentUserDoc.exists || !['admin', 'sales_team_lead'].includes(currentUserDoc.data()?.role)) {
      throw new Error('Unauthorized: Only admins or team leads can perform bulk delegation.');
    }

    const batch = adminDb.batch();
    leadIds.forEach(id => {
      const ref = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(id);
      batch.update(ref, {
        assignedToIds: newAssignedToIds,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

const ConvertAndCreateDealSchema = z.object({
  leadId: z.string().min(1),
  teamspaceId: z.string().min(1),
  currentUserId: z.string().min(1),
  dealName: z.string().min(2),
  dealType: z.string().min(1),
  dealStage: z.string().min(1),
  dealAmount: z.coerce.number().min(0),
  lineItems: z.array(LineItemSchema),
});

export async function convertAndCreateDeal(values: z.infer<typeof ConvertAndCreateDealSchema>) {
  try {
    const { leadId, teamspaceId, currentUserId, dealName, dealType, dealStage, dealAmount, lineItems } = ConvertAndCreateDealSchema.parse(values);

    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);
    const leadDoc = await leadRef.get();
    if (!leadDoc.exists) throw new Error("Prospect record not found.");
    const leadData = leadDoc.data() as Lead;

    if (leadData.status === 'Converted') {
        throw new Error("This prospect has already been converted.");
    }

    const batch = adminDb.batch();
    
    const contactRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('contacts').doc();
    batch.set(contactRef, {
      id: contactRef.id,
      firstName: leadData.fullName.split(' ')[0],
      lastName: leadData.fullName.split(' ').slice(1).join(' ') || leadData.fullName.split(' ')[0],
      email: leadData.email || '',
      phone: leadData.phone || '',
      teamspaceId: teamspaceId,
      ownerId: currentUserId,
      avatar: `https://picsum.photos/seed/${contactRef.id}/100/100`,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const dealRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('deals').doc();
    batch.set(dealRef, {
      id: dealRef.id,
      name: dealName,
      type: dealType,
      amount: Number(dealAmount),
      stage: dealStage,
      closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      contactId: contactRef.id,
      ownerId: currentUserId,
      teamspaceId: teamspaceId,
      lineItems: lineItems,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    batch.update(leadRef, { 
      status: 'Converted', 
      updatedAt: FieldValue.serverTimestamp() 
    });
    
    await batch.commit();

    revalidatePath('/leads');
    revalidatePath(`/leads/${leadId}`);
    revalidatePath('/contacts');
    revalidatePath('/deals');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}
