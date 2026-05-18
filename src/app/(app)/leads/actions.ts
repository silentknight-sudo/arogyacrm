'use server';

import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import type { LeadStatus } from '@/types';

/**
 * BORN-AGAIN VELOCITY PROTOCOL
 * Every assignment strictly resets the createdAt timestamp to force top-of-pipeline sorting.
 */

export async function assignLead(values: { 
  leadId: string, 
  teamspaceId: string, 
  newAssignedToIds: string[], 
  currentUserId: string 
}) {
  try {
    const { leadId, teamspaceId, newAssignedToIds, currentUserId } = values;
    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);
    const leadDoc = await leadRef.get();
    const leadData = leadDoc.data();

    // Identify Initial Distribution (Leadership moving fresh inventory)
    const actorDoc = await adminDb.collection('users').doc(currentUserId).get();
    const actorRole = actorDoc.data()?.role;
    const isInitialDist = (actorRole === 'admin' || actorRole === 'sales_team_lead') && leadData?.status === 'new';

    await leadRef.update({
      assignedToIds: newAssignedToIds,
      reassigned: isInitialDist ? false : true,
      createdAt: FieldValue.serverTimestamp(), // Date Refresh forces top-of-stack
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Notify Specialists
    for (const uid of newAssignedToIds) {
      if (uid === currentUserId) continue;
      await adminDb.collection('users').doc(uid).collection('notifications').add({
        title: 'Lead Allocated',
        description: `Prospect "${leadData?.fullName}" assigned to you.`,
        type: 'lead_assigned',
        timestamp: new Date().toISOString(),
        read: false,
        link: '/leads'
      });
    }

    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

export async function bulkAssignLeads(values: { 
  leadIds: string[], 
  teamspaceId: string, 
  newAssignedToIds: string[], 
  currentUserId: string 
}) {
  try {
    const { leadIds, teamspaceId, newAssignedToIds } = values;
    const batch = adminDb.batch();
    const leadsRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads');

    for (const id of leadIds) {
      batch.update(leadsRef.doc(id), {
        assignedToIds: newAssignedToIds,
        reassigned: true,
        createdAt: FieldValue.serverTimestamp(), // Born-Again sorting
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

export async function updateLeadStatus(values: { 
  leadId: string, 
  teamspaceId: string, 
  status: LeadStatus 
}) {
  try {
    const { leadId, teamspaceId, status } = values;
    await adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    // Automatically trigger deal sync if converted to "done"
    if (status === 'done') {
        await syncDealForLead(leadId, teamspaceId);
    }

    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

export async function syncDealForLead(leadId: string, teamspaceId: string) {
    try {
        const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);
        const leadDoc = await leadRef.get();
        const leadData = leadDoc.data();
        if (!leadData) return;

        const dealRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('deals').doc();
        await dealRef.set({
            id: dealRef.id,
            leadId: leadId,
            teamspaceId,
            name: `${leadData.fullName} - Wellness Deal`,
            amount: 0,
            stage: 'new',
            type: 'Initial Order',
            closeDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            contactId: leadId,
            ownerId: leadData.assignedToIds?.[0] || '',
            lineItems: [],
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
    } catch (e) {
        console.error("DEAL_SYNC_FAILURE:", e);
    }
}

export async function selfAssignLeads(values: { 
  leadIds: string[], 
  teamspaceId: string, 
  currentUserId: string 
}) {
  try {
    const { leadIds, teamspaceId, currentUserId } = values;
    const batch = adminDb.batch();
    const leadsRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads');

    for (const id of leadIds) {
      batch.update(leadsRef.doc(id), {
        assignedToIds: [currentUserId],
        reassigned: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

export async function deleteLeads(values: { 
  leadIds: string[], 
  teamspaceId: string, 
  currentUserId: string 
}) {
  try {
    const { leadIds, teamspaceId } = values;
    const batch = adminDb.batch();
    const leadsRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads');
    
    leadIds.forEach(id => batch.delete(leadsRef.doc(id)));
    await batch.commit();

    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

export async function createLead(values: any) {
    try {
        const { teamspaceId, creatorId, ...data } = values;
        const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc();
        
        await leadRef.set({
            id: leadRef.id,
            ...data,
            teamspaceId,
            assignedToIds: [creatorId],
            reassigned: false,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        revalidatePath('/leads');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: handleAdminSDKError(error) };
    }
}

export async function cleanupDuplicateLeads(teamspaceId: string): Promise<{ success: boolean; removedCount: number; error?: string }> {
  try {
    const leadsRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads');
    const snapshot = await leadsRef.get();
    
    const leadsByPhone: Record<string, any[]> = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const phone = (data.phone || '').trim();
      if (phone) {
        if (!leadsByPhone[phone]) leadsByPhone[phone] = [];
        leadsByPhone[phone].push({ id: doc.id, createdAt: data.createdAt?.toDate() || new Date(0) });
      }
    });

    let removedCount = 0;
    const batch = adminDb.batch();

    Object.values(leadsByPhone).forEach(duplicates => {
      if (duplicates.length > 1) {
        // Sort by creation date (ascending)
        duplicates.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        // Keep the first one, delete the rest
        const toDelete = duplicates.slice(1);
        toDelete.forEach(d => {
          batch.delete(leadsRef.doc(d.id));
          removedCount++;
        });
      }
    });

    if (removedCount > 0) {
      await batch.commit();
      revalidatePath('/leads');
    }

    return { success: true, removedCount };
  } catch (error: any) {
    return { success: false, removedCount: 0, error: handleAdminSDKError(error) };
  }
}
