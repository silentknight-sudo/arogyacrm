'use server';

import { getAdminInstances } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { LineItemSchema } from '../schemas';

const CreateQuoteSchema = z.object({
    name: z.string().min(2, 'Quote name is required.'),
    accountId: z.string().min(1, 'Account is required.'),
    contactId: z.string().optional(),
    validUntil: z.string().min(1, 'Valid until date is required.'),
    status: z.enum(['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired']),
    lineItems: z.array(LineItemSchema).min(1, 'Quote must have at least one line item.'),
    ownerId: z.string().min(1, 'Owner is required.'),
    teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
});

export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;
type CreateQuoteResult = { success: boolean; error?: string; quoteId?: string };

export async function createQuote(values: CreateQuoteInput): Promise<CreateQuoteResult> {
    try {
        const { adminDb, serverTimestamp } = getAdminInstances();
        const validatedInput = CreateQuoteSchema.parse(values);

        const newQuoteRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('quotes').doc();
        const newQuoteId = newQuoteRef.id;
        
        const totalAmount = validatedInput.lineItems.reduce((sum, item) => sum + item.subtotal, 0);
        
        const newQuoteData = {
            id: newQuoteId,
            ...validatedInput,
            totalAmount,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newQuoteRef.set(newQuoteData);
        
        revalidatePath('/inventory/quotes');

        return { success: true, quoteId: newQuoteId };

    } catch (error: any) {
        console.error('Error creating quote:', error);
        
        let errorMessage = 'An unknown server error occurred.';

        if (error instanceof z.ZodError) {
            errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return { success: false, error: `Failed to create quote: ${errorMessage}` };
    }
}
    