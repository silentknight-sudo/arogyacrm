'use server';

import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { LineItemSchema } from '../inventory/schemas';
import type { DealStage } from '@/types';

const CreateDealSchema = z.object({
    name: z.string().min(2, 'Deal name must be at least 2 characters.'),
    amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
    stage: z.enum(['new', 'interested', 'not interested', 'not connect', 'CNP', 'done']),
    type: z.string().min(1, 'Deal type is required.'),
    closeDate: z.string().min(1, 'Close date is required.'),
    contactId: z.string().min(1, 'Contact is required.'),
    ownerId: z.string().min(1, 'Owner ID is required.'),
    teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
    lineItems: z.array(LineItemSchema).min(1, 'At least one product is required for a deal.'),
});

export type CreateDealInput = z.infer<typeof CreateDealSchema>;
type CreateDealResult = { success: boolean; error?: string; dealId?: string };

export async function createDeal(values: CreateDealInput): Promise<CreateDealResult> {
    try {
        const validatedInput = CreateDealSchema.parse(values);

        // HIERARCHY INHERITANCE: Resolve the Team Lead ID for the deal
        const ownerDoc = await adminDb.collection('users').doc(validatedInput.ownerId).get();
        const ownerData = ownerDoc.data();
        let teamLeadId = '';
        
        if (ownerData?.role === 'sales_executive') {
            teamLeadId = ownerData.createdBy || '';
        } else if (ownerData?.role === 'sales_team_lead') {
            teamLeadId = validatedInput.ownerId;
        }

        const newDealRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('deals').doc();
        const newDealId = newDealRef.id;
        
        const newDealData = {
            id: newDealId,
            ...validatedInput,
            teamLeadId,
            amount: Number(validatedInput.amount),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        await newDealRef.set(newDealData);
        
        revalidatePath('/deals');

        return { success: true, dealId: newDealId };

    } catch (error: any) {
        return { success: false, error: handleAdminSDKError(error) };
    }
}

export async function updateDealStage(values: { dealId: string, teamspaceId: string, stage: DealStage }) {
    try {
        const { dealId, teamspaceId, stage } = values;
        const dealRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('deals').doc(dealId);
        
        await dealRef.update({
            stage,
            updatedAt: FieldValue.serverTimestamp(),
        });

        revalidatePath('/deals');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: handleAdminSDKError(error) };
    }
}

const BulkAssignDealsSchema = z.object({
  dealIds: z.array(z.string()).min(1),
  teamspaceId: z.string().min(1),
  newOwnerId: z.string().min(1),
  currentUserId: z.string().min(1),
});

export async function bulkAssignDeals(values: z.infer<typeof BulkAssignDealsSchema>)
: Promise<{ success: boolean; error?: string }> {
  try {
    const { dealIds, teamspaceId, newOwnerId, currentUserId } = BulkAssignDealsSchema.parse(values);

    const currentUserDoc = await adminDb.collection('users').doc(currentUserId).get();
    if (!currentUserDoc.exists) throw new Error('User context missing.');
    
    const currentUserData = currentUserDoc.data();
    const role = currentUserData?.role;

    // VALIDATE HIERARCHY
    if (role === 'admin') {
        const target = await adminDb.collection('users').doc(newOwnerId).get();
        if (target.data()?.role !== 'sales_team_lead') {
            throw new Error('Administrators can only reassign deals to Team Leaders.');
        }
    } else if (role === 'sales_team_lead') {
        const target = await adminDb.collection('users').doc(newOwnerId).get();
        const targetData = target.data();
        if (targetData?.role !== 'sales_executive' || targetData?.createdBy !== currentUserId) {
            throw new Error('You can only reassign deals to specialists you have onboarded.');
        }
    } else {
        throw new Error('Unauthorized: Executive authority required for reassignment.');
    }

    const batch = adminDb.batch();
    dealIds.forEach(id => {
      const ref = adminDb.collection('teamspaces').doc(teamspaceId).collection('deals').doc(id);
      batch.update(ref, {
        ownerId: newOwnerId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    revalidatePath('/deals');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: handleAdminSDKError(error) };
  }
}
