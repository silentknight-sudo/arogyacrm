'use server';

import { adminDb, serverTimestamp, handleAdminSDKError } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { LineItemSchema } from '../inventory/schemas';

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
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newDealRef.set(newDealData);
        
        revalidatePath('/deals');

        return { success: true, dealId: newDealId };

    } catch (error: any) {
        const errorMessage = handleAdminSDKError(error);
        return { success: false, error: `Failed to create deal: ${errorMessage}` };
    }
}

export async function updateDealType(values: { dealId: string, teamspaceId: string, type: string }) {
    try {
        const { dealId, teamspaceId, type } = values;
        const dealRef = adminDb.collection('teamspaces').doc(teamspaceId).collection('deals').doc(dealId);
        
        await dealRef.update({
            type,
            updatedAt: serverTimestamp(),
        });

        revalidatePath('/deals');
        return { success: true };
    } catch (error: any) {
        const errorMessage = handleAdminSDKError(error);
        return { success: false, error: `Failed to update deal type: ${errorMessage}` };
    }
}
