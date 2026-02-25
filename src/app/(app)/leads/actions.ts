'use server';

import { adminDb, FieldValue, handleAdminSDKError, serverTimestamp } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { aiLeadScoringAndPrioritization, AiLeadScoringAndPrioritizationInput } from '@/ai/flows/ai-lead-scoring-and-prioritization-flow';
import type { Lead, UserProfile } from '@/types';


export async function scoreLeadWithAI(lead: Lead) {
  try {
    const input: AiLeadScoringAndPrioritizationInput = {
      engagementScore: lead.engagementScore || 0,
      leadSource: lead.source || 'Unknown',
      demographicData: {
        industry: lead.demographicData?.industry,
        companySize: lead.demographicData?.companySize,
        jobTitle: lead.demographicData?.jobTitle,
        country: lead.demographicData?.country,
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
  newAssignedToId: z.string().min(1),
  currentUserId: z.string().min(1), // User performing the action
});

export async function assignLead(values: z.infer<typeof AssignLeadSchema>)
: Promise<{ success: boolean; error?: string }> {
  try {
    const { leadId, teamspaceId, newAssignedToId, currentUserId } = AssignLeadSchema.parse(values);

    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get();
    if (!currentUserDoc.exists) {
      throw new Error('Could not verify your identity.');
    }
    const currentUserData = currentUserDoc.data();
    const userRole = currentUserData?.role;

    // Security Check: Only admin or sales_team_lead can assign
    if (userRole !== 'admin' && userRole !== 'sales_team_lead') {
      throw new Error('You do not have permission to assign leads.');
    }

    // Security Check: Ensure user is part of the teamspace
    if (userRole !== 'admin' && !currentUserData?.teamspaceIds?.includes(teamspaceId)) {
        throw new Error('You do not belong to this teamspace.');
    }

    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);

    await leadRef.update({
      assignedToId: newAssignedToId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/leads');
    revalidatePath(`/leads/${leadId}`);

    return { success: true };

  } catch (error: any) {
    const errorMessage = handleAdminSDKError(error);
    return { success: false, error: errorMessage };
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
      throw new Error("Lead not found.");
    }
    const leadData = leadDoc.data() as Lead;

    if (leadData.status === 'Converted') {
        throw new Error("Lead has already been converted.");
    }

    // 1. Create Account
    const accountRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('accounts').doc();
    const newAccountData = {
      id: accountRef.id,
      name: `${leadData.fullName}'s Company`,
      ownerId: leadData.assignedToId,
      teamspaceId: teamspaceId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      phone: leadData.phone,
    };
    
    // 2. Create Contact
    const contactRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('contacts').doc();
    const newContactData = {
      id: contactRef.id,
      firstName: leadData.fullName.split(' ')[0],
      lastName: leadData.fullName.split(' ').slice(1).join(' ') || leadData.fullName.split(' ')[0],
      email: leadData.email || '',
      phone: leadData.phone || '',
      accountId: accountRef.id,
      teamspaceId: teamspaceId,
      ownerId: leadData.assignedToId,
      avatar: `https://picsum.photos/seed/${contactRef.id}/100/100`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 3. Create a batch to ensure atomic write
    const batch = adminDb.batch();
    batch.set(accountRef, newAccountData);
    batch.set(contactRef, newContactData);
    batch.update(leadRef, { status: 'Converted', updatedAt: serverTimestamp() });
    
    await batch.commit();

    revalidatePath('/leads');
    revalidatePath(`/leads/${leadId}`);
    revalidatePath('/contacts');
    revalidatePath('/accounts');

    return { success: true, accountId: accountRef.id, contactId: contactRef.id };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

export async function getTeamspaceUsers(teamspaceId: string): Promise<{ success: boolean; users?: UserProfile[], error?: string; }> {
    try {
        const usersSnapshot = await adminDb.collection('users').where('teamspaceIds', 'array-contains', teamspaceId).get();
        if (usersSnapshot.empty) {
            return { success: true, users: [] };
        }
        const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);
        return { success: true, users: users };
    } catch (error: any) {
        return { success: false, error: handleAdminSDKError(error) };
    }
}


// NOTE: createLead server action removed.
// This is now handled on the client-side to ensure proper authentication
// and to be governed by Firestore security rules.
