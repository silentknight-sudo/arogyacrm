'use server';

import { adminDb, FieldValue, handleAdminSDKError } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { LineItemSchema } from '../inventory/schemas';
import type { DealStage } from '@/types';

const CreateDealSchema = z.object({
    name: z.string().min(2, 'Deal name must be at least 2 characters.'),
    amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
    stage: z.enum(['done', 'pending', 'cancel', 'not connect', 'busy']),
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

        const newDealRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('deals').doc();
        const newDealId = newDealRef.id;
        
        const newDealData = {
            id: newDealId,
            ...validatedInput,
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
    if (!currentUserDoc.exists || !['admin', 'sales_team_lead'].includes(currentUserDoc.data()?.role)) {
      throw new Error('Unauthorized: Executive governance required for bulk delegation.');
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
