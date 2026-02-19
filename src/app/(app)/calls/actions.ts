'use server';

import { adminDb, serverTimestamp } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateCallSchema = z.object({
    subject: z.string().min(2, 'Subject is required.'),
    callDate: z.string().min(1, 'Call date is required.'),
    callDurationMinutes: z.coerce.number().min(0, 'Duration must be a positive number.'),
    callType: z.enum(['Outbound', 'Inbound']),
    status: z.enum(['Completed', 'No Answer', 'Voicemail', 'Busy']),
    notes: z.string().optional(),
    callerId: z.string().min(1, 'Caller is required.'),
    teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
    relatedToEntityId: z.string().optional(),
    relatedToEntityType: z.string().optional(),
});

export type CreateCallInput = z.infer<typeof CreateCallSchema>;
type CreateCallResult = { success: boolean; error?: string; callId?: string };

export async function createCall(values: CreateCallInput): Promise<CreateCallResult> {
    try {
        const validatedInput = CreateCallSchema.parse(values);

        const newCallRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('calls').doc();
        const newCallId = newCallRef.id;
        
        const newCallData = {
            id: newCallId,
            ...validatedInput,
            callDurationMinutes: Number(validatedInput.callDurationMinutes),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newCallRef.set(newCallData);
        
        revalidatePath('/calls');

        return { success: true, callId: newCallId };

    } catch (error: any) {
        console.error('Error creating call log:', error);
        
        let errorMessage = 'An unknown server error occurred.';

        if (error instanceof z.ZodError) {
            errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return { success: false, error: `Failed to create call log: ${errorMessage}` };
    }
}
    