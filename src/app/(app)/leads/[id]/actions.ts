'use server';

import { getLeadInteractionSummary, LeadInteractionSummaryInput } from '@/ai/flows/lead-interaction-summary';
import type { Lead, InteractionLog } from '@/types';
import { formatISO } from 'date-fns';
import { adminDb } from '@/firebase/admin';

async function getInteractionLogsForLead(teamspaceId: string, leadId: string): Promise<InteractionLog[]> {
    // This is a placeholder. In a real app, you would query Firestore.
    // For example:
    // const snapshot = await adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId).collection('interactions').orderBy('date', 'desc').get();
    // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InteractionLog));
    return [];
}


export async function generateLeadSummary(lead: Lead) {
  try {
    const interactionLogs = await getInteractionLogsForLead(lead.teamspaceId, lead.id);
    
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
