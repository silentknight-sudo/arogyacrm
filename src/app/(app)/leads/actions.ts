'use server';

import { adminDb, FieldValue, handleAdminSDKError, serverTimestamp } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { aiLeadScoringAndPrioritization, AiLeadScoringAndPrioritizationInput } from '@/ai/flows/ai-lead-scoring-and-prioritization-flow';
import type { Lead } from '@/types';

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

    // Verify privileges: Only Admins or Team Leads can reassign
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

const ConvertLeadSchema = z.object({
  leadId: z.string().min(1),
  teamspaceId: z.string().min(1),
  currentUserId: z.string().min(1),
});

export async function convertLead(values: z.infer<typeof ConvertLeadSchema>): Promise<{ success: boolean; error?: string; contactId?: string; accountId?: string }> {
  try {
    const { leadId, teamspaceId, currentUserId } = ConvertLeadSchema.parse(values);

    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);
    const leadDoc = await leadRef.get();
    if (!leadDoc.exists) {
      throw new Error("Prospect record not found.");
    }
    const leadData = leadDoc.data() as Lead;

    if (leadData.status === 'Converted') {
        throw new Error("This prospect has already been converted.");
    }

    const accountRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('accounts').doc();
    const newAccountData = {
      id: accountRef.id,
      name: `${leadData.fullName}'s Company`,
      ownerId: currentUserId,
      teamspaceId: teamspaceId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      phone: leadData.phone,
    };
    
    const contactRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('contacts').doc();
    const newContactData = {
      id: contactRef.id,
      firstName: leadData.fullName.split(' ')[0],
      lastName: leadData.fullName.split(' ').slice(1).join(' ') || leadData.fullName.split(' ')[0],
      email: leadData.email || '',
      phone: leadData.phone || '',
      accountId: accountRef.id,
      teamspaceId: teamspaceId,
      ownerId: currentUserId,
      avatar: `https://picsum.photos/seed/${contactRef.id}/100/100`,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const batch = adminDb.batch();
    batch.set(accountRef, newAccountData);
    batch.set(contactRef, newContactData);
    batch.update(leadRef, { status: 'Converted', updatedAt: FieldValue.serverTimestamp() });
    
    await batch.commit();

    revalidatePath('/leads');
    revalidatePath('/contacts');
    revalidatePath('/accounts');

    return { success: true, accountId: accountRef.id, contactId: contactRef.id };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}
