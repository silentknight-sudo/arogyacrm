'use server';

import { adminDb, serverTimestamp, handleAdminSDKError } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateCampaignSchema = z.object({
    name: z.string().min(2, 'Campaign name must be at least 2 characters.'),
    type: z.string().min(2, 'Campaign type is required.'),
    status: z.enum(['Planned', 'Active', 'Completed', 'Paused', 'Cancelled']),
    budget: z.coerce.number().min(0, 'Budget must be a positive number.'),
    startDate: z.string().min(1, 'Start date is required.'),
    endDate: z.string().min(1, 'End date is required.'),
    ownerId: z.string().min(1, 'Owner ID is required.'),
    teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
    description: z.string().optional(),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;
type CreateCampaignResult = { success: boolean; error?: string; campaignId?: string };

export async function createCampaign(values: CreateCampaignInput): Promise<CreateCampaignResult> {
    try {
        const validatedInput = CreateCampaignSchema.parse(values);

        const newCampaignRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('campaigns').doc();
        const newCampaignId = newCampaignRef.id;
        
        const newCampaignData = {
            id: newCampaignId,
            ...validatedInput,
            budget: Number(validatedInput.budget),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newCampaignRef.set(newCampaignData);
        
        revalidatePath('/campaigns');

        return { success: true, campaignId: newCampaignId };

    } catch (error: any) {
        const errorMessage = handleAdminSDKError(error);
        return { success: false, error: `Failed to create campaign: ${errorMessage}` };
    }
}
