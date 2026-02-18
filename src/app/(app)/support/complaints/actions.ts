'use server';

import { getAdminInstances } from '@/firebase/admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const CreateComplaintSchema = z.object({
    subject: z.string().min(5, 'Subject is required.'),
    description: z.string().min(10, 'Description is required.'),
    status: z.enum(['Received', 'Investigating', 'Action Taken', 'Resolved', 'Closed']),
    contactId: z.string().min(1, 'Contact is required.'),
    assignedToId: z.string().min(1, 'Assigned user is required.'),
    severity: z.enum(['Minor', 'Moderate', 'Major', 'Critical']),
    teamspaceId: z.string().min(1, 'Teamspace ID is required.'),
});

export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>;
type CreateComplaintResult = { success: boolean; error?: string; complaintId?: string };

export async function createComplaint(values: CreateComplaintInput): Promise<CreateComplaintResult> {
    try {
        const { adminDb, serverTimestamp } = getAdminInstances();
        const validatedInput = CreateComplaintSchema.parse(values);

        const newComplaintRef = adminDb.collection('teamspaces').doc(validatedInput.teamspaceId).collection('complaints').doc();
        const newComplaintId = newComplaintRef.id;
        
        const newComplaintData = {
            id: newComplaintId,
            ...validatedInput,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await newComplaintRef.set(newComplaintData);
        
        revalidatePath('/support/complaints');

        return { success: true, complaintId: newComplaintId };

    } catch (error: any) {
        console.error('Error creating complaint:', error);
        
        let errorMessage = 'An unknown server error occurred.';

        if (error instanceof z.ZodError) {
            errorMessage = error.errors.map(e => e.message).join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return { success: false, error: `Failed to create complaint: ${errorMessage}` };
    }
}
    