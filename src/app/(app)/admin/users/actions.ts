'use server';

import { adminAuth, adminDb, handleAdminSDKError } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateUserInputSchema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string(),
  teamspaceIds: z.array(z.string()),
  creatorId: z.string().min(1),
  managerId: z.string().optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

type CreateUserResult = {
  success: boolean;
  error?: string;
};

function getEmployeeIdPrefix(role: string) {
  if (role === 'sales_team_lead') return 'AGY-TL';
  if (role === 'sales_executive') return 'AGY-TC';
  return 'AGY-EMP';
}

function normalizeSingleTeamspace(teamspaceIds: string[] | undefined | null) {
  const firstTeamspaceId = Array.isArray(teamspaceIds) ? teamspaceIds.find(Boolean) : null;
  return firstTeamspaceId ? [firstTeamspaceId] : [];
}

async function resolveSingleWorkspaceId() {
  const teamspacesSnap = await adminDb.collection('teamspaces').get();
  if (teamspacesSnap.empty) {
    throw new Error('No teamspace found. Please create the SLT workspace in Firestore first.');
  }

  const preferred = teamspacesSnap.docs.find((doc) => {
    const name = String(doc.data()?.name || '').trim().toLowerCase();
    return name === 'slt';
  });

  return preferred?.id || teamspacesSnap.docs[0].id;
}

async function getNextEmployeeId(role: string) {
  const prefix =
    role === 'sales_team_lead'
      ? 'teamLead'
      : role === 'sales_executive'
        ? 'telecaller'
        : 'employee';
  const counterRef = adminDb.collection('counters').doc(`employeeIds_${prefix}`);
  const displayPrefix = getEmployeeIdPrefix(role);

  return adminDb.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    const next = ((counterDoc.exists ? counterDoc.data()?.lastNumber : 0) || 0) + 1;
    transaction.set(counterRef, {
      lastNumber: next,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return `${displayPrefix}-${String(next).padStart(3, '0')}`;
  });
}

export async function createUser(values: CreateUserInput): Promise<CreateUserResult> {
  try {
    const validatedInput = CreateUserInputSchema.parse(values);
    
    // 1. VERIFY PERMISSIONS
    const creatorDoc = await adminDb.collection('users').doc(validatedInput.creatorId).get();
    if (!creatorDoc.exists) throw new Error('Unauthorized creator context.');
    
    const creatorData = creatorDoc.data();
    const creatorRole = creatorData?.role;

    if (creatorRole !== 'admin') {
        throw new Error('You do not have administrative privileges.');
    }

    const singleWorkspaceId = await resolveSingleWorkspaceId();
    let finalTeamspaceIds = [singleWorkspaceId];
    let createdBy = validatedInput.creatorId;

    if (validatedInput.role === 'sales_executive') {
      if (!validatedInput.managerId) {
        throw new Error('Choose the Team Lead this telecaller should work under.');
      }

      const managerDoc = await adminDb.collection('users').doc(validatedInput.managerId).get();
      if (!managerDoc.exists || managerDoc.data()?.role !== 'sales_team_lead') {
        throw new Error('Selected manager is not a valid Team Lead.');
      }

      const managerTeamspaceIds = normalizeSingleTeamspace(managerDoc.data()?.teamspaceIds || []);
      if (managerTeamspaceIds.length === 0) {
        throw new Error('Selected Team Lead does not have a teamspace.');
      }

      finalTeamspaceIds = [managerTeamspaceIds[0] || singleWorkspaceId];
      createdBy = validatedInput.managerId;
    }

    // 2. CREATE IN AUTH
    const userRecord = await adminAuth.createUser({
      email: validatedInput.email,
      password: validatedInput.password,
      displayName: validatedInput.displayName,
      emailVerified: false, 
    });

    const newUserId = userRecord.uid;
    const employeeId = await getNextEmployeeId(validatedInput.role);

    // 3. CREATE PROFILE
    const userDocRef = adminDb.collection('users').doc(newUserId);
    const batch = adminDb.batch();

    batch.set(userDocRef, {
      id: newUserId,
      displayName: validatedInput.displayName,
      email: validatedInput.email,
      employeeId,
      role: validatedInput.role,
      teamspaceIds: normalizeSingleTeamspace(finalTeamspaceIds),
      accessStatus: 'approved',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      avatar: `https://picsum.photos/seed/${newUserId}/100/100`,
      createdBy,
    });

    finalTeamspaceIds.forEach(teamspaceId => {
      const teamspaceRef = adminDb.collection('teamspaces').doc(teamspaceId);
      batch.update(teamspaceRef, {
        memberIds: FieldValue.arrayUnion(newUserId),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    
    await adminAuth.setCustomUserClaims(newUserId, { role: validatedInput.role });

    revalidatePath('/admin/users');
    revalidatePath('/admin/teamspaces');
    return { success: true };

  } catch (error: any) {
    const errorMessage = handleAdminSDKError(error);
    return { success: false, error: errorMessage };
  }
}


const DeleteUserSchema = z.object({
  userId: z.string().min(1),
  adminId: z.string().min(1),
});

export async function deleteUser(values: { userId: string, adminId: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, adminId } = DeleteUserSchema.parse(values);

    const adminUserDoc = await adminDb.collection('users').doc(adminId).get();
    if (!adminUserDoc.exists) throw new Error('Unauthorized session.');
    
    const adminData = adminUserDoc.data();
    const adminRole = adminData?.role;

    const targetUserDoc = await adminDb.collection('users').doc(userId).get();
    if (!targetUserDoc.exists) throw new Error('User profile not found.');
    const targetData = targetUserDoc.data();

    // HIERARCHY PROTECTION
    if (userId === adminId) {
        throw new Error('Self-decommissioning is restricted.');
    }

    if (adminRole === 'admin') {
        // Full access
    } else if (adminRole === 'sales_team_lead') {
        // Can only delete telecallers they personally created.
        if (targetData?.role !== 'sales_executive' || targetData?.createdBy !== adminId) {
            throw new Error('You can only manage members you have personally onboarded.');
        }
    } else {
        throw new Error('Unauthorized.');
    }

    await adminAuth.deleteUser(userId);
    await adminDb.collection('users').doc(userId).delete();

    revalidatePath('/admin/users');
    return { success: true };

  } catch (error: any) {
    const errorMessage = handleAdminSDKError(error);
    return { success: false, error: errorMessage };
  }
}

const UpdatePasswordSchema = z.object({
  userId: z.string().min(1),
  adminId: z.string().min(1),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export async function updateUserPassword(values: z.infer<typeof UpdatePasswordSchema>): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, adminId, password } = UpdatePasswordSchema.parse(values);

    // Verify privileges
    const adminUserDoc = await adminDb.collection('users').doc(adminId).get();
    if (!adminUserDoc.exists) throw new Error('Unauthorized session.');
    
    const adminData = adminUserDoc.data();
    const adminRole = adminData?.role;

    const targetUserDoc = await adminDb.collection('users').doc(userId).get();
    if (!targetUserDoc.exists) throw new Error('User profile not found.');
    const targetData = targetUserDoc.data();

    // HIERARCHY PROTECTION
    if (userId === adminId) {
        // Users can always change their own password if they reach this server action
    } else if (adminRole === 'admin') {
        // Admin can change anyone
    } else if (adminRole === 'sales_team_lead') {
        // TL can only change telecallers they personally created.
        if (targetData?.role !== 'sales_executive' || targetData?.createdBy !== adminId) {
            throw new Error('You can only reset credentials for members you have personally onboarded.');
        }
    } else {
        throw new Error('Unauthorized: You do not have management privileges.');
    }

    await adminAuth.updateUser(userId, { password });
    
    return { success: true };

  } catch (error: any) {
    const errorMessage = handleAdminSDKError(error);
    return { success: false, error: errorMessage };
  }
}

const TransferTelecallerSchema = z.object({
  telecallerId: z.string().min(1),
  teamLeadId: z.string().min(1),
  adminId: z.string().min(1),
});

export async function transferTelecallerToTeamLead(values: z.infer<typeof TransferTelecallerSchema>): Promise<{ success: boolean; error?: string }> {
  try {
    const { telecallerId, teamLeadId, adminId } = TransferTelecallerSchema.parse(values);

    const adminDoc = await adminDb.collection('users').doc(adminId).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      throw new Error('Only admins can transfer telecallers between team leads.');
    }

    if (telecallerId === teamLeadId) {
      throw new Error('A telecaller cannot be transferred to themselves.');
    }

    const telecallerRef = adminDb.collection('users').doc(telecallerId);
    const teamLeadRef = adminDb.collection('users').doc(teamLeadId);
    const [telecallerDoc, teamLeadDoc] = await Promise.all([telecallerRef.get(), teamLeadRef.get()]);

    if (!telecallerDoc.exists) throw new Error('Telecaller profile not found.');
    if (!teamLeadDoc.exists) throw new Error('Team Lead profile not found.');

    const telecallerData = telecallerDoc.data();
    const teamLeadData = teamLeadDoc.data();

    if (telecallerData?.role !== 'sales_executive') {
      throw new Error('Only telecallers can be transferred with this action.');
    }

    if (teamLeadData?.role !== 'sales_team_lead') {
      throw new Error('Selected employee is not a Team Lead.');
    }

    const oldTeamspaceIds = normalizeSingleTeamspace(telecallerData?.teamspaceIds);
    const newTeamspaceIds = normalizeSingleTeamspace(teamLeadData?.teamspaceIds);

    if (newTeamspaceIds.length === 0) {
      throw new Error('Selected Team Lead does not have an assigned teamspace.');
    }

    const batch = adminDb.batch();

    batch.update(telecallerRef, {
      teamspaceIds: newTeamspaceIds,
      createdBy: teamLeadId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    oldTeamspaceIds.forEach((teamspaceId: string) => {
      if (!newTeamspaceIds.includes(teamspaceId)) {
        batch.update(adminDb.collection('teamspaces').doc(teamspaceId), {
          memberIds: FieldValue.arrayRemove(telecallerId),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    newTeamspaceIds.forEach((teamspaceId: string) => {
      batch.update(adminDb.collection('teamspaces').doc(teamspaceId), {
        memberIds: FieldValue.arrayUnion(telecallerId),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    await adminDb.collection('users').doc(telecallerId).collection('notifications').add({
      title: 'Team Transfer',
      description: `You have been transferred to ${teamLeadData?.displayName}'s team.`,
      type: 'team_transfer',
      timestamp: new Date().toISOString(),
      read: false,
      link: '/dashboard',
    });

    revalidatePath('/admin/users');
    revalidatePath(`/team/${telecallerId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}
