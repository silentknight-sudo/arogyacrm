'use server';

import { aiLeadScoringAndPrioritization, AiLeadScoringAndPrioritizationInput } from '@/ai/flows/ai-lead-scoring-and-prioritization-flow';
import type { Lead } from '@/types';
import { getAdminInstances } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

export async function scoreLeadWithAI(lead: Lead) {
  try {
    const input: AiLeadScoringAndPrioritizationInput = {
      engagementScore: lead.engagementScore || 0,
      leadSource: lead.leadSource || 'Unknown',
      demographicData: {
        industry: lead.demographicData?.industry,
        companySize: lead.demographicData?.companySize,
        jobTitle: lead.demographicData?.jobTitle,
        country: lead.demographicData?.country,
      },
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

const CreateLeadSchema = z.object({
    firstName: z.string().min(1, 'First name is required.'),
    lastName: z.string().min(1, 'Last name is required.'),
    email: z.string().email('Invalid email address.'),
    company: z.string().optional(),
    source: z.string().min(1, 'Lead source is required.'),
    status: z.enum(['New', 'Contacted', 'Qualified', 'Lost', 'Unqualified']),
    assignedToId: z.string().min(1, 'Must be assigned to a user.'),
    teamspaceId: z.string().min(1, 'Must belong to a teamspace.'),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
type CreateLeadResult = { success: boolean; error?: string; leadId?: string };

export async function createLead(values: CreateLeadInput): Promise<CreateLeadResult> {
    try {
        const { adminDb, serverTimestamp } = getAdminInstances();
        const validatedInput = CreateLeadSchema.parse(values);

        const newLeadRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('leads').doc();
        const newLeadId = newLeadRef.id;
        
        const newLeadData = {
            id: newLeadId,
            firstName: validatedInput.firstName,
            lastName: validatedInput.lastName,
            email: validatedInput.email,
            company: validatedInput.company || '',
            status: validatedInput.status,
            source: validatedInput.source,
            assignedToId: validatedInput.assignedToId,
            teamspaceId: validatedInput.teamspaceId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newLeadRef.set(newLeadData);
        
        revalidatePath('/leads');

        return { success: true, leadId: newLeadId };

    } catch (error: any) {
        console.error('Error creating lead:', error);
        
        let errorMessage = 'An unknown server error occurred.';

        if (error instanceof z.ZodError) {
        errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return { success: false, error: `Failed to create lead: ${errorMessage}` };
    }
}
