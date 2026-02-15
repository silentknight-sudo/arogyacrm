'use server';

import { getLeadInteractionSummary, LeadInteractionSummaryInput } from '@/ai/flows/lead-interaction-summary';
import type { Lead } from '@/types';
import { interactionLogs as allLogs } from '@/lib/data';
import { formatISO } from 'date-fns';

export async function generateLeadSummary(lead: Lead) {
  try {
    const interactionLogs = allLogs[lead.id] || [];
    
    const input: LeadInteractionSummaryInput = {
      leadDetails: {
        id: lead.id,
        name: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        status: lead.status,
        source: lead.source,
        lastContactDate: lead.lastContacted ? formatISO(new Date(lead.lastContacted)) : undefined,
        notes: lead.notes,
      },
      interactionLogs: interactionLogs.map(log => ({
          type: log.type,
          date: formatISO(new Date(log.date)),
          notes: log.notes,
          agent: log.agent
      }))
    };

    const result = await getLeadInteractionSummary(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error generating lead summary:', error);
    return { success: false, error: 'Failed to generate summary.' };
  }
}
