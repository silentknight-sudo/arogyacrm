'use server';

import { getLeadInteractionSummary, LeadInteractionSummaryInput } from '@/ai/flows/lead-interaction-summary';
import type { Lead, InteractionLog } from '@/types';
import { formatISO } from 'date-fns';
import { adminDb } from '@/firebase/admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

async function getInteractionLogsForLead(teamspaceId: string, leadId: string): Promise<InteractionLog[]> {
    try {
        const snapshot = await adminDb
            .collection('teamspaces')
            .doc(teamspaceId)
            .collection('activityLogs')
            .where('entityType', '==', 'Lead')
            .where('entityId', '==', leadId)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        return snapshot.docs.map((doc: QueryDocumentSnapshot) => {
            const data = doc.data();
            return {
                id: doc.id,
                type: data.action || 'Note',
                date: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
                notes: data.newValue || data.action || 'No details recorded.',
                agent: 'Team Member'
            } as InteractionLog;
        });
    } catch (error) {
        console.error('Error fetching interaction logs:', error);
        return [];
    }
}


export async function generateLeadSummary(lead: Lead) {
  try {
    const interactionLogs = await getInteractionLogsForLead(lead.teamspaceId, lead.id);
    
    const input: LeadInteractionSummaryInput = {
      leadDetails: {
        id: lead.id,
        name: lead.fullName,
        email: lead.email || 'N/A',
        status: lead.status,
        source: lead.source || 'Unknown',
        lastContactDate: lead.updatedAt ? formatISO(new Date(lead.updatedAt)) : undefined,
        notes: lead.notes,
      },
      interactionLogs: interactionLogs.map(log => ({
          type: log.type,
          date: log.date,
          notes: log.notes,
          agent: log.agent
      }))
    };

    const result = await getLeadInteractionSummary(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('AI_SUMMARY_ERROR:', error);
    return { success: false, error: error.message || 'Failed to generate summary.' };
  }
}
