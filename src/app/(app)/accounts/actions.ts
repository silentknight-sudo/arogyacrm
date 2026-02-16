'use server';

import { getAdminInstances } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateAccountSchema = z.object({
    name: z.string().min(2, 'Account name must be at least 2 characters.'),
    industry: z.string().optional(),
    website: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    ownerId: z.string().min(1, 'Owner ID is required.'),
    teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
});

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>;
type CreateAccountResult = { success: boolean; error?: string; accountId?: string };

export async function createAccount(values: CreateAccountInput): Promise<CreateAccountResult> {
    try {
        const { adminDb, serverTimestamp } = getAdminInstances();
        const validatedInput = CreateAccountSchema.parse(values);

        const newAccountRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('accounts').doc();
        const newAccountId = newAccountRef.id;
        
        const newAccountData = {
            id: newAccountId,
            name: validatedInput.name,
            industry: validatedInput.industry || '',
            website: validatedInput.website || '',
            phone: validatedInput.phone || '',
            address: validatedInput.address || '',
            ownerId: validatedInput.ownerId,
            teamspaceId: validatedInput.teamspaceId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newAccountRef.set(newAccountData);
        
        revalidatePath('/accounts');

        return { success: true, accountId: newAccountId };

    } catch (error: any) {
        console.error('Error creating account:', error);
        
        let errorMessage = 'An unknown server error occurred.';

        if (error instanceof z.ZodError) {
            errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return { success: false, error: `Failed to create account: ${errorMessage}` };
    }
}
