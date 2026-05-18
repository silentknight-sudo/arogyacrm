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
  userIds: string[], 
  currentUserId: string 
}) {
  try {
    const { leadId, teamspaceId, userIds, currentUserId } = values;
    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);
    const leadDoc = await leadRef.get();
    const leadData = leadDoc.data();

    // Determine if this is a "True Reassignment" or "Initial Distribution"
    const actorDoc = await adminDb.collection('users').doc(currentUserId).get();
    const actorRole = actorDoc.data()?.role;
    const isInitialDist = (actorRole === 'admin' || actorRole === 'sales_team_lead') && leadData?.status === 'new';

    await leadRef.update({
      assignedToIds: userIds,
      reassigned: isInitialDist ? false : true,
      createdAt: FieldValue.serverTimestamp(), // Date Refresh for priority
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Notify Specialist
    for (const uid of userIds) {
      await adminDb.collection('users').doc(uid).collection('notifications').add({
        title: 'Strategic Lead Allocated',
        description: `Prospect "${leadData?.fullName}" has been assigned to your desk.`,
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
      throw new Error('Unauthorized: Executive authority required for asset decommissioning.');
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