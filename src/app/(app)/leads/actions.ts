'use server';

import { aiLeadScoringAndPrioritization, AiLeadScoringAndPrioritizationInput } from '@/ai/flows/ai-lead-scoring-and-prioritization-flow';
import type { Lead } from '@/types';

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
