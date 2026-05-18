'use server';

import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
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

    // Persistent Alerts
    for (const uid of newAssignedToIds) {
      if (uid === currentUserId) continue; // Don't notify self
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
    const { leadIds, teamspaceId, newAssignedToIds, currentUserId } = values;
    const batch = adminDb.batch();
    const leadsRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads');

    for (const id of leadIds) {
      batch.update(leadsRef.doc(id), {
        assignedToIds: newAssignedToIds,
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
    const { leadIds, teamspaceId, currentUserId } = values;
    const userDoc = await adminDb.collection('users').doc(currentUserId).get();
    const role = userDoc.data()?.role;

    if (role !== 'admin' && role !== 'sales_team_lead') {
      throw new Error('Unauthorized: Purge restricted to leadership.');
    }

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

export async function cleanupDuplicateLeads(teamspaceId: string) {
    try {
        const leadsSnap = await adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').get();
        const seenPhones = new Map<string, string>();
        const toDelete: string[] = [];

        leadsSnap.docs.forEach(doc => {
            const data = doc.data();
            const phone = data.phone?.toString().trim();
            if (!phone) return;

            if (seenPhones.has(phone)) {
                toDelete.push(doc.id);
            } else {
                seenPhones.set(phone, doc.id);
            }
        });

        const batch = adminDb.batch();
        const leadsRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads');
        toDelete.forEach(id => batch.delete(leadsRef.doc(id)));
        
        await batch.commit();
        revalidatePath('/leads');
        return { success: true, removedCount: toDelete.length };
    } catch (error: any) {
        return { success: false, error: handleAdminSDKError(error) };
    }
}