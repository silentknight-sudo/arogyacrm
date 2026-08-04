'use server';

import { revalidatePath } from 'next/cache';
import { adminDb, handleAdminSDKError } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

type RepairInput = {
  teamLeadId: string;
  teamspaceId: string;
};

export async function repairManagedTelecallers({ teamLeadId, teamspaceId }: RepairInput) {
  try {
    const teamLeadRef = adminDb.collection('users').doc(teamLeadId);
    const teamspaceRef = adminDb.collection('teamspaces').doc(teamspaceId);
    const leadsRef = teamspaceRef.collection('leads');

    const [teamLeadDoc, teamspaceDoc, leadsSnap] = await Promise.all([
      teamLeadRef.get(),
      teamspaceRef.get(),
      leadsRef.get(),
    ]);

    if (!teamLeadDoc.exists) throw new Error('Team Lead profile not found.');
    if (!teamspaceDoc.exists) throw new Error('Teamspace not found.');

    const teamLead = teamLeadDoc.data();
    if (teamLead?.role !== 'sales_team_lead' && teamLead?.role !== 'admin') {
      throw new Error('Only Team Leads or Admins can repair telecaller memberships.');
    }

    const teamspaceMemberIds = Array.isArray(teamspaceDoc.data()?.memberIds) ? teamspaceDoc.data()?.memberIds : [];
    const leadAssigneeIds = new Set<string>();

    leadsSnap.forEach((leadDoc) => {
      const assignedToIds = leadDoc.data()?.assignedToIds;
      if (!Array.isArray(assignedToIds)) return;

      assignedToIds.forEach((assigneeId: string) => {
        if (assigneeId && assigneeId !== teamLeadId) {
          leadAssigneeIds.add(assigneeId);
        }
      });
    });

    const managedByCreatorSnap = await adminDb
      .collection('users')
      .where('role', '==', 'sales_executive')
      .where('createdBy', '==', teamLeadId)
      .get();

    const candidateIds = new Set<string>([
      ...teamspaceMemberIds,
      ...leadAssigneeIds,
      ...managedByCreatorSnap.docs.map((doc) => doc.id),
    ]);

    if (candidateIds.size === 0) {
      return { success: true, repaired: 0 };
    }

    const batch = adminDb.batch();
    let repaired = 0;

    for (const candidateId of candidateIds) {
      const telecallerRef = adminDb.collection('users').doc(candidateId);
      const telecallerDoc = await telecallerRef.get();
      if (!telecallerDoc.exists) continue;

      const telecaller = telecallerDoc.data();
      if (telecaller?.role !== 'sales_executive') continue;

      const currentPrimaryTeamspaceId = Array.isArray(telecaller?.teamspaceIds) ? telecaller.teamspaceIds[0] : null;
      const normalizedTeamspaceIds = [teamspaceId];

      const needsRepair =
        telecaller.createdBy !== teamLeadId ||
        currentPrimaryTeamspaceId !== teamspaceId;

      if (!needsRepair) continue;

      batch.set(
        telecallerRef,
        {
          createdBy: teamLeadId,
          teamspaceIds: normalizedTeamspaceIds,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      batch.set(
        teamspaceRef,
        {
          memberIds: FieldValue.arrayUnion(candidateId),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      repaired += 1;
    }

    if (repaired > 0) {
      await batch.commit();
      revalidatePath('/admin/users');
      revalidatePath('/leads');
      revalidatePath('/dashboard');
      revalidatePath('/analytics/reports');
      revalidatePath(`/team/${teamLeadId}`);
    }

    return { success: true, repaired };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}
