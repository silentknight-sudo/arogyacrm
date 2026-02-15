
'use server';

import { adminDb, serverTimestamp } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateDealSchema = z.object({
    name: z.string().min(2, 'Deal name must be at least 2 characters.'),
    amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
    stage: z.enum(['New', 'Contacted', 'Qualified', 'Demo', 'Negotiation', 'Won', 'Lost']),
    closeDate: z.string().min(1, 'Close date is required.'),
    accountId: z.string().min(1, 'Account is required.'),
    contactId: z.string().optional(),
    ownerId: z.string().min(1, 'Owner ID is required.'),
    teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
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
        console.error('Error creating deal:', error);
        
        let errorMessage = 'An unknown server error occurred.';

        if (error instanceof z.ZodError) {
            errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return { success: false, error: `Failed to create deal: ${errorMessage}` };
    }
}
