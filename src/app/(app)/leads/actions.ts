'use server';

import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
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


// NOTE: createLead server action removed.
// This is now handled on the client-side to ensure proper authentication
// and to be governed by Firestore security rules.
