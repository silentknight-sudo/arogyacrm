'use server';

import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { sendMetaCapiEvent } from '@/lib/meta-capi';
import { revalidatePath } from 'next/cache';
import type { LeadStatus } from '@/types';

/**
 * BORN-AGAIN VELOCITY PROTOCOL
 * Every assignment strictly resets the createdAt timestamp to force top-of-pipeline sorting.
 */

function mapLeadStatusToMetaEvent(status: LeadStatus): string | null {
  switch (status) {
    case 'new':
      return 'Lead';
    case 'intrested':
      return 'QualifiedLead';
    case 'CNP':
      return 'Contact';
    case 'done':
      return 'Converted';
    case 'not intrested':
      return null;
    default:
      return null;
  }
}

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

    const actorDoc = await adminDb.collection('users').doc(currentUserId).get();
    const actorRole = actorDoc.data()?.role;
    const isLeaderAction = actorRole === 'admin' || actorRole === 'sales_team_lead';
    const isInitialDist = isLeaderAction && leadData?.status === 'new';

    await leadRef.update({
      assignedToIds: newAssignedToIds,
      status: isLeaderAction ? 'new' : leadData?.status,
      reassigned: isInitialDist ? false : true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    for (const uid of newAssignedToIds) {
      if (uid === currentUserId) continue;
      await adminDb.collection('users').doc(uid).collection('notifications').add({
        title: 'Lead Allocated',
        description: `Lead "${leadData?.fullName}" assigned to you.`,
        type: 'lead_assigned',
        timestamp: new Date().toISOString(),
        read: false,
        link: '/leads',
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
    const actorDoc = await adminDb.collection('users').doc(currentUserId).get();
    const actorRole = actorDoc.data()?.role;
    const isLeaderAction = actorRole === 'admin' || actorRole === 'sales_team_lead';
    const leadsRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads');

    for (const id of leadIds) {
      const leadDoc = await leadsRef.doc(id).get();
      const leadData = leadDoc.data();
      const isInitialDist = isLeaderAction && leadData?.status === 'new';

      await leadsRef.doc(id).update({
        assignedToIds: newAssignedToIds,
        status: isLeaderAction ? 'new' : leadData?.status,
        reassigned: isInitialDist ? false : true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

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
        status: 'new',
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
  status: LeadStatus,
  note?: string,
  updatedBy?: string,
}) {
  try {
    const { leadId, teamspaceId, status, note, updatedBy } = values;
    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);
    const leadSnap = await leadRef.get();
    const leadData = leadSnap.data();

    await leadRef.update({
      status,
      statusHistory: FieldValue.arrayUnion({
        status,
        note: note || '',
        updatedBy: updatedBy || '',
        updatedAt: new Date().toISOString(),
      }),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const metaEventName = mapLeadStatusToMetaEvent(status);

    if (leadData?.metaLeadId && metaEventName) {
      await sendMetaCapiEvent({
        eventName: metaEventName,
        leadId: leadData.metaLeadId,
        email: leadData.email || '',
        phone: leadData.phone || '',
        firstName: leadData.firstName || '',
        lastName: leadData.lastName || '',
        customData: {
          crm_status: status,
          teamspace_id: teamspaceId,
          source: leadData.source || '',
        },
      });
    }

    revalidatePath('/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}

export async function setLeadReminder(values: {
  leadId: string,
  teamspaceId: string,
  reminderValue: number,
  reminderUnit: 'hours' | 'days',
}) {
  try {
    const { leadId, teamspaceId, reminderValue, reminderUnit } = values;
    const leadRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('leads').doc(leadId);

    if (reminderValue <= 0) {
      await leadRef.update({
        reminderValue: 0,
        reminderUnit: null,
        reminderAt: null,
        reminderNotifiedAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      const reminderDate = new Date();
      if (reminderUnit === 'hours') {
        reminderDate.setHours(reminderDate.getHours() + reminderValue);
      } else {
        reminderDate.setDate(reminderDate.getDate() + reminderValue);
        reminderDate.setHours(9, 0, 0, 0);
      }

      await leadRef.update({
        reminderValue,
        reminderUnit,
        reminderAt: reminderDate.toISOString(),
        reminderNotifiedAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

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
        duplicates.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
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
