'use server';

import { adminDb, serverTimestamp, handleAdminSDKError } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateRefundSchema = z.object({
    salesOrderId: z.string().min(1, 'Sales Order is required.'),
    reason: z.string().min(1, 'Reason is required.'),
    amount: z.coerce.number().min(0, 'Amount must be a positive number.'),
    status: z.enum(['Pending', 'Approved', 'Rejected', 'Processed', 'Cancelled']),
    requestedById: z.string().min(1, 'Requestor is required.'),
    teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
});

export type CreateRefundInput = z.infer<typeof CreateRefundSchema>;
type CreateRefundResult = { success: boolean; error?: string; refundId?: string };

export async function createRefund(values: CreateRefundInput): Promise<CreateRefundResult> {
    try {
        const validatedInput = CreateRefundSchema.parse(values);

        const newRefundRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('refunds').doc();
        const newRefundId = newRefundRef.id;
        
        const newRefundData = {
            id: newRefundId,
            ...validatedInput,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newRefundRef.set(newRefundData);
        
        revalidatePath('/support/refunds');

        return { success: true, refundId: newRefundId };

    } catch (error: any) {
        const errorMessage = handleAdminSDKError(error);
        return { success: false, error: `Failed to create refund: ${errorMessage}` };
    }
}
